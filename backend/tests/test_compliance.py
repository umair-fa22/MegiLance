# @AI-HINT: Tests for compliance/GDPR endpoints
import pytest
from fastapi.testclient import TestClient
from main import app

app.router.on_startup.clear()
app.router.on_shutdown.clear()

client = TestClient(app)

_fake_db: dict = {}


def _reset_db():
    _fake_db.clear()
    _fake_db["users"] = []
    _fake_db["next_id"] = 1


def _col_val(val):
    if val is None:
        return {"type": "null", "value": None}
    if isinstance(val, bool):
        return {"type": "integer", "value": "1" if val else "0"}
    if isinstance(val, int):
        return {"type": "integer", "value": str(val)}
    if isinstance(val, float):
        return {"type": "float", "value": str(val)}
    return {"type": "text", "value": str(val)}


def _fake_execute_query(sql: str, params=None):
    sql_upper = sql.strip().upper()
    params = params or []

    if "REVOKED_TOKENS" in sql_upper:
        return {"cols": [], "rows": []}

    if sql_upper.startswith("SELECT") and "USERS" in sql_upper:
        if "WHERE EMAIL = ?" in sql_upper:
            email = str(params[0]).lower().strip() if params else ""
            matching = [u for u in _fake_db["users"] if u["email"] == email]
            if not matching:
                return {"cols": [], "rows": []}
            u = matching[0]
            cols = [{"name": k} for k in u.keys()]
            row = [_col_val(v) for v in u.values()]
            return {"cols": cols, "rows": [row]}
        if "WHERE ID = ?" in sql_upper:
            uid = int(params[0]) if params else -1
            matching = [u for u in _fake_db["users"] if u["id"] == uid]
            if not matching:
                return {"cols": [], "rows": []}
            u = matching[0]
            cols = [{"name": k} for k in u.keys()]
            row = [_col_val(v) for v in u.values()]
            return {"cols": cols, "rows": [row]}

    return {"cols": [], "rows": []}


def _seed_user():
    from app.core.security import get_password_hash, create_access_token
    uid = _fake_db["next_id"]
    _fake_db["next_id"] += 1
    user = {
        "id": uid,
        "email": "gdpruser@test.com",
        "hashed_password": get_password_hash("TestPass123!"),
        "is_active": True,
        "is_verified": True,
        "email_verified": True,
        "name": "GDPR Test User",
        "user_type": "client",
        "role": "client",
        "bio": "",
        "skills": "",
        "hourly_rate": 0,
        "profile_image_url": "",
        "location": "",
        "profile_data": "",
        "two_factor_enabled": False,
        "account_balance": 0,
        "joined_at": "2024-01-01T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "title": "",
        "portfolio_url": "",
    }
    _fake_db["users"].append(user)
    token = create_access_token(
        subject=user["email"],
        custom_claims={"user_id": uid, "role": "client"}
    )
    return uid, token


@pytest.fixture(autouse=True)
def _mock_turso(monkeypatch):
    _reset_db()
    targets = [
        "app.db.turso_http.execute_query",
        "app.api.v1.auth.execute_query",
        "app.services.auth_service.execute_query",
        "app.core.security.execute_query",
        "app.services.token_blacklist_service.execute_query",
    ]
    for target in targets:
        try:
            monkeypatch.setattr(target, _fake_execute_query)
        except AttributeError:
            pass
    yield


def test_compliance_status_requires_auth():
    """Compliance status endpoint requires auth."""
    resp = client.get("/api/compliance/status")
    assert resp.status_code in (401, 403)


def test_compliance_status():
    """Authenticated user can get compliance status."""
    uid, token = _seed_user()
    resp = client.get("/api/compliance/status", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "compliance" in data


def test_gdpr_export():
    """User can request data export."""
    uid, token = _seed_user()
    resp = client.post("/api/compliance/export?format=json", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "export" in data
    assert data["export"]["format"] == "json"


def test_gdpr_delete_account_request():
    """User can request account deletion."""
    uid, token = _seed_user()
    resp = client.post(
        "/api/compliance/delete-account",
        json={"reason": "No longer needed"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "deletion" in data
    assert data["deletion"]["status"] == "pending_confirmation"


def test_consent_management():
    """User can view and update consents."""
    uid, token = _seed_user()
    headers = {"Authorization": f"Bearer {token}"}

    # Get consents
    resp = client.get("/api/compliance/consents", headers=headers)
    assert resp.status_code == 200

    # Update consent
    resp = client.put(
        "/api/compliance/consents",
        json={"consent_type": "marketing", "granted": False},
        headers=headers
    )
    assert resp.status_code == 200


def test_retention_policies():
    """User can view retention policies."""
    uid, token = _seed_user()
    resp = client.get("/api/compliance/retention-policies", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "policies" in data
    assert len(data["policies"]) > 0
