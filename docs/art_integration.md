## ART Integration Guide

This guide explains how to integrate and use the [Adversarial Robustness Toolbox (ART)](https://github.com/Trusted-AI/adversarial-robustness-toolbox) with verifAI.

> **Note**  
> ART is a flexible research framework for building and evaluating adversarial attacks and defenses. To use it with arbitrary LLMs, you must define ART **estimators** that wrap your model APIs. The verifAI integration provides production-grade plumbing (config, metrics, cache, circuit breaker), but does not ship project-specific estimators or attacks by default.

### What the integration provides

- `scanner.art` subpackage:
  - `ARTConfig` – loads settings from `scanner/configs/default.yaml` and `ART_*` env vars.
  - `ARTMetrics` – collects execution metrics and health.
  - `ARTCache` – result caching with TTL and eviction.
  - `ARTCircuitBreaker` – protects downstream systems from repeated failures.
  - `ARTIntegration` – concrete `ExternalScanner` implementation used by `ScannerEngine`.
- Normalized result shape similar to Garak/Counterfit:

```python
{
    "probe_name": "art_text_attack",
    "probe_info": {...},
    "status": "completed",
    "result": {
        "probe_name": "art_text_attack",
        "passed": False,
        "risk_level": "medium",
        "findings": [...]
    },
    "source": "art",
    "execution_time": 2.8,
    "attempt": 1
}
```

Until you wire in a real ART estimator and attack, the integration returns a clear error describing what must be configured.

### Installation

Install ART into the scanner or backend environment:

```bash
pip install adversarial-robustness-toolbox
```

See the official repo for details: [Trusted-AI/adversarial-robustness-toolbox](https://github.com/Trusted-AI/adversarial-robustness-toolbox).

### Configuration

The shared scanner config (`scanner/configs/default.yaml`) includes an `art` section:

```yaml
art:
  enabled: false           # set to true to enable ART integration
  timeout: 60
  max_concurrent: 2
  retry_attempts: 1
  retry_delay: 1.0
  cache_enabled: true
  cache_ttl: 3600
  rate_limit_per_minute: 30
  circuit_breaker_threshold: 5
  circuit_breaker_timeout: 60
```

Environment overrides:

- `ART_ENABLED=true`
- `ART_TIMEOUT=120`
- `ART_MAX_CONCURRENT=4`
- `ART_CACHE_ENABLED=false`
- etc.

### Enabling ART in the scanner

1. Install the ART library.
2. Set `art.enabled: true` in `scanner/configs/default.yaml` (or `ART_ENABLED=true`).
3. Start the scanner or backend; `ScannerEngine` will detect ART and log:

```text
ART integration registered with 3 probes
```

### Selecting ART from the UI / API

- **Frontend**: select **Security Scanner → ART** when creating a scan; this posts `scanner_type="art"` to the backend.
- **API**:

```bash
curl -X POST http://localhost:8000/api/v1/scans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 ART Scan",
    "model_name": "gpt-4",
    "model_type": "openai",
    "scanner_type": "art",
    "llm_config": {
      "api_key": "sk-...",
      "art_estimator": "my_llm_estimator",
      "art_attack": "ProjectedGradientDescent"
    }
  }'
```

The `ScanOrchestrator` detects `scanner_type=art` and routes to `ARTIntegration`.

### Wiring ART estimators and attacks

The verifAI integration expects two keys in `model_config`:

- `art_estimator` – identifier for your ART estimator (e.g. `"my_llm_estimator"`).
- `art_attack` – name of the ART attack to run (e.g. `"ProjectedGradientDescent"`).

In `ARTIntegration._execute_art_probe`, you can implement the project‑specific logic:

```python
from art.attacks.evasion import ProjectedGradientDescent

def _build_estimator(model_name, model_type, model_config):
    # Wrap your LLM endpoint into an ART estimator
    return MyLLMEstimator(model_name=model_name, model_type=model_type, config=model_config)

def _build_attack(estimator, attack_name):
    if attack_name == "ProjectedGradientDescent":
        return ProjectedGradientDescent(estimator)
    ...
```

Once implemented, `ARTIntegration` will:

1. Run the ART attack on the estimator.
2. Parse the results into the normalized `{passed, risk_level, findings}` format.
3. Feed them into the same vulnerability and compliance pipeline as other scanners.

Until then, `_execute_art_probe` raises a descriptive error indicating that an estimator/attack must be configured.

### Health and metrics

`ARTIntegration` exposes:

- `get_health()` – overall status, recent success rate, circuit breaker and cache state, configuration snapshot.
- `get_metrics()` – per‑probe statistics and error summary, suitable for dashboards and alerts.

### Best practices

- Treat ART as an **advanced/optional** scanner and enable it per environment.
- Isolate ART estimator and attack definitions (e.g. `scanner/art/estimators.py`, `scanner/art/attacks.py`) so you can iterate without changing core integration code.
- Use ART particularly for:
  - Robustness testing of **classification** or **scoring** components inside your LLM pipeline.
  - Image/tabular ML models that sit alongside your LLM (e.g. content classifiers, fraud detectors).


