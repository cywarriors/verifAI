"""End-to-end tests for scan flow"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.db.models import User, Scan, ScanStatus
from app.core.security import get_password_hash

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    """Create test database"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    """Create test client"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Create test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get auth headers for test user"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpass123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_scan(client, auth_headers):
    """Test creating a scan"""
    scan_data = {
        "name": "Test Scan",
        "description": "Test description",
        "model_name": "gpt-4",
        "model_type": "openai",
        "scanner_type": "builtin",
        "llm_config": {
            "api_key": "test-key",
            "temperature": 0.7
        }
    }
    
    response = client.post(
        "/api/v1/scans/",
        json=scan_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Scan"
    assert data["status"] == "pending"
    assert data["scanner_type"] == "builtin"


def test_list_scans(client, auth_headers):
    """Test listing scans"""
    response = client.get("/api/v1/scans/", headers=auth_headers)
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_scan(client, auth_headers, db, test_user):
    """Test getting a specific scan"""
    # Create a scan first
    scan = Scan(
        name="Test Scan",
        model_name="gpt-4",
        model_type="openai",
        scanner_type="builtin",
        status=ScanStatus.PENDING,
        created_by=test_user.id
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    response = client.get(f"/api/v1/scans/{scan.id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == scan.id
    assert data["name"] == "Test Scan"


def test_scan_scanner_types(client, auth_headers):
    """Test different scanner types"""
    scanner_types = ["builtin", "llmtopten", "agenttopten", "garak", "counterfit", "art", "all"]
    
    for scanner_type in scanner_types:
        scan_data = {
            "name": f"Test Scan - {scanner_type}",
            "model_name": "gpt-4",
            "model_type": "openai",
            "scanner_type": scanner_type,
            "llm_config": {}
        }
        
        response = client.post(
            "/api/v1/scans/",
            json=scan_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        assert response.json()["scanner_type"] == scanner_type

