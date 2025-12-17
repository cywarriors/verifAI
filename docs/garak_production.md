# Garak Integration - Production Ready Features

This document describes the production-ready features implemented in the Garak integration.

## Production Features

### 1. Configuration Management

Garak settings are configurable via:
- **YAML Config**: `scanner/configs/default.yaml`
- **Environment Variables**: Override any setting
- **Backend Settings**: `backend/app/config/settings.py`

```yaml
garak:
  enabled: true
  timeout: 60
  max_concurrent: 3
  retry_attempts: 2
  cache_enabled: true
  cache_ttl: 3600
  rate_limit_per_minute: 60
```

### 2. Result Caching

- **Automatic caching** of probe results
- **Configurable TTL** (default: 1 hour)
- **Cache key** based on probe name, model, and config
- **Automatic eviction** when cache is full
- **Cache statistics** available via metrics

**Benefits**:
- Reduces API calls
- Faster response times
- Lower costs

### 3. Circuit Breaker Pattern

Protects against cascading failures:
- **Automatic failure detection**
- **Circuit opens** after threshold failures
- **Automatic recovery** after timeout
- **Half-open state** for testing recovery

**Configuration**:
- `circuit_breaker_threshold`: 5 failures
- `circuit_breaker_timeout`: 60 seconds

### 4. Retry Logic

Automatic retry with exponential backoff:
- **Configurable attempts** (default: 2)
- **Exponential backoff** delay
- **Per-attempt logging**
- **Final error reporting**

### 5. Rate Limiting

Per-model rate limiting:
- **Configurable limit** (default: 60/minute)
- **Automatic cleanup** of old entries
- **Per-model tracking**

### 6. Metrics & Monitoring

Comprehensive metrics collection:
- **Execution times** (min, max, avg)
- **Success/failure rates**
- **Error summaries**
- **Recent execution history**
- **Health status**

**Access metrics**:
```python
garak = GarakIntegration()
metrics = garak.get_metrics()
health = garak.get_health()
```

### 7. Health Checks

Health check endpoint: `GET /health`

Returns:
- Overall system health
- Garak integration status
- Circuit breaker state
- Cache statistics
- Probe availability

### 8. Structured Logging

All operations are logged with:
- **Context information**
- **Execution times**
- **Error details**
- **Retry attempts**

### 9. Error Handling

Comprehensive error handling:
- **Graceful degradation**
- **Detailed error messages**
- **Exception tracking**
- **Error categorization**

## Configuration Examples

### Development

```yaml
garak:
  enabled: true
  timeout: 30
  max_concurrent: 5
  cache_enabled: false  # Disable for testing
  retry_attempts: 1
```

### Production

```yaml
garak:
  enabled: true
  timeout: 120
  max_concurrent: 2  # Conservative
  cache_enabled: true
  cache_ttl: 7200  # 2 hours
  retry_attempts: 3
  rate_limit_per_minute: 30  # Conservative
```

### High-Volume

```yaml
garak:
  enabled: true
  timeout: 60
  max_concurrent: 5
  cache_enabled: true
  cache_ttl: 3600
  retry_attempts: 2
  rate_limit_per_minute: 120
```

## Monitoring

### Health Check

```bash
curl http://localhost:8000/health
```

Response includes Garak health status.

### Metrics Endpoint

```python
from scanner.garak_integration import GarakIntegration

garak = GarakIntegration()
metrics = garak.get_metrics()

print(f"Success rate: {metrics['probe_stats']}")
print(f"Cache hit rate: {metrics['cache_stats']['hit_rate']}")
print(f"Circuit breaker: {metrics['circuit_breaker']['state']}")
```

## Best Practices

1. **Enable caching** in production
2. **Set appropriate timeouts** based on model response times
3. **Monitor circuit breaker** state
4. **Review metrics** regularly
5. **Adjust rate limits** based on API quotas
6. **Use health checks** for monitoring
7. **Log errors** for debugging

## Troubleshooting

### Circuit Breaker Open

**Symptom**: All probes fail immediately

**Solution**:
- Check model API availability
- Review error logs
- Wait for timeout period
- Manually reset: `garak.circuit_breaker.reset()`

### High Cache Miss Rate

**Symptom**: Low cache hit rate

**Solution**:
- Increase cache TTL
- Review cache key generation
- Check if models/configs are changing frequently

### Rate Limit Errors

**Symptom**: "Rate limit exceeded" errors

**Solution**:
- Reduce `max_concurrent`
- Increase `rate_limit_per_minute` if API allows
- Enable caching to reduce API calls

### Timeout Issues

**Symptom**: Frequent timeouts

**Solution**:
- Increase `timeout` setting
- Reduce `max_concurrent`
- Check model API response times
- Review network connectivity

## Performance Tuning

### Optimize for Speed

```yaml
garak:
  max_concurrent: 5
  cache_enabled: true
  cache_ttl: 7200  # Longer cache
  timeout: 30  # Shorter timeout
```

### Optimize for Reliability

```yaml
garak:
  max_concurrent: 2
  retry_attempts: 3
  timeout: 120
  circuit_breaker_threshold: 3
```

### Optimize for Cost

```yaml
garak:
  cache_enabled: true
  cache_ttl: 86400  # 24 hours
  rate_limit_per_minute: 30
  max_concurrent: 1
```

