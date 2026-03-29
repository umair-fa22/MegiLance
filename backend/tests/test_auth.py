# @AI-HINT: Auth integration tests using mocked Turso execute_query
# Tests register, login, profile, refresh flow end-to-end
#
# Architecture note: auth endpoints call execute_query from turso_http directly
# (not via SQLAlchemy ORM), so we mock execute_query at all import locations.

import re
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from main import app

# Disable startup hooks (token blacklist init, etc.)
app.router.on_startup.clear()
app.router.on_shutdown.clear()

client = TestClient(app)

# ---------------------------------------------------------------------------
# In-memory store simulating the Turso database
# ---------------------------------------------------------------------------
_fake_db: dict = {}


def _reset_db():
    _fake_db.clear()
    _fake_db["users"] = []
    _fake_db["next_id"] = 1


def _col_val(val):
    """Convert a Python value to a Turso-style {type, value} cell."""
    if val is None:
        return {"type": "null", "value": None}
    if isinstance(val, bool):
        return {"type": "integer", "value": "1" if val else "0"}
    if isinstance(val, int):
        return {"type": "integer", "value": str(val)}
    if isinstance(val, float):
        return {"type": "float", "value": str(val)}
    return {"type": "text", "value": str(val)}


def _extract_col_names(sql: str) -> list[str]:
    """Parse column names from the SELECT ... FROM portion of a SQL query."""
    # Match everything between SELECT and FROM
    m = re.search(r"SELECT\s+(.+?)\s+FROM", sql, re.IGNORECASE | re.DOTALL)
    if not m:
        return []
    cols_str = m.group(1)
    # Split by comma, strip whitespace and newlines
    parts = [p.strip() for p in cols_str.split(",")]
    # Take last segment (handles table.column aliases)
    return [p.split()[-1].split(".")[-1] for p in parts if p]


def _select_user(user: dict, col_names: list[str]) -> dict:
    """Build a Turso-style result for a single user row."""
    cols = [{"name": c} for c in col_names]
    row = [_col_val(user.get(c)) for c in col_names]
    return {"cols": cols, "rows": [row]}


