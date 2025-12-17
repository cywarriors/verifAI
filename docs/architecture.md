# Architecture Documentation

## High-Level Architecture

The LLM Security Scanner follows a microservices architecture with the following components:

### Components

1. **Backend API** (FastAPI)
   - RESTful API for scan management
   - Authentication and authorization
   - Report generation
   - Compliance mapping

2. **Frontend Dashboard** (React)
   - Web-based UI for managing scans
   - Visualization of results
   - Compliance reporting

3. **Scanner Engine**
   - Garak integration
   - Custom probes
   - Model connectors

4. **Data Layer**
   - PostgreSQL for relational data
   - Redis for caching and queues
   - S3/MinIO for report storage

### Architecture Diagram

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Backend API│
└──────┬──────┘
       │
       ├──────► PostgreSQL
       ├──────► Redis
       └──────► Scanner Engine
                    │
                    ├──► Garak
                    ├──► Custom Probes
                    └──► Model Connectors
```

