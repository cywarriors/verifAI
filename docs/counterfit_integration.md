## Counterfit Integration Guide

This guide explains how to integrate and use [Counterfit](https://github.com/Azure/counterfit) – a CLI and library for automating ML security assessments – with verifAI.

> **Note**  
> Counterfit is a *generic* ML attack framework. To use it effectively with LLMs in verifAI, you must define project‑specific Counterfit targets and attacks. The verifAI integration provides a production‑ready wrapper (config, caching, metrics, circuit breaker), but does not ship opinionated targets by default.

### What the integration provides

- `scanner.counterfit` subpackage:
  - `CounterfitConfig` – loads settings from `scanner/configs/default.yaml` and `COUNTERFIT_*` env vars.
  - `CounterfitMetrics` – collects execution metrics and health status.
  - `CounterfitCache` – in‑memory caching of probe results with TTL + eviction.
  - `CounterfitCircuitBreaker` – protects against cascading failures.
  - `CounterfitIntegration` – implements the `ExternalScanner` interface used by `ScannerEngine`.
- Normalized, Garak‑style result format:

```python
{
    "probe_name": "cf_text_adversarial",
    "probe_info": {...},
    "status": "completed" or "error" / "timeout",
    "result": {
        "probe_name": "cf_text_adversarial",
        "passed": False,
        "risk_level": "medium",
        "findings": [...]
    },
    "source": "counterfit",
    "execution_time": 3.21,
    "attempt": 1
}
```

### Installation

Install Counterfit into the **scanner** or backend environment:

```bash
pip install "counterfit[dev]"
```

See the official repo for more details: [Azure/counterfit](https://github.com/Azure/counterfit).

### Configuration

The shared scanner config (`scanner/configs/default.yaml`) includes a dedicated `counterfit` section:

```yaml
counterfit:
  enabled: false           # set to true to enable Counterfit integration
  timeout: 60              # per-probe timeout (seconds)
  max_concurrent: 2        # concurrent Counterfit probes
  retry_attempts: 1
  retry_delay: 1.0
  cache_enabled: true
  cache_ttl: 3600          # cache results for one hour
  rate_limit_per_minute: 30
  circuit_breaker_threshold: 5
  circuit_breaker_timeout: 60
```

You can override any value via environment variables:

- `COUNTERFIT_ENABLED=true`
- `COUNTERFIT_TIMEOUT=120`
- `COUNTERFIT_MAX_CONCURRENT=4`
- `COUNTERFIT_CACHE_ENABLED=false`
- etc.

### Enabling Counterfit in the scanner

1. Ensure Counterfit is installed and importable.
2. Set `counterfit.enabled: true` in `scanner/configs/default.yaml` (or `COUNTERFIT_ENABLED=true`).
3. Run the scanner or backend; `ScannerEngine` will automatically register the Counterfit integration and log something like:

```text
Counterfit integration registered with 3 probes
```

### Selecting Counterfit from the UI / API

- **Frontend** (`ScanCreate` page):
  - Choose **Security Scanner → Counterfit**; the UI will send `scanner_type="counterfit"` in the scan request.
- **API**:

```bash
curl -X POST http://localhost:8000/api/v1/scans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 Counterfit Scan",
    "model_name": "gpt-4",
    "model_type": "openai",
    "scanner_type": "counterfit",
    "llm_config": {
      "api_key": "sk-...",
      "counterfit_target": "my_text_target",
      "counterfit_attack": "hop_skip_jump"
    }
  }'
```

The `ScanOrchestrator` detects `scanner_type=counterfit` and routes execution through `CounterfitIntegration`.

### Wiring Counterfit targets and attacks

The verifAI integration expects **two keys** in `model_config`:

- `counterfit_target` – name or identifier for a project‑defined Counterfit target (e.g., a class that wraps your LLM).
- `counterfit_attack` – name of the Counterfit attack to run against that target.

Inside `CounterfitIntegration._execute_counterfit_probe`, you can implement the actual Counterfit logic, for example:

```python
from counterfit.core import Counterfit
from counterfit.targets import MyTextTarget

def _build_target(model_name, model_type, model_config):
    return MyTextTarget(model_name=model_name, model_type=model_type, config=model_config)

def _build_attack(target, attack_name):
    return Counterfit.build_attack(target, attack_name)
```

Once implemented, `CounterfitIntegration` will:

1. Run the attack via Counterfit.
2. Normalize the results into `{passed, risk_level, findings}`.
3. Feed them back into the standard vulnerability pipeline.

Until you add this project‑specific logic, the integration will return a clear error stating that `counterfit_target` / `counterfit_attack` and execution hooks must be configured.

### Health and metrics

`CounterfitIntegration` exposes:

- `get_health()` – high‑level health status, circuit breaker state, cache stats, config summary.
- `get_metrics()` – per‑probe statistics, error summary, recent executions, cache & circuit breaker state.

These are designed for future integration with observability stacks (Prometheus, Grafana, etc.).

### Best practices

- Start with **disabled by default** and explicitly enable Counterfit in non‑production environments while you refine targets and attacks.
- Keep **targets and attacks in a separate module** (e.g. `scanner/counterfit/targets/`) so they can evolve independently of the core integration.
- Use **rate limiting and circuit breakers** aggressively; Counterfit attacks can be computationally heavy and may generate many LLM/API calls.


