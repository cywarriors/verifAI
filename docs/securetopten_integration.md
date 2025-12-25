# SecureTopTen Scanner Integration

## Overview

SecureTopTen is a production-ready security scanner specifically designed to test LLM and Agentic AI applications against the **OWASP LLM Top 10** and **OWASP Agentic AI Top 10** vulnerabilities.

## Features

- **20 Comprehensive Probes**: 10 for OWASP LLM Top 10 + 10 for OWASP Agentic AI Top 10
- **Production-Ready**: Circuit breakers, caching, metrics, rate limiting
- **Integrated**: Works seamlessly with existing scanner engine
- **Configurable**: Enable/disable specific probe categories
- **Metrics & Monitoring**: Detailed vulnerability tracking and health metrics

## OWASP LLM Top 10 Probes

1. **LLM01: Prompt Injection** - Tests for prompt injection vulnerabilities
2. **LLM02: Insecure Output Handling** - Detects unescaped/unvalidated outputs
3. **LLM03: Training Data Poisoning** - Identifies potential training data issues
4. **LLM04: Model Denial of Service** - Tests for resource exhaustion attacks
5. **LLM05: Supply Chain Vulnerabilities** - Checks for dependency issues
6. **LLM06: Sensitive Information Disclosure** - Detects PII/credential leakage
7. **LLM07: Insecure Plugin Design** - Tests plugin/function calling security
8. **LLM08: Excessive Agency** - Identifies over-autonomous behavior
9. **LLM09: Overreliance** - Tests for blind trust issues
10. **LLM10: Model Theft** - Detects model information disclosure

## OWASP Agentic AI Top 10 Probes

1. **AA01: Agent Goal Hijack** - Tests for goal manipulation vulnerabilities
2. **AA02: Tool Misuse** - Detects unauthorized or dangerous tool usage
3. **AA03: Identity & Privilege Abuse** - Tests for privilege escalation
4. **AA04: Model Isolation Failure** - Checks isolation between agents
5. **AA05: Unauthorized Tool Access** - Tests tool authorization
6. **AA06: Resource Exhaustion** - Detects resource exhaustion attacks
7. **AA07: Agent Orchestration Manipulation** - Tests orchestration security
8. **AA08: Insecure Communication** - Checks for encrypted/unencrypted channels
9. **AA09: Inadequate Agent Sandboxing** - Tests sandbox escape attempts
10. **AA10: Insufficient Agent Monitoring** - Checks monitoring configuration

## Configuration

### Default Configuration

The scanner is configured in `scanner/configs/default.yaml`:

```yaml
securetopten:
  enabled: true
  timeout: 120  # seconds (longer for comprehensive scans)
  max_concurrent: 3
  retry_attempts: 2
  retry_delay: 1.0
  cache_enabled: true
  cache_ttl: 3600  # 1 hour
  rate_limit_per_minute: 60
  circuit_breaker_threshold: 5
  circuit_breaker_timeout: 60
  include_llm_top10: true  # Enable OWASP LLM Top 10 probes
  include_agentic_top10: true  # Enable OWASP Agentic AI Top 10 probes
```

### Environment Variables

You can override configuration via environment variables:

- `SECURETOPTEN_ENABLED` - Enable/disable scanner (true/false)
- `SECURETOPTEN_TIMEOUT` - Probe timeout in seconds
- `SECURETOPTEN_MAX_CONCURRENT` - Maximum concurrent probes
- `SECURETOPTEN_CACHE_ENABLED` - Enable result caching
- `SECURETOPTEN_CACHE_TTL` - Cache TTL in seconds
- `SECURETOPTEN_RATE_LIMIT_PER_MINUTE` - Rate limit per model

## Usage

### Using Scanner Engine

```python
from scanner.scanner_engine import ScannerEngine
from pathlib import Path

# Initialize scanner
engine = ScannerEngine(config_path=Path("scanner/configs/default.yaml"))

# Set model to scan
engine.set_model(
    model_name="gpt-4",
    model_type="openai",
    model_config={"api_key": "your-api-key"}
)

# Run a specific SecureTopTen probe
result = await engine.run_probe(
    "llm01_prompt_injection",
    use_securetopten=True
)

# Run all SecureTopTen probes
scan_results = await engine.run_scan(
    include_securetopten=True,
    category="owasp_llm_top10"  # or "owasp_agentic_top10"
)
```

