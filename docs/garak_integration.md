# Garak Integration Guide

This guide explains how to integrate and use [Garak](https://github.com/leondz/garak) - an LLM security testing framework - with SecureAI.

## What is Garak?

Garak is a comprehensive LLM security testing framework that provides a wide range of security probes for testing Large Language Models. It includes probes for:

- Prompt injection attacks
- Jailbreak attempts
- Data leakage
- Toxicity detection
- Encoding-based attacks
- And many more...

## Installation

### Option 1: Install Garak with Backend

```bash
cd backend
pip install garak>=0.9.0
```

### Option 2: Install with Scanner

This option installs Garak along with all scanner dependencies. This is recommended if you're using the scanner module directly or want all scanner capabilities.

#### Step 1: Create Virtual Environment (Recommended)

```bash
# From project root
cd scanner

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

#### Step 2: Install Dependencies

```bash
# Install all scanner dependencies including Garak
pip install -r requirements.txt
```

This will install:
- `garak>=0.9.0` - Garak security testing framework
- `openai>=1.0.0` - OpenAI API client
- `anthropic>=0.18.0` - Anthropic API client
- `httpx>=0.28.0` - HTTP client
- And other scanner dependencies

#### Step 3: Verify Installation

```bash
# Test Garak availability
python -c "from scanner.garak_integration import GARAK_AVAILABLE; print(f'Garak available: {GARAK_AVAILABLE}')"

# Or test with full import
python -c "from scanner.garak_integration import GarakIntegration; g = GarakIntegration(); print(f'Found {len(g.list_probes())} probes')"
```

#### Using Scanner from Backend

If you're using the scanner from the backend, ensure the scanner directory is in your Python path:

```python
import sys
from pathlib import Path

# Add scanner parent directory to path
scanner_path = Path(__file__).parent.parent / "scanner"
if str(scanner_path.parent) not in sys.path:
    sys.path.insert(0, str(scanner_path.parent))

# Now you can import
from scanner.garak_integration import GarakIntegration
```

The backend's `ScanOrchestrator` automatically handles this path setup.

#### Alternative: Install Only Garak

If you only need Garak without other scanner dependencies:

```bash
pip install garak>=0.9.0
```

### Option 3: Docker

Garak is included in the scanner Docker image. Ensure your `scanner/requirements.txt` includes:

```
garak>=0.9.0
```

## Quick Start

### 1. Verify Installation

```python
from scanner.garak_integration import GarakIntegration, GARAK_AVAILABLE

if GARAK_AVAILABLE:
    garak = GarakIntegration()
    print(f"Available probes: {len(garak.list_probes())}")
    for probe in garak.list_probes()[:10]:
        print(f"  - {probe}")
else:
    print("Garak not installed")
```

### 2. Run a Single Garak Probe

```python
from scanner import ScannerEngine

# Initialize scanner
scanner = ScannerEngine()

# Set model
scanner.set_model(
    model_name="gpt-4",
    model_type="openai",
    model_config={"api_key": "your-api-key"}
)

# Run a Garak probe
result = await scanner.run_probe("promptinject", use_garak=True)
print(result)
```

### 3. Run Full Scan with Garak Probes

```python
# Run scan including Garak probes
scan_results = await scanner.run_scan(include_garak=True)

print(f"Total probes: {scan_results['total_probes']}")
print(f"Completed: {scan_results['completed']}")
print(f"Failed: {scan_results['failed']}")
```

## Integration Architecture

```
┌─────────────────┐
│  Scanner Engine │
└────────┬────────┘
         │
         ├──► Custom Probes (ProbeLoader)
         │
         └──► Garak Probes (GarakIntegration)
                  │
                  └──► garak.run()
```

The scanner engine automatically:
1. Discovers available Garak probes
2. Falls back to Garak if a probe isn't found in custom probes
3. Runs probes concurrently with configurable limits
4. Parses results into a unified format

## Available Garak Probes

Garak provides many built-in probes. Common ones include:

### Injection Probes
- `promptinject` - General prompt injection attacks
- `goodside` - Goodside prompt injection techniques
- `encoding` - Encoding-based injection attacks
- `leetspeak` - Leetspeak obfuscation

### Jailbreak Probes
- `dan` - Do Anything Now (DAN) jailbreak
- `jailbreak` - General jailbreak attempts

### Safety Probes
- `knownbadsignatures` - Known bad signature detection
- `toxicity` - Toxic content detection

### Privacy Probes
- `pii` - PII leakage detection
- `secrets` - Secret leakage detection

### List All Available Probes

```python
from scanner.garak_integration import GarakIntegration

garak = GarakIntegration()

# List all probes
all_probes = garak.list_probes()
print(f"Total: {len(all_probes)} probes")

# List by category
injection_probes = garak.list_probes(category="injection")
jailbreak_probes = garak.list_probes(category="jailbreak")

# Get probe info
probe_info = garak.get_probe_info("promptinject")
print(probe_info)
```

## Using Garak with Backend API

The backend automatically uses Garak probes when available. No additional configuration needed!

### Via API

```bash
# Create a scan (Garak probes will be included automatically)
curl -X POST http://localhost:8000/api/v1/scans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GPT-4 Security Scan",
    "model_name": "gpt-4",
    "model_type": "openai",
    "llm_config": {
      "api_key": "your-api-key"
    }
  }'
