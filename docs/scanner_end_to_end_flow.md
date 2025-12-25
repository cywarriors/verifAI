## End-to-End Scanner Flow (Frontend → Backend → Engines)

This document describes how a scan request flows through verifAI from the UI, through the backend, into the scanner engine and the different LLM security scanners (built‑in probes, Garak, Counterfit, ART).

### 1. User starts a scan (Frontend)

1. The user opens the **Create New Scan** page in the React app (`ScanCreate.jsx`).
2. They configure:
   - **Model**:
     - `model_type` (e.g. `openai`, `anthropic`, `huggingface`, `custom`)
     - `model_name` (e.g. `gpt-4`, `claude-3-opus`)
     - `model_config` (API key, endpoint, temperature, etc.)
   - **Security scanner**:
     - `builtin` – verifAI first‑party probes only
     - `garak` – Garak LLM security framework
     - `counterfit` – Azure Counterfit (optional, ML attacks)
     - `art` – Adversarial Robustness Toolbox (optional)
     - `all` – combine built‑in + Garak where available
3. When they click **Start Scan**, the page calls `scansAPI.create()` which sends a `POST /api/v1/scans` request with a JSON body:

```json
{
  "name": "Production GPT-4 Security Audit",
  "description": "End-to-end security test",
  "model_name": "gpt-4",
  "model_type": "openai",
  "scanner_type": "garak",
  "llm_config": {
    "api_key": "sk-***",
    "endpoint": null,
    "temperature": 0.7
  }
}
```

### 2. API layer persists the scan and schedules execution

1. The FastAPI handler in `backend` (`POST /api/v1/scans`) validates the request using the `ScanCreate` Pydantic model.
2. It creates a `Scan` ORM record with:
   - `name`, `description`
   - `model_name`, `model_type`
   - `scanner_type` (enum `ScannerType`)
   - `model_config` (from `llm_config`)
   - `status = pending`
3. The API then creates a `ScanOrchestrator` instance and enqueues `execute_scan(scan.id)` as a FastAPI `BackgroundTask`.
4. The handler immediately returns a `ScanResponse` to the frontend so the UI can redirect to `/scans/{id}` and show progress.

### 3. ScanOrchestrator drives the scan lifecycle

`ScanOrchestrator.execute_scan(scan_id)` implements the main backend workflow:

1. Loads the `Scan` row from the database.
2. Sets `status = running`, `started_at = now()`, and commits.
3. Calls `_run_probes(scan)` to perform the actual security testing.
4. After probes finish:
   - Persists all `Vulnerability` records.
   - Computes `risk_score` and a severity summary.
   - Sets `status = completed`, `completed_at`, `duration`, `progress = 100`.
   - Stores a summary JSON under `scan.results`.
5. Triggers the `ComplianceEngine` to map vulnerabilities to frameworks (NIST AI RMF, ISO 42001, EU AI Act, etc.).

If anything fails, `status` is set to `failed` and the error is stored in `scan.results`.

### 4. Probe execution: scanner engine and external scanners

`ScanOrchestrator._run_probes()` chooses how to execute probes:

1. If the Python `scanner` package is not available, it falls back to a **simulation mode** that generates synthetic vulnerabilities for demo/air‑gapped deployments.
2. Otherwise it calls `_run_probes_with_scanner(scan)`, which:
   - Constructs a `ScannerEngine` from the `scanner` package.
   - Calls `scanner.set_model(model_name, model_type, model_config)` so the `ModelConnector` can talk to the LLM.
   - Uses `scan.scanner_type` to decide what to run:
     - `builtin`:
       - Uses only first‑party probes loaded via `ProbeLoader` from `scanner/probes/**`.
       - Calls `scanner.run_scan(probe_names=builtin_probes, include_garak=False)`.
     - `garak`:
       - Uses only Garak probes discovered via `GarakIntegration`.
       - Calls `scanner.run_scan(probe_names=garak_probes, include_garak=True)`.
     - `all`:
       - Combines both sets and runs them together.
     - `counterfit` / `art`:
       - Looks up the corresponding `ExternalScanner` implementation from `scanner_engine.external_scanners`.
       - Calls `ext.run_multiple_probes(...)` directly.
       - If the library is not installed or not configured, logs a warning and falls back to simulation.

