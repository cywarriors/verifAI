# verifAI - Where AI Meets Assurance

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
cd verifAI

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
cd verifAI

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
- **API Docs**: http://localhost:8000/api/v1/docs

## 🧭 UI Navigation

The sidebar menu in the frontend is organized for quick access:

- Dashboard
- Scans
- Compliance
- Garak Scanner
- LLMTopTen Scanner
- AgentTopTen Scanner
- ART Scanner
- Counterfit Scanner
- Settings

Compliance now appears immediately after Scans, and scanner labels are consistent across the app.

## 🔍 Available Scanners

The platform supports multiple security scanning engines:

- **LLMTopTen**: Comprehensive OWASP LLM Top 10 vulnerability scanning (10 probes)
  - LLM01: Prompt Injection
  - LLM02: Insecure Output Handling
  - LLM03: Training Data Poisoning
  - LLM04: Model Denial of Service
  - LLM05: Supply Chain Vulnerabilities
  - LLM06: Sensitive Information Disclosure
  - LLM07: Insecure Plugin Design
  - LLM08: Excessive Agency
  - LLM09: Overreliance
  - LLM10: Model Theft

- **AgentTopTen**: Comprehensive OWASP Agentic AI Top 10 vulnerability scanning (10 probes)
  - AA01: Agent Goal Hijack
  - AA02: Tool Misuse
  - AA03: Identity & Privilege Abuse
  - AA04: Model Isolation Failure
  - AA05: Unauthorized Tool Access
  - AA06: Resource Exhaustion
  - AA07: Agent Orchestration Manipulation
  - AA08: Insecure Communication
  - AA09: Inadequate Agent Sandboxing
  - AA10: Insufficient Agent Monitoring

- **Garak**: Industry-standard LLM security framework with extensive probe library
- **Counterfit**: Azure Counterfit for advanced ML attack scenarios (optional)
- **ART**: Adversarial Robustness Toolbox for model robustness testing (optional)

Each scanner provides detailed vulnerability reports with:
- Example attack scenarios
- Prevention and mitigation strategies
- Risk scoring and severity assessment
- Compliance framework mapping

## 🔑 API Keys

Most scanners require a model/API key depending on the selected provider:

- OpenAI: `sk-...` (env: `OPENAI_API_KEY`)
- Anthropic: `sk-...` (env: `ANTHROPIC_API_KEY`)
- HuggingFace: `hf_...` or `HF_TOKEN` (env: `HUGGINGFACE_API_KEY` or `HF_TOKEN`)

You can enter keys directly in the scan forms (they are handled in-memory) or set them via environment variables for backend execution. For UI testing, you may use placeholders (non-functional) like:

- `sk-test-1234567890abcdef1234567890abcd`
- `hf_test_1234567890abcdef1234567890abcd`

Note: placeholder keys will not authenticate. Choose HuggingFace local mode where supported if you want to test UI flows without calling external APIs.

## 📋 Features

### Phase 1 MVP (✅ Complete)
- ✅ Garak integration for security scanning
- ✅ LLMTopTen scanner for OWASP LLM Top 10 vulnerabilities
- ✅ AgentTopTen scanner for OWASP Agentic AI Top 10 vulnerabilities
- ✅ Scan Orchestrator for job management
- ✅ React Dashboard for managing scans
- ✅ PDF/JSON report generation
- ✅ REST API for CI/CD integration
- ✅ JWT Authentication & Authorization
- ✅ Probe selection UI with expandable categories
- ✅ Compliance mapping (NIST AI RMF, ISO 42001, EU AI Act)

### Architecture Components

- **User Interfaces**: Web Dashboard (React), REST API
- **Application Services**: Scan Orchestrator, Plugin Manager, Compliance Engine, Report Generator, Policy Engine
- **Scanning Engine**: Garak Core, LLMTopTen (OWASP LLM Top 10), AgentTopTen (OWASP Agentic AI Top 10), Model Connectors, Sandbox Execution
- **Data Layer**: PostgreSQL, Redis, S3/MinIO
- **Infrastructure**: Kubernetes/Docker, CI/CD, Observability

## 📁 Project Structure

```
verifAI/
├── backend/          # FastAPI backend
├── frontend/         # React dashboard
├── scanner/          # Security scanning engine
│   ├── llmtopten/    # OWASP LLM Top 10 scanner
│   │   ├── probes/   # LLM01-LLM10 vulnerability probes
│   │   ├── generators/  # Model interaction components
│   │   ├── detectors/   # Vulnerability detection logic
│   │   └── evaluators/  # Result evaluation components
│   ├── agenttopten/  # OWASP Agentic AI Top 10 scanner
│   │   ├── probes/   # AA01-AA10 vulnerability probes
│   │   ├── generators/  # Agent interaction components
│   │   ├── detectors/   # Vulnerability detection logic
│   │   └── evaluators/  # Result evaluation components
│   ├── garak/        # Garak integration
│   ├── configs/      # Scanner configurations
│   └── scanner_engine.py  # Main orchestration engine
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
