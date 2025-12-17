.PHONY: help install dev build test clean docker-up docker-down migrate lint format

help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development servers"
	@echo "  make build        - Build for production"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-prod  - Start production Docker containers"
	@echo "  make migrate      - Run database migrations"
	@echo "  make lint         - Run linters"
	@echo "  make format       - Format code"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

install-dev:
	pip install -r requirements-dev.txt
	cd frontend && npm install

dev:
	docker-compose up

build:
	cd backend && python -m build
	cd frontend && npm run build

test:
	cd backend && pytest
	cd frontend && npm test

test-coverage:
	cd backend && pytest --cov=app --cov-report=html
	cd frontend && npm test -- --coverage

clean:
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	rm -rf backend/dist backend/build backend/*.egg-info
	rm -rf frontend/dist frontend/build frontend/node_modules/.cache
	rm -rf .pytest_cache .coverage htmlcov

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

docker-logs:
	docker-compose logs -f

docker-restart:
	docker-compose restart

migrate:
	cd backend && alembic upgrade head

migrate-create:
	cd backend && alembic revision --autogenerate -m "$(message)"

lint:
	cd backend && flake8 app && mypy app
	cd frontend && npm run lint

format:
	cd backend && black app && isort app
	cd frontend && npm run format || true

security-check:
	cd backend && pip-audit || true
	cd frontend && npm audit