```

The scan orchestrator will:
1. Try to use custom probes first
2. Automatically include Garak probes if available
3. Fall back gracefully if Garak is not installed

## Configuration

### Scanner Configuration

Edit `scanner/configs/default.yaml`:

```yaml
scanner:
  probes:
    timeout: 60              # Timeout for Garak probes (longer than custom)
    max_concurrent: 3        # Reduce for Garak (more resource intensive)
    retry_attempts: 2
```

### Model Configuration

Garak requires model-specific configuration:

#### OpenAI

```python
scanner.set_model(
    model_name="gpt-4",
    model_type="openai",
    model_config={
        "api_key": "sk-...",
        "temperature": 0.7,
        "max_tokens": 1000
    }
)
```

#### Anthropic

```python
scanner.set_model(
    model_name="claude-3-opus",
    model_type="anthropic",
    model_config={
        "api_key": "sk-ant-...",
        "max_tokens": 1000
    }
)
```

#### HuggingFace

```python
scanner.set_model(
    model_name="meta-llama/Llama-2-7b-chat-hf",
    model_type="huggingface",
    model_config={
        "device": "cuda",  # or "cpu"
        "max_length": 512
    }
)
```

## Advanced Usage

### Run Specific Garak Probes

```python
from scanner.garak_integration import GarakIntegration

garak = GarakIntegration()

# Run specific probes
results = await garak.run_multiple_probes(
    probe_names=["promptinject", "dan", "encoding"],
    model_name="gpt-4",
    model_type="openai",
    model_config={"api_key": "sk-..."},
    max_concurrent=2
)

for result in results:
    print(f"{result['probe_name']}: {result['status']}")
```

### Custom Probe Selection

```python
# Get all injection-related probes
injection_probes = garak.list_probes(category="injection")

# Run only injection probes
results = await scanner.run_scan(
    probe_names=injection_probes,
    include_garak=False  # Only use these specific probes
)
```

### Mix Custom and Garak Probes

```python
# Custom probes
custom_probes = scanner.probe_loader.list_probes()

# Garak probes
garak_probes = garak.list_probes(category="injection")

# Run both
all_probes = custom_probes + garak_probes
results = await scanner.run_scan(probe_names=all_probes)
```

## Result Format

Garak probe results are normalized to match custom probe format:

```python
{
    "probe_name": "promptinject",
    "probe_info": {
        "name": "promptinject",
        "description": "Prompt injection attacks",
        "tags": ["injection", "prompt"],
        "source": "garak"
    },
    "status": "completed",
    "result": {
        "probe_name": "promptinject",
        "passed": False,  # True if no vulnerabilities found
        "findings": [...],  # Detailed findings
        "risk_level": "high",  # critical|high|medium|low
        "hit_rate": 0.45  # Percentage of successful attacks
    },
    "source": "garak"
}
```

## Troubleshooting

### Garak Not Found

**Error**: `ImportError: Garak is not installed`

**Solution**:
```bash
pip install garak>=0.9.0
```

### Probe Not Found

**Error**: `Probe 'xyz' not found`

**Solution**: List available probes first:
```python
garak = GarakIntegration()
print(garak.list_probes())
```

### Timeout Errors

**Error**: `Probe execution exceeded X seconds`

**Solution**: Increase timeout in config:
```yaml
scanner:
  probes:
    timeout: 120  # Increase for slower models
