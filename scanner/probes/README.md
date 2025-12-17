# Custom Probes

This directory contains custom security probes for LLM scanning.

## Probe Structure

Each probe should be a Python file with a `probe_info` dictionary:

```python
probe_info = {
    "name": "probe_name",
    "category": "category_name",
    "description": "Probe description"
}
```

## Categories

- **injection**: Prompt injection and manipulation attacks
- **privacy**: Data leakage and privacy violations
- **safety**: Toxic or harmful content
- **rag**: RAG-specific vulnerabilities
- **telecom**: Telecom/IoT specific probes
- **enterprise**: Enterprise-specific security concerns

## Creating a Custom Probe

1. Create a new Python file in the appropriate category directory
2. Define the `probe_info` dictionary
3. Implement the probe logic
4. Register the probe in the PluginManager