### Direct Integration

```python
from scanner.securetopten import SecureTopTenIntegration, SecureTopTenConfig

# Initialize
config = SecureTopTenConfig()
scanner = SecureTopTenIntegration(config=config)

# List available probes
probes = scanner.list_probes()
print(f"Available probes: {probes}")

# Run a probe
result = await scanner.run_probe(
    probe_name="llm01_prompt_injection",
    model_name="gpt-4",
    model_type="openai",
    model_config={"api_key": "your-api-key"}
)

# Run multiple probes
results = await scanner.run_multiple_probes(
    probe_names=["llm01_prompt_injection", "llm02_insecure_output_handling"],
    model_name="gpt-4",
    model_type="openai",
    model_config={"api_key": "your-api-key"}
)
```

### Using Backend API

The SecureTopTen scanner is automatically available through the backend API. When you create a scan, specify `use_securetopten: true` in the scan configuration.

```json
{
  "model_name": "gpt-4",
  "model_type": "openai",
  "model_config": {"api_key": "..."},
  "probe_names": ["llm01_prompt_injection"],
  "use_securetopten": true
}
```

## Probe Results

Each probe returns a structured result:

```json
{
  "probe_name": "llm01_prompt_injection",
  "status": "completed",
  "result": {
    "passed": false,
    "findings": [
      {
        "type": "system_prompt_revelation",
        "severity": "high",
        "description": "Model may have revealed system instructions",
        "evidence": "..."
      }
    ],
    "risk_level": "high",
    "vulnerability_score": 0.5,
    "owasp_id": "LLM01"
  },
  "execution_time": 2.34,
  "source": "securetopten"
}
```

### Risk Levels

- **critical**: Immediate action required
- **high**: Address as soon as possible
- **medium**: Should be addressed
- **low**: Minor concern

## Metrics & Monitoring

Get health and metrics:

```python
# Health check
health = scanner.get_health()
print(health)

# Detailed metrics
metrics = scanner.get_metrics()
print(metrics)
```

Health metrics include:
- Success rate
- Total vulnerabilities found
- Probe statistics
- Circuit breaker state
- Cache statistics

## Production Features

### Circuit Breaker

Automatically opens circuit if too many failures occur, preventing cascade failures.

### Caching

Probe results are cached to avoid redundant API calls. Cache key includes:
- Probe name
- Model name/type
- Model configuration

### Rate Limiting

Prevents overwhelming models with too many requests. Configurable per model.

### Metrics Collection

Tracks:
- Probe execution statistics
- Vulnerability counts by type
- Error rates
- Response times

## Integration with Other Scanners

SecureTopTen works alongside other scanners:

- **Garak**: General LLM security testing
- **Counterfit**: Adversarial testing
- **ART**: Adversarial Robustness Toolbox
- **Custom Probes**: Your own security tests

All scanners are orchestrated through the unified ScannerEngine.

## Best Practices

1. **Start with LLM Top 10**: Test basic LLM vulnerabilities first
2. **Test Agentic Features**: If using agents, run Agentic AI Top 10 probes
3. **Review Findings**: Not all findings indicate actual vulnerabilities
4. **Monitor Metrics**: Track vulnerability trends over time
5. **Cache Results**: Use caching for repeated tests on same models
6. **Rate Limiting**: Configure appropriate limits for your model provider

## Troubleshooting

### Probe Not Found

Ensure the probe name matches exactly:
```python
# List available probes
probes = scanner.list_probes()
print(probes)
```

### Timeout Errors

Increase timeout in configuration:
```yaml
securetopten:
  timeout: 180  # Increase from default 120
```

### Circuit Breaker Open

Check for underlying issues causing failures. Circuit breaker resets after timeout period.

### High Vulnerability Count

Review findings carefully - some may be false positives. Adjust probe thresholds if needed.

## References

- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [OWASP Agentic AI Top 10](https://genai.owasp.org/)

## Support

For issues or questions, please refer to the main project documentation or open an issue on GitHub.

