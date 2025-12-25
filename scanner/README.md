# verifAI Scanner

Production-ready LLM security scanner with dynamic probe loading and multi-model support.

## Overview

The scanner module provides a comprehensive security scanning engine for Large Language Models (LLMs). It supports:

- **Dynamic Probe Loading**: Automatically discovers and loads security probes from the `probes/` directory
- **Multi-Model Support**: Works with OpenAI, Anthropic, HuggingFace, and local models
- **Async Execution**: Concurrent probe execution with configurable limits
- **Production Ready**: Error handling, logging, timeouts, and graceful degradation

## Structure

```
scanner/
├── __init__.py              # Module exports
├── __main__.py              # CLI entry point
├── scanner_engine.py        # Main scanner engine
├── probe_loader.py          # Dynamic probe loader
├── model_connector.py       # Model provider connectors
├── requirements.txt         # Dependencies
├── Dockerfile              # Container image
├── configs/                # Configuration files
│   ├── default.yaml
│   ├── model_profiles.yaml
│   └── compliance_mapping.yaml
└── probes/                 # Security probes
    ├── enterprise/
    └── rag/
```

## Usage

### Basic Usage

```python
from scanner import ScannerEngine

# Initialize scanner
scanner = ScannerEngine()

# Set model to scan
scanner.set_model(
    model_name="gpt-4",
    model_type="openai",
    model_config={"api_key": "your-api-key"}
)

# Run a single probe
result = await scanner.run_probe("pii_leakage")

# Run full scan
scan_results = await scanner.run_scan()
```

### Integration with Backend

The scanner is automatically used by the backend's `ScanOrchestrator` when available. The orchestrator will:

1. Try to use the actual scanner engine
2. Fall back to simulation mode if scanner is not available
3. Log warnings if scanner cannot be loaded

### Creating Custom Probes

1. Create a Python file in the appropriate category directory (`probes/enterprise/`, `probes/rag/`, etc.)
2. Define `probe_info` dictionary:
   ```python
   probe_info = {
       "name": "my_probe",
       "category": "enterprise",
       "description": "Description of what this probe tests"
   }
   ```
3. Create a probe class with a `test()` method:
   ```python
   class MyProbe:
       def test(self, model_response: str, **kwargs) -> Dict:
           # Your probe logic
           return {
               "passed": bool,
               "findings": list,
               "risk_level": "critical|high|medium|low"
           }
   ```

The probe loader will automatically discover and load your probe.

## Configuration

Configuration is loaded from `configs/default.yaml`:

```yaml
scanner:
  probes:
    timeout: 30              # Probe execution timeout (seconds)
    max_concurrent: 5        # Maximum concurrent probes
    retry_attempts: 3       # Retry attempts on failure
  
  model:
    default_timeout: 30      # Model API timeout
    max_retries: 3           # Model API retries
    rate_limit_per_minute: 60
```

## Model Connectors

### OpenAI

```python
scanner.set_model(
    model_name="gpt-4",
    model_type="openai",
    model_config={"api_key": "sk-..."}
)
```

### Anthropic

```python
scanner.set_model(
    model_name="claude-3-opus",
    model_type="anthropic",
    model_config={"api_key": "sk-ant-..."}
)
```

### HuggingFace

```python
scanner.set_model(
    model_name="meta-llama/Llama-2-7b-chat-hf",
    model_type="huggingface",
    model_config={"device": "cpu"}  # or "cuda"
)
```

### Local (Ollama)

```python
scanner.set_model(
    model_name="llama2",
    model_type="local",
    model_config={"base_url": "http://localhost:11434"}
)
```

## Error Handling

The scanner includes comprehensive error handling:

- **Timeout Protection**: Probes are executed with configurable timeouts
- **Graceful Degradation**: Falls back to simulation if scanner unavailable
- **Error Logging**: All errors are logged with full context
- **Exception Handling**: Probes that fail don't crash the entire scan

## Logging

The scanner uses Python's standard logging module. Configure logging level:

```python
import logging
logging.getLogger("scanner").setLevel(logging.DEBUG)
```

## Docker

Build the scanner image:

```bash
docker build -t verifai-scanner ./scanner
```

## Dependencies

See `requirements.txt` for full dependency list. Key dependencies:

- `garak>=0.9.0` - Security probe framework (optional but recommended)
- `openai>=1.0.0` - OpenAI API client
- `anthropic>=0.18.0` - Anthropic API client
- `httpx>=0.28.0` - HTTP client
- `pyyaml>=6.0.1` - Configuration parsing

## Garak Integration

The scanner includes full integration with [Garak](https://github.com/leondz/garak), a comprehensive LLM security testing framework.

### Quick Start with Garak

```python
from scanner import ScannerEngine

scanner = ScannerEngine()
scanner.set_model("gpt-4", "openai", {"api_key": "sk-..."})

# Run scan with Garak probes included
results = await scanner.run_scan(include_garak=True)
```

### Using Garak Probes

```python
# List available Garak probes
from scanner.garak_integration import GarakIntegration

garak = GarakIntegration()
probes = garak.list_probes()
print(f"Available: {len(probes)} Garak probes")

# Run specific Garak probe
result = await scanner.run_probe("promptinject", use_garak=True)
```

See [Garak Integration Guide](../docs/garak_integration.md) for detailed documentation.

## Production Considerations

1. **API Keys**: Store securely in environment variables or secrets management
2. **Rate Limiting**: Configure appropriate rate limits for model APIs
3. **Resource Limits**: Set appropriate timeouts and concurrency limits
4. **Monitoring**: Monitor probe execution times and failure rates
5. **Error Recovery**: Implement retry logic for transient failures

## Troubleshooting

### Scanner Not Loading

If the backend cannot load the scanner:

1. Check Python version (3.10-3.13 required)
2. Verify scanner directory exists and is in Python path
3. Check that all dependencies are installed
4. Review logs for import errors

### Probe Execution Failures

- Check model API keys are valid
- Verify model name and type are correct
- Review timeout settings
- Check network connectivity for API calls

### Import Errors

Ensure the scanner directory is in the Python path:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "scanner"))
```

