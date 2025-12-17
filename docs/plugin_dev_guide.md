# Plugin Development Guide

## Creating a Custom Probe

Custom probes should be placed in the `scanner/probes/` directory, organized by category.

## Probe Structure

```python
probe_info = {
    "name": "probe_name",
    "category": "category_name",
    "description": "Probe description"
}

class ProbeClass:
    def test(self, model_response: str, **kwargs) -> Dict:
        """Test method that returns results"""
        return {
            "passed": bool,
            "findings": list,
            "risk_level": "critical|high|medium|low|info"
        }
```

## Probe Categories

- `injection`: Prompt injection and manipulation
- `privacy`: Data leakage and privacy
- `safety`: Toxic or harmful content
- `rag`: RAG-specific vulnerabilities
- `telecom`: Telecom/IoT specific
- `enterprise`: Enterprise-specific concerns

## Best Practices

1. Keep probes focused on a single vulnerability type
2. Return structured results
3. Include evidence and remediation suggestions
4. Test thoroughly before submission
5. Document any dependencies

## Example

See `scanner/probes/enterprise/pii_leakage_probe.py` for a complete example.