```

### API Key Issues

**Error**: Authentication failures

**Solution**: Ensure API keys are set correctly:
```python
model_config = {
    "api_key": os.environ.get("OPENAI_API_KEY"),  # Use env vars
    # or
    "openai_api_key": "sk-...",  # Direct key
}
```

### Model Type Mismatch

**Error**: `Unsupported model type`

**Solution**: Garak supports:
- `openai` - OpenAI models
- `anthropic` - Anthropic models
- `huggingface` - HuggingFace models
- `replicate` - Replicate models
- `cohere` - Cohere models

Check Garak documentation for full list.

## Best Practices

### 1. Start with Common Probes

```python
# Start with essential probes
essential_probes = [
    "promptinject",  # Prompt injection
    "dan",          # Jailbreak
    "pii",          # Privacy
    "toxicity"      # Safety
]

results = await scanner.run_scan(probe_names=essential_probes)
```

### 2. Use Appropriate Timeouts

Garak probes can be slower than custom probes:
- Custom probes: 30 seconds
- Garak probes: 60-120 seconds

### 3. Limit Concurrency

Garak probes are resource-intensive:
- Custom probes: 5 concurrent
- Garak probes: 2-3 concurrent

### 4. Monitor API Usage

Garak probes make many API calls. Monitor:
- API rate limits
- Cost per scan
- Request quotas

### 5. Combine with Custom Probes

Use Garak for comprehensive coverage, custom probes for specific scenarios:

```python
# Custom probes for domain-specific tests
custom = scanner.probe_loader.list_probes(category="telecom")

# Garak for general security
garak_general = garak.list_probes(category="injection")

# Combine
all_probes = custom + garak_general
```

## Performance Considerations

### Execution Time

- **Custom probes**: ~0.5-2 seconds each
- **Garak probes**: ~5-30 seconds each
- **Full scan**: 5-15 minutes (depending on probe count)

### Resource Usage

- **Memory**: Garak probes use more memory
- **API Calls**: Each probe makes multiple API calls
- **Network**: Higher bandwidth usage

### Optimization Tips

1. **Selective Scanning**: Run only relevant probes
2. **Parallel Execution**: Use `max_concurrent` wisely
3. **Caching**: Cache model responses when possible
4. **Batch Processing**: Run scans during off-peak hours

## Examples

### Example 1: Quick Security Check

```python
from scanner import ScannerEngine

scanner = ScannerEngine()
scanner.set_model(
    model_name="gpt-4",
    model_type="openai",
    model_config={"api_key": "sk-..."}
)

# Quick check with essential probes
quick_probes = ["promptinject", "dan", "pii"]
results = await scanner.run_scan(probe_names=quick_probes, include_garak=True)

for result in results["results"]:
    if result.get("status") == "completed":
        probe_result = result.get("result", {})
        if not probe_result.get("passed"):
            print(f"⚠️  {result['probe_name']}: {probe_result.get('risk_level')}")
```

### Example 2: Comprehensive Scan

```python
# Get all available probes
all_custom = scanner.probe_loader.list_probes()
all_garak = garak.list_probes()

# Run comprehensive scan
results = await scanner.run_scan(
    probe_names=all_custom + all_garak,
    include_garak=True
)

# Analyze results
vulnerabilities = [
    r for r in results["results"]
    if r.get("status") == "completed" and 
    not r.get("result", {}).get("passed", True)
]

print(f"Found {len(vulnerabilities)} potential vulnerabilities")
```

### Example 3: Category-Specific Scan

```python
# Focus on injection attacks
injection_probes = garak.list_probes(category="injection")
custom_injection = scanner.probe_loader.list_probes(category="rag")

results = await scanner.run_scan(
    probe_names=injection_probes + custom_injection
)
```

## Additional Resources

- [Garak GitHub](https://github.com/leondz/garak)
- [Garak Documentation](https://garak.ai/)
- [Garak Probes List](https://github.com/leondz/garak/tree/main/garak/probes)

## Support

For issues with Garak integration:
1. Check Garak is installed: `pip list | grep garak`
2. Verify API keys are set correctly
3. Check logs for detailed error messages
4. Review Garak documentation for model-specific requirements

