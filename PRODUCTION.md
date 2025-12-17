# Production Deployment Guide

## System Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Python | 3.10 - 3.13 | ⚠️ Python 3.14+ NOT supported (pydantic/fastapi compatibility) |
| Node.js | 18+ | For frontend build |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Caching and job queues |
| Docker | 20.10+ | Container runtime |

## Pre-Deployment Checklist

- [ ] Verify Python version is 3.10-3.13
- [ ] Set strong `SECRET_KEY` in environment variables
- [ ] Configure production database credentials
- [ ] Set `DEBUG=false` in environment
- [ ] Configure proper `ALLOWED_HOSTS` and `CORS_ORIGINS`
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy for PostgreSQL
- [ ] Set up monitoring and alerting
- [ ] Review and configure logging
- [ ] Test database migrations
- [ ] Load test the application

## Environment Variables

### Required for Production

```bash
SECRET_KEY=<strong-random-key>
DATABASE_URL=postgresql://user:password@host:5432/llm_scanner
REDIS_URL=redis://host:6379/0
DEBUG=false
ENVIRONMENT=production
```

### Security Configuration

```bash
ALLOWED_HOSTS=["yourdomain.com","api.yourdomain.com"]
CORS_ORIGINS=["https://yourdomain.com"]
```

### Optional

```bash
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
S3_BUCKET=llm-scanner-reports
USE_MINIO=false
```

## Deployment Steps

### 1. Database Setup

```bash
# Create database
createdb llm_scanner

# Run migrations (ensure Python 3.10-3.13 is active)
cd backend
python -m alembic upgrade head
# Or on Windows with multiple Python versions:
# py -3.13 -m alembic upgrade head
```

### 2. Docker Production Deployment

```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f
```

### 3. Kubernetes Deployment

```bash
# Create secrets
kubectl create secret generic db-secret \
  --from-literal=url=postgresql://user:pass@host/db \
  --from-literal=user=postgres \
  --from-literal=password=password

kubectl create secret generic app-secret \
  --from-literal=secret-key=<your-secret-key>

# Apply configurations
kubectl apply -f deployment/k8s/
```

### 4. Health Checks

Monitor these endpoints:
- `GET /health` - Application health
- `GET /` - Basic connectivity

## Performance Tuning

### Database

- Enable connection pooling
- Configure appropriate pool sizes
- Set up read replicas for heavy read loads

### Application

- Adjust Gunicorn workers based on CPU cores
- Configure appropriate timeouts
- Enable caching where applicable

### Monitoring

- Set up application performance monitoring (APM)
- Configure log aggregation
- Set up alerting for errors and performance issues

## Backup and Recovery

### Database Backups

```bash
# Automated backup script
pg_dump -h host -U user llm_scanner > backup_$(date +%Y%m%d).sql
```

### Application Data

- Back up `scanner/results/` directory
- Export compliance mappings regularly
- Archive old scan reports

## Security Hardening

1. Use strong passwords for all services
2. Enable firewall rules
3. Use SSL/TLS for all connections
4. Regularly update dependencies
5. Review and rotate secrets
6. Enable audit logging
7. Implement rate limiting
8. Use security headers (already configured)

## Scaling

### Horizontal Scaling

- Use load balancer for multiple backend instances
- Scale Redis for session management
- Use database connection pooling

### Vertical Scaling

- Increase worker processes for Gunicorn
- Allocate more memory to PostgreSQL
- Increase Redis memory limits

## Troubleshooting

### Common Issues

1. **Python version incompatibility**
   - **Error**: `Pydantic V1 functionality isn't compatible with Python 3.14 or greater`
   - **Solution**: Use Python 3.10-3.13
   - **Windows**: `py -3.13 run.py` or create venv with `py -3.13 -m venv venv`

2. **Database connection errors**
   - Check connection string
   - Verify network connectivity
   - Check firewall rules

3. **High memory usage**
   - Review worker count
   - Check for memory leaks
   - Increase available memory

4. **Slow performance**
   - Review database queries
   - Check for N+1 queries
   - Enable query caching
   - Review probe execution timeouts

5. **Frontend proxy errors (ECONNREFUSED)**
   - Ensure backend is running on port 8000
   - Check `vite.config.js` proxy settings match backend port
   - Verify no firewall blocking localhost connections

## Support

For production support issues, contact the development team.

