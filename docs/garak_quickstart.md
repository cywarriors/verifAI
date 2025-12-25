# Garak Quick Start

Quick reference for using Garak with verifAI.

## Installation

```bash
pip install garak>=0.9.0
```

## Basic Usage

### 1. Check if Garak is Available

```python
from scanner.garak_integration import GARAK_AVAILABLE
print(f"Garak available: {GARAK_AVAILABLE}")
```

### 2. List Available Probes

```python
from scanner.garak_integration import GarakIntegration

garak = GarakIntegration()
print(garak.list_probes())  # All probes
print(garak.list_probes(category="injection"))  # By category
```

### 3. Run a Single Probe

```python
from scanner import ScannerEngine

scanner = ScannerEngine()
scanner.set_model("gpt-4", "openai", {"api_key": "sk-..."})

result = await scanner.run_probe("promptinject", use_garak=True)
print(result)
```

### 4. Run Full Scan with Garak

```python
results = await scanner.run_scan(include_garak=True)
print(f"Completed: {results['completed']}/{results['total_probes']}")
```

## Common Probes

| Probe Name | Category | Description |
|------------|----------|-------------|
| `promptinject` | injection | General prompt injection |
| `dan` | jailbreak | Do Anything Now jailbreak |
| `goodside` | injection | Goodside techniques |
| `encoding` | injection | Encoding attacks |
| `pii` | privacy | PII leakage |
| `toxicity` | safety | Toxic content |
| `knownbadsignatures` | safety | Bad signatures |

## API Integration

Garak probes are automatically included when creating scans via the API:

```bash
POST /api/v1/scans
{
  "name": "Security Scan",
  "model_name": "gpt-4",
  "model_type": "openai",
  "llm_config": {"api_key": "sk-..."}
}
```

## Configuration

Set timeout for Garak probes in `scanner/configs/default.yaml`:

```yaml
scanner:
  probes:
    timeout: 60  # Garak probes need more time
    max_concurrent: 3  # Reduce for Garak
```

## Troubleshooting

**Garak not found?**
```bash
pip install garak
```

**Probe timeout?**
Increase timeout in config file.

**API errors?**
Check API keys are set correctly.

For detailed documentation, see [Garak Integration Guide](garak_integration.md).

