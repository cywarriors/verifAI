# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+
- **Python 3.10 - 3.13** (⚠️ Python 3.14+ is NOT supported due to pydantic/fastapi compatibility issues)
- Node.js 18+

## Quick Start

### Docker Deployment

1. Clone the repository
2. Configure environment variables in `backend/.env`
3. Run `docker-compose up -d`
4. Access frontend at http://localhost:6789
5. Access backend API at http://localhost:8000

### Local Development

```bash
# Backend (use Python 3.10-3.13)
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: .\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python run.py

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

**Windows Users**: If you have multiple Python versions:
```powershell
py -3.13 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
py -3.13 run.py
```

## Production Deployment

### Kubernetes

1. Apply Kubernetes manifests:
   ```bash
   kubectl apply -f deployment/k8s/
   ```

2. Configure secrets
3. Set up ingress
4. Configure monitoring

### On-Premises

Use the provided Ansible playbooks for automated deployment.

## Troubleshooting

### Python Version Issues

**Error**: `Pydantic V1 functionality isn't compatible with Python 3.14 or greater`

**Solution**: Use Python 3.10-3.13. On Windows with multiple versions:
```powershell
py --list                    # List installed versions
py -3.13 run.py             # Run with specific version
```

### Backend Connection Refused

**Error**: `ECONNREFUSED` when frontend tries to reach backend

**Solution**: Ensure backend is running on port 8000:
```bash
cd backend && python run.py
```

