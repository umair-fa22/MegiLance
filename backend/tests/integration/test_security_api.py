"""
@AI-HINT: Integration tests for advanced security API (MFA, risk assessment, sessions)
Tests all endpoints in backend/app/api/v1/security.py
Skipped: requires full Turso DB + mocked security services
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta
import json




@pytest.mark.asyncio
class TestMFAEndpoints:
    """Test Multi-Factor Authentication endpoints"""
    
    async def test_setup_totp_mfa(self, client: AsyncClient, auth_headers: dict):
        """Test TOTP MFA setup"""
        response = await client.post(
            "/api/security/mfa/setup",
            json={"method": "totp", "device_name": "iPhone 15"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "secret" in data
        assert "qr_code" in data
        assert "backup_codes" in data
        assert len(data["backup_codes"]) == 10
    
    async def test_setup_sms_mfa(self, client: AsyncClient, auth_headers: dict):
        """Test SMS MFA setup"""
        response = await client.post(
            "/api/security/mfa/setup",
            json={"method": "sms", "phone_number": "+1234567890"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Verification code sent"
    
    async def test_setup_email_mfa(self, client: AsyncClient, auth_headers: dict):
        """Test Email MFA setup"""
        response = await client.post(
            "/api/security/mfa/setup",
            json={"method": "email", "email": "user@example.com"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Verification code sent"
    
    async def test_verify_mfa(self, client: AsyncClient, auth_headers: dict):
        """Test MFA code verification"""
        # Setup TOTP first
        setup_response = await client.post(
            "/api/security/mfa/setup",
            json={"method": "totp", "device_name": "Test Device"},
            headers=auth_headers
        )
        
        # Verify (using mock code in testing)
        response = await client.post(
            "/api/security/mfa/verify",
            json={"method": "totp", "code": "123456"},
            headers=auth_headers
        )
        assert response.status_code in [200, 400]  # 400 if code invalid
    
    async def test_disable_mfa(self, client: AsyncClient, auth_headers: dict):
        """Test MFA disabling"""
        response = await client.delete(
            "/api/security/mfa/disable",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "MFA disabled successfully"
    
    async def test_list_mfa_methods(self, client: AsyncClient, auth_headers: dict):
        """Test listing active MFA methods"""
        response = await client.get(
            "/api/security/mfa/methods",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["methods"], list)
    
    async def test_invalid_mfa_method(self, client: AsyncClient, auth_headers: dict):
        """Test invalid MFA method returns 400"""
        response = await client.post(
            "/api/security/mfa/setup",
            json={"method": "invalid_method"},
            headers=auth_headers
        )
        assert response.status_code == 400


@pytest.mark.asyncio
class TestRiskAssessment:
    """Test risk-based security endpoints"""
    
    async def test_assess_login_risk(self, client: AsyncClient, auth_headers: dict):
        """Test login risk assessment"""
        response = await client.post(
            "/api/security/risk-assessment",
            json={
                "event_type": "login_attempt",
                "ip_address": "192.168.1.1",
                "user_agent": "Mozilla/5.0",
                "location": {"country": "US", "city": "New York"}
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "risk_score" in data
        assert 0 <= data["risk_score"] <= 100
        assert "risk_level" in data
        assert data["risk_level"] in ["low", "medium", "high", "critical"]
        assert "factors" in data
    
    async def test_high_risk_detection(self, client: AsyncClient, auth_headers: dict):
        """Test detection of high-risk activity"""
        response = await client.post(
            "/api/security/risk-assessment",
            json={
                "event_type": "login_attempt",
                "ip_address": "1.2.3.4",  # Suspicious IP
                "user_agent": "curl/7.0",  # Suspicious user agent
                "location": {"country": "XX", "city": "Unknown"}
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["risk_score"] > 50  # Should be flagged as risky
    
    async def test_payment_risk_assessment(self, client: AsyncClient, auth_headers: dict):
        """Test payment transaction risk assessment"""
        response = await client.post(
            "/api/security/risk-assessment",
            json={
                "event_type": "payment",
                "amount": 10000.0,
                "currency": "USD",
                "recipient_id": 123
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "risk_score" in data


@pytest.mark.asyncio
class TestSessionManagement:
    """Test user session management endpoints"""
    
    async def test_list_active_sessions(self, client: AsyncClient, auth_headers: dict):
        """Test listing all active sessions"""
        response = await client.get(
            "/api/security/sessions",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["sessions"], list)
        if len(data["sessions"]) > 0:
            session = data["sessions"][0]
            assert "id" in session
            assert "device_info" in session
            assert "last_activity" in session
    
    async def test_revoke_session(self, client: AsyncClient, auth_headers: dict):
        """Test remote session revocation"""
        # Get sessions first
        sessions_response = await client.get(
            "/api/security/sessions",
            headers=auth_headers
        )
        sessions = sessions_response.json()["sessions"]
        
        if len(sessions) > 0:
            session_id = sessions[0]["id"]
            response = await client.delete(
                f"/api/security/sessions/{session_id}",
                headers=auth_headers
            )
            assert response.status_code in [200, 404]
    
    async def test_revoke_nonexistent_session(self, client: AsyncClient, auth_headers: dict):
        """Test revoking a session that doesn't exist"""
        response = await client.delete(
            "/api/security/sessions/999999",
            headers=auth_headers
        )
        assert response.status_code == 404