def _fake_execute_query(sql: str, params=None):
    """
    Simulate Turso HTTP execute_query.
    Returns: {"cols": [{"name": ...}], "rows": [[{"type":..,"value":..}, ...]]}
    """
    sql_upper = sql.strip().upper()
    params = params or []

    # ---- SELECT ----
    if sql_upper.startswith("SELECT"):
        # Revoked tokens / blacklist lookups
        if "REVOKED_TOKENS" in sql_upper:
            return {"cols": [], "rows": []}

        col_names = _extract_col_names(sql)

        # WHERE email = ?
        if "WHERE EMAIL = ?" in sql_upper:
            email = str(params[0]).lower().strip() if params else ""
            matching = [u for u in _fake_db["users"] if u["email"] == email]
            if not matching:
                return {"cols": [{"name": c} for c in col_names], "rows": []}
            return _select_user(matching[0], col_names)

        # WHERE email = ? AND id != ?  (update uniqueness check)
        if "WHERE EMAIL" in sql_upper and "ID !=" in sql_upper:
            email = str(params[0]).lower().strip() if params else ""
            excl_id = int(params[1]) if len(params) > 1 else -1
            matching = [u for u in _fake_db["users"]
                        if u["email"] == email and u["id"] != excl_id]
            if not matching:
                return {"cols": [{"name": c} for c in col_names], "rows": []}
            return _select_user(matching[0], col_names)

        # WHERE id = ?
        if "WHERE ID = ?" in sql_upper:
            uid = int(params[0]) if params else -1
            matching = [u for u in _fake_db["users"] if u["id"] == uid]
            if not matching:
                return {"cols": [{"name": c} for c in col_names], "rows": []}
            return _select_user(matching[0], col_names)

        # Fallthrough: empty result
        return {"cols": [], "rows": []}

    # ---- INSERT ----
    if sql_upper.startswith("INSERT"):
        if "USERS" in sql_upper and len(params) >= 19:
            user_id = _fake_db["next_id"]
            _fake_db["next_id"] += 1
            new_user = {
                "id": user_id,
                "email": str(params[0]).lower().strip(),
                "hashed_password": params[1],
                "is_active": params[2],
                "is_verified": params[3],
                "email_verified": params[4],
                "name": params[5],
                "user_type": params[6],
                "role": params[7],
                "bio": params[8],
                "skills": params[9],
                "hourly_rate": params[10],
                "profile_image_url": params[11],
                "location": params[12],
                "profile_data": params[13],
                "two_factor_enabled": params[14],
                "account_balance": params[15],
                "joined_at": params[16],
                "created_at": params[17],
                "updated_at": params[18],
                "title": "",
                "portfolio_url": "",
            }
            _fake_db["users"].append(new_user)
            return {"cols": [], "rows": []}

        # Revoked tokens insert
        return {"cols": [], "rows": []}

    # ---- UPDATE ----
    if sql_upper.startswith("UPDATE"):
        if "USERS" in sql_upper:
            # Parse SET field1 = ?, field2 = ? ... WHERE id|email = ?
            set_m = re.search(r"SET\s+(.+?)\s+WHERE", sql, re.IGNORECASE | re.DOTALL)
            if set_m:
                field_str = set_m.group(1)
                fields = [f.strip().split("=")[0].strip() for f in field_str.split(",")]
                # Determine lookup - last param is the WHERE value
                where_val = params[-1] if params else None
                for u in _fake_db["users"]:
                    match = False
                    if "WHERE ID" in sql_upper:
                        match = u["id"] == int(where_val) if where_val else False
                    elif "WHERE EMAIL" in sql_upper:
                        match = u["email"] == str(where_val).lower().strip() if where_val else False
                    if match:
                        for i, field in enumerate(fields):
                            if i < len(params) - 1:
                                u[field] = params[i]
                        break
            return {"cols": [], "rows": []}
        return {"cols": [], "rows": []}

    # ---- CREATE TABLE / other ----
    return {"cols": [], "rows": []}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def _mock_turso(monkeypatch):
    """Patch execute_query at every import site used in the auth flow."""
    _reset_db()
    targets = [
        "app.db.turso_http.execute_query",
        "app.api.v1.identity.auth.execute_query",
        "app.services.auth_service.execute_query",
        "app.core.security.execute_query",
        "app.services.token_blacklist_service.execute_query",
    ]
    for target in targets:
        try:
            monkeypatch.setattr(target, _fake_execute_query)
        except AttributeError:
            pass  # module may not have imported it yet
    yield


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
def test_register_login_and_profile_flow():
    """Full auth flow: register -> login -> get profile -> update profile."""

    # 1. Register
    register_payload = {
        "email": "alice@example.com",
        "password": "securePassword123!",
        "name": "Alice",
        "user_type": "Freelancer",
        "bio": "Experienced developer",
    }
    resp = client.post("/api/auth/register", json=register_payload)
    assert resp.status_code == 201, f"Register failed: {resp.text}"
    data = resp.json()
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["name"] == "Alice"

    # 2. Login
    resp = client.post("/api/auth/login", json={
        "email": register_payload["email"],
        "password": register_payload["password"],
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    tokens = resp.json()
    assert "access_token" in tokens
    assert tokens["user"]["email"] == "alice@example.com"
    access_token = tokens["access_token"]

    # 3. Get profile
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200, f"Get profile failed: {resp.text}"
    assert resp.json()["email"] == "alice@example.com"

    # 4. Update profile
    resp = client.put(
        "/api/auth/me",
        json={"name": "Alice Johnson", "location": "Karachi"},
        headers=headers,
    )
    assert resp.status_code == 200, f"Update profile failed: {resp.text}"
    assert resp.json()["name"] == "Alice Johnson"


def test_login_invalid_credentials():
    """Login with non-existent user returns 401."""
    resp = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "WrongPassword123!",
    })
    assert resp.status_code == 401


def test_register_duplicate_email():
    """Second registration with same email is rejected."""
    payload = {
        "email": "dup@example.com",
        "password": "securePassword123!",
        "name": "User1",
        "user_type": "client",
    }
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 201

    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"].lower()


def test_register_weak_password():
    """Weak password is rejected."""
    resp = client.post("/api/auth/register", json={
        "email": "weak@example.com",
        "password": "123",
        "name": "Weak",
        "user_type": "client",
    })
    assert resp.status_code in (400, 422)


def test_protected_endpoint_no_token():
    """Accessing /me without auth returns 401 or 403."""
    resp = client.get("/api/auth/me")
    assert resp.status_code in (401, 403)