Each probe execution returns a normalized result dictionary of the form:

```json
{
  "probe_name": "promptinject",
  "status": "completed",
  "result": {
    "passed": false,
    "risk_level": "high",
    "findings": [ ... ]
  },
  "source": "garak",
  "execution_time": 12.3
}
```

The orchestrator converts any `result` with `passed = false` into a `Vulnerability` row (title, description, severity, evidence, remediation, CVSS-like score, metadata).

### 5. External scanner abstraction (Garak, Counterfit, ART, future tools)

The `scanner` package defines a common interface in `external_scanners.py`:

- `ExternalScanner` (abstract base class) with:
  - `list_probes(category: Optional[str]) -> List[str]`
  - `get_probe_info(probe_name) -> Optional[Dict]`
  - `run_probe(...) -> Dict`
  - `run_multiple_probes(...) -> List[Dict]`
  - `get_health() -> Dict`
  - `get_metrics() -> Dict`

Concrete integrations:

- **Garak** (`scanner/garak/garak_integration.py`):
  - Full production integration with config, caching, circuit breaker, rate limiting, metrics.
  - Parses Garak’s output into the normalized `{passed, risk_level, findings}` shape.
- **Counterfit** (`scanner/counterfit_integration.py`):
  - Optional; only activated if the `counterfit` package is installed (`pip install "counterfit[dev]"` from `https://github.com/Azure/counterfit`).
  - Exposes conceptual probes (`cf_text_adversarial`, etc.).
  - Returns an informative error until you wire in project‑specific Counterfit targets and attacks.
- **ART** (`scanner/art_integration.py`):
  - Optional; only activated if `adversarial-robustness-toolbox` is installed (`pip install adversarial-robustness-toolbox` from `https://github.com/Trusted-AI/adversarial-robustness-toolbox`).
  - Exposes conceptual probes (`art_text_attack`, etc.).
  - Returns an informative error until you configure ART estimators for your models.

The `ScannerEngine` automatically registers any available implementations and exposes them via `self.external_scanners[name]`, so adding a new LLM scanner is as simple as:

1. Implementing `class MyScanner(ExternalScanner)`.
2. Registering it in `ScannerEngine.__init__`.
3. Adding a new `ScannerType` value and front‑end option.

### 6. Results, compliance, and UI

Once the scan completes:

1. The frontend polls `GET /api/v1/scans/{id}` for status and progress.
2. When `status = completed`, it displays:
   - Summary metrics from `scan.results` (total probes, risk score, counts).
   - The list of vulnerabilities via `GET /api/v1/scans/{id}/vulnerabilities`.
   - Compliance mappings via `GET /api/v1/compliance/{scan_id}/mappings` and `.../summary`.
3. Users can download a JSON or PDF report from the **Reports** endpoints documented in `docs/api_reference.md`.

### 7. Quick reference: end-to-end sequence

1. **UI** → `POST /api/v1/scans` with `model_*`, `scanner_type`, `llm_config`.
2. **API** → creates `Scan` row, schedules `ScanOrchestrator.execute_scan`.
3. **ScanOrchestrator** → initializes `ScannerEngine`, calls `_run_probes_with_scanner`.
4. **ScannerEngine**:
   - Sets up `ModelConnector`.
   - Chooses probes and scanner based on `scanner_type`.
   - Uses built‑in probes, `GarakIntegration`, `CounterfitIntegration`, `ARTIntegration`, or simulation.
5. **Results** → normalized probe results → `Vulnerability` rows + `scan.results`.
6. **ComplianceEngine** → maps vulnerabilities to frameworks.
7. **UI** → reads scan details, vulnerabilities, and compliance data for visualization and reporting.