@pytest.mark.asyncio
class TestSecurityEvents:
    """Test security event logging"""
    
    async def test_get_security_events(self, client: AsyncClient, auth_headers: dict):
        """Test retrieving security event log"""
        response = await client.get(
            "/api/security/security-events",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["events"], list)
    
    async def test_filter_security_events_by_severity(self, client: AsyncClient, auth_headers: dict):
        """Test filtering events by severity"""
        response = await client.get(
            "/api/security/security-events?severity=high",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        for event in data["events"]:
            assert event["severity"] == "high"
    
    async def test_filter_security_events_by_type(self, client: AsyncClient, auth_headers: dict):
        """Test filtering events by type"""
        response = await client.get(
            "/api/security/security-events?event_type=login_attempt",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        for event in data["events"]:
            assert event["event_type"] == "login_attempt"


@pytest.mark.asyncio
class TestAuthenticationFlow:
    """Test complete authentication flow with MFA"""
    
    async def test_login_with_mfa_flow(self, client: AsyncClient):
        """Test complete login flow with MFA enabled"""
        # 1. Setup MFA
        register_response = await client.post(
            "/api/auth/register",
            json={
                "email": "mfa_user@example.com",
                "password": "TestPassword123!",
                "full_name": "MFA Test User",
                "user_type": "freelancer"
            }
        )
        assert register_response.status_code == 201
        
        # 2. Login
        login_response = await client.post(
            "/api/auth/login",
            json={
                "email": "mfa_user@example.com",
                "password": "TestPassword123!"
            }
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # 3. Enable MFA
        mfa_response = await client.post(
            "/api/security/mfa/setup",
            json={"method": "totp", "device_name": "Test"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert mfa_response.status_code == 200
        
        # 4. Subsequent login should require MFA
        # (Implementation depends on auth flow)


# Pytest fixtures
@pytest.fixture
async def client():
    """Create async HTTP client"""
    from main import app
    import httpx
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_headers(client: AsyncClient):
    """Create authenticated user and return auth headers"""
    # Register user
    register_response = await client.post(
        "/api/auth/register",
        json={
            "email": f"test_{datetime.now().timestamp()}@example.com",
            "password": "TestPassword123!",
            "full_name": "Test User",
            "user_type": "freelancer"
        }
    )
    
    # Login
    login_response = await client.post(
        "/api/auth/login",
        json={
            "email": register_response.json()["email"],
            "password": "TestPassword123!"
        }
    )
    
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
