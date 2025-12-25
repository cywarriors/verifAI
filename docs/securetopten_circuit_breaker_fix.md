# SecureTopTen Circuit Breaker Fix

## Issue
Circuit breaker was opening too quickly and not recovering properly, causing scans to fail with "Circuit breaker is OPEN" errors.

## Root Causes
1. Circuit breaker opened after only 5 failures (too sensitive)
2. No automatic recovery from OPEN state
3. Circuit breaker errors were being counted as probe failures, causing cascading failures
4. No proper state transition handling

## Fixes Applied

### 1. Improved Circuit Breaker State Management
- Added automatic transition from OPEN → HALF_OPEN after timeout
- Proper handling of HALF_OPEN state for recovery testing
- Better state transition logging

### 2. Adjusted Configuration
- **Failure threshold**: Increased from 5 to 10 (less sensitive)
- **Recovery timeout**: Reduced from 60s to 30s (faster recovery)

### 3. Better Error Handling
- Circuit breaker state checks don't count as probe failures
- Only actual probe execution failures increment the circuit breaker
- Successful executions properly reset the circuit breaker

### 4. Retry Logic Improvements
- When circuit is OPEN, automatically wait for timeout before retrying
- Graceful handling of circuit breaker states during retries

## Configuration

Updated in `scanner/configs/default.yaml`:
```yaml
securetopten:
  circuit_breaker_threshold: 10  # Increased from 5
  circuit_breaker_timeout: 30   # Reduced from 60
```

## Circuit Breaker States

1. **CLOSED**: Normal operation, probes execute normally
2. **OPEN**: Too many failures, probes are blocked
   - Automatically transitions to HALF_OPEN after timeout (30s)
3. **HALF_OPEN**: Testing recovery
   - After 2 successful probes, transitions to CLOSED
   - On failure, transitions back to OPEN

## Manual Reset

If needed, you can manually reset the circuit breaker:

```python
from scanner.securetopten import SecureTopTenIntegration

scanner = SecureTopTenIntegration()
scanner.reset_circuit_breaker()
```

## Monitoring

Check circuit breaker state:
```python
health = scanner.get_health()
print(health["circuit_breaker"])
```

## Best Practices

1. **Monitor circuit breaker state** in production logs
2. **Adjust thresholds** based on your failure patterns
3. **Use caching** to reduce probe executions and failures
4. **Set appropriate timeouts** for your model response times

