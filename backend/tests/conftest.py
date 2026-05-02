# @AI-HINT: Pytest configuration and fixtures for backend testing
# Provides test database, client, and common fixtures

import os
# Disable rate limiting before any app imports
os.environ.setdefault("TESTING", "1")

import pytest
import sys
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta, timezone

# Ensure backend root is on the path so `main` can be imported directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.models.user import User


# Test database URL (use in-memory SQLite for testing)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ==================== Database Fixtures ====================

@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create test database and session"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create test client with database override"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


# ==================== User Fixtures ====================

@pytest.fixture
def test_user(db: Session) -> User:
    """Create test user"""
    user = User(
        email="testuser@example.com",
        hashed_password=get_password_hash("TestPassword123!"),
        name="Test User",
        user_type="freelancer",
        role="freelancer",
        is_verified=True,
        is_active=True,
        joined_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db: Session) -> User:
    """Create admin user"""
    user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("AdminPass123!"),
        name="Admin User",
        user_type="admin",
        role="admin",
        is_verified=True,
        is_active=True,
        joined_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ==================== Authentication Fixtures ====================

@pytest.fixture
def auth_tokens(test_user: User) -> dict:
    """Create authentication tokens for test user"""
    access_token = create_access_token(
        subject=test_user.email,
        custom_claims={"user_id": test_user.id, "role": test_user.user_type}
    )
    refresh_token = create_refresh_token(
        subject=test_user.email,
        custom_claims={"user_id": test_user.id, "role": test_user.user_type}
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }


@pytest.fixture
def auth_headers(auth_tokens: dict) -> dict:
    """Create authorization headers"""
    return {
        "Authorization": f"Bearer {auth_tokens['access_token']}"
    }


@pytest.fixture
def admin_headers(admin_user: User) -> dict:
    """Create admin authorization headers"""
    access_token = create_access_token(
        subject=admin_user.email,
        custom_claims={"user_id": admin_user.id, "role": "admin"}
    )
    return {
        "Authorization": f"Bearer {access_token}"
    }


@pytest.fixture
def tokens(auth_tokens: dict) -> dict:
    """Alias for auth_tokens for backward compatibility with E2E tests."""
    return auth_tokens


# ==================== Configuration ====================

def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
