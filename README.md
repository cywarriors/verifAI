# Commercial LLM Security Scanner

A comprehensive security scanning solution for Large Language Models (LLMs) with compliance mapping, risk assessment, and automated reporting.

## 📋 Requirements

- **Python 3.10 - 3.13** (⚠️ Python 3.14+ is NOT supported due to pydantic/fastapi compatibility)
- Node.js 18+
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 15+ (production)
- Redis 7+ (production)

## 🚀 Quick Start

### Option 1: Docker (Recommended for Production)

```bash
# 1. Clone and setup
git clone <repository-url>
cd SecureAI

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# 3. Start with Docker
docker-compose up -d

# 4. Run migrations
docker-compose exec backend alembic upgrade head

# 5. Verify
curl http://localhost:8000/health
```

### Option 2: Local Development

```bash
# 1. Clone and setup
git clone <repository-url>
cd SecureAI

# 2. Setup backend (use Python 3.10-3.13)
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python run.py

# 3. Setup frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

Access the application:
- **Frontend**: http://localhost:6789
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

## 📋 Features

### Phase 1 MVP (✅ Complete)
- ✅ Garak integration for security scanning
- ✅ Scan Orchestrator for job management
- ✅ React Dashboard for managing scans
- ✅ PDF/JSON report generation
- ✅ REST API for CI/CD integration
- ✅ JWT Authentication & Authorization
- ✅ Custom security probes
- ✅ Compliance mapping (NIST AI RMF, ISO 42001, EU AI Act)

### Architecture Components

- **User Interfaces**: Web Dashboard (React), REST API
- **Application Services**: Scan Orchestrator, Plugin Manager, Compliance Engine, Report Generator, Policy Engine
- **Scanning Engine**: Garak Core, Custom Probes, Model Connectors, Sandbox Execution
- **Data Layer**: PostgreSQL, Redis, S3/MinIO
- **Infrastructure**: Kubernetes/Docker, CI/CD, Observability

## 📁 Project Structure

```
SecureAI/
├── backend/          # FastAPI backend
├── frontend/         # React dashboard
├── scanner/          # Security probes and configs
├── compliance/       # Framework mappings
├── deployment/       # K8s, Terraform, Ansible
└── docs/             # Documentation
```

See full structure in project root.

## 🔧 Development

### Using Make (Linux/Mac)

```bash
# Install dependencies
make install

# Start development servers
make dev

# Run tests
make test

# Format code
make format

# Lint code
make lint
```

### Manual Setup (Windows)

```powershell
# Backend
cd backend
py -3.13 -m venv venv           # Use Python 3.10-3.13
.\venv\Scripts\activate
pip install -r requirements.txt
pip install -r ../requirements-dev.txt
py -3.13 run.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html
```

## 🚢 Production Deployment

See [PRODUCTION.md](PRODUCTION.md) for detailed deployment guide.

Quick production setup:
```bash
# Build and start production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:8000/health
```

## 🔐 Security & Compliance

- Role-Based Access Control (RBAC)
- JWT Token Authentication
- Encrypted data storage
- Security headers middleware
- Compliance frameworks:
  - NIST AI RMF
  - ISO/IEC 42001
  - EU AI Act
  - India DPDP Act
  - Telecom/IoT Security

## 📚 Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api_reference.md)
- [Deployment Guide](PRODUCTION.md)
- [Garak Integration](docs/garak_integration.md) - Using Garak security probes
- [Plugin Development](docs/plugin_dev_guide.md)
- [Compliance Frameworks](docs/compliance_frameworks.md)
- [Roadmap](docs/roadmap.md)

## ✅ Production Readiness

- [x] Structure verified
- [x] All imports correct
- [x] Dependencies complete
- [x] Docker configuration ready
- [x] Database migrations configured
- [x] Security features enabled
- [x] Logging configured
- [x] Health checks in place
- [x] Documentation complete

See [VERIFICATION.md](VERIFICATION.md) and [CHECKLIST.md](CHECKLIST.md) for details.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

Proprietary - Commercial License. See [LICENSE](LICENSE) for details.
