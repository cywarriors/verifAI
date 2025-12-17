"""Test configuration and fixtures for smoke tests"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.db.models import User, UserRole
from app.core.security import get_password_hash, create_access_token


# Create in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Shared session for each test
_test_session: Session = None


def get_test_db():
    """Get the shared test database session"""
    global _test_session
    try:
        yield _test_session
    finally:
        pass


@pytest.fixture(scope="function")
def db_session():
    """Create tables and provide a database session for each test"""
    global _test_session
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    _test_session = TestingSessionLocal()
    
    # Override the dependency
    app.dependency_overrides[get_db] = get_test_db
    
    try:
        yield _test_session
    finally:
        _test_session.close()
        _test_session = None
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client - requires db_session to ensure proper setup"""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def test_user(db_session):
    """Create a test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("Test1234!"),
        full_name="Test User",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_user(db_session):
    """Create an admin test user"""
    user = User(
        username="adminuser",
        email="admin@example.com",
        hashed_password=get_password_hash("Admin1234!"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_user(db_session):
    """Create and return a test user for authenticated tests"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("Test1234!"),
        full_name="Test User",
        role=UserRole.USER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(auth_user):
    """Get authentication headers for test user"""
    # Create token (JWT requires sub to be string)
    token = create_access_token(data={"sub": str(auth_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def admin_auth_headers(db_session):
    """Get authentication headers for admin user"""
    user = User(
        username="adminuser",
        email="admin@example.com",
        hashed_password=get_password_hash("Admin1234!"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}
