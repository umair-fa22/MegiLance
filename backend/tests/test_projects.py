# @AI-HINT: Project API tests with mocked Turso database and auth dependencies
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from main import app
from app.core.security import get_current_active_user

# Disable startup hooks
app.router.on_startup.clear()
app.router.on_shutdown.clear()

client = TestClient(app)

# ---------------------------------------------------------------------------
# Fake data
# ---------------------------------------------------------------------------
PROJECT_COLUMNS = [
    "id", "title", "description", "category", "budget_type",
    "budget_min", "budget_max", "experience_level", "estimated_duration",
    "skills", "client_id", "status", "created_at", "updated_at",
]

_NOW = datetime.now(timezone.utc).isoformat()

SAMPLE_PROJECT_ROW = [
    1, "Build REST API", "A FastAPI backend project", "web-development",
    "fixed", 500.0, 2000.0, "intermediate", "1-3 months",
    "python,fastapi", 1, "open", _NOW, _NOW,
]


def _make_project_row(overrides: dict | None = None):
    base = dict(zip(PROJECT_COLUMNS, SAMPLE_PROJECT_ROW))
    base.update(overrides or {})
    return [base[c] for c in PROJECT_COLUMNS]


# ---------------------------------------------------------------------------
# Fake Turso client
# ---------------------------------------------------------------------------
class FakeTurso:
    """Mock TursoHTTP returning canned project data."""

    def __init__(self):
        self._projects = [_make_project_row()]

    def execute(self, sql: str, params=None):
        sql_u = sql.strip().upper()
        params = params or []

        # SELECT queries on projects table
        if sql_u.startswith("SELECT") and "FROM PROJECTS" in sql_u:
            # Single project by ID
            if "WHERE ID = ?" in sql_u:
                pid = params[0] if params else -1
                rows = [p for p in self._projects if p[0] == pid]
                return {"columns": PROJECT_COLUMNS, "rows": rows}
            # Last inserted by client_id (after INSERT)
            if "WHERE CLIENT_ID = ?" in sql_u and "ORDER BY ID DESC LIMIT 1" in sql_u:
                return {"columns": PROJECT_COLUMNS, "rows": self._projects[-1:]}
            # My-projects
            if "WHERE CLIENT_ID = ?" in sql_u:
                cid = params[0] if params else -1
                rows = [p for p in self._projects if p[10] == cid]
                return {"columns": PROJECT_COLUMNS, "rows": rows}
            # Default: list all
            return {"columns": PROJECT_COLUMNS, "rows": self._projects}

        # INSERT
        if sql_u.startswith("INSERT INTO PROJECTS"):
            new_id = max((p[0] for p in self._projects), default=0) + 1
            row = _make_project_row({
                "id": new_id,
                "title": params[0] if len(params) > 0 else "Untitled",
                "description": params[1] if len(params) > 1 else "",
                "category": params[2] if len(params) > 2 else "",
                "budget_type": params[3] if len(params) > 3 else "fixed",
                "budget_min": params[4] if len(params) > 4 else None,
                "budget_max": params[5] if len(params) > 5 else None,
                "experience_level": params[6] if len(params) > 6 else "",
                "estimated_duration": params[7] if len(params) > 7 else "",
                "skills": params[8] if len(params) > 8 else "",
                "client_id": params[9] if len(params) > 9 else 1,
                "status": params[10] if len(params) > 10 else "open",
                "created_at": params[11] if len(params) > 11 else _NOW,
                "updated_at": params[12] if len(params) > 12 else _NOW,
            })
            self._projects.append(row)
            return {"columns": [], "rows": []}

        return {"columns": [], "rows": []}

    def fetch_one(self, sql, params=None):
        result = self.execute(sql, params)
        rows = result.get("rows", [])
        return rows[0] if rows else None


# ---------------------------------------------------------------------------
# Fake user helpers
# ---------------------------------------------------------------------------
class _FakeUser:
    def __init__(self, **kw):
        self.id = kw.get("id", 1)
        self.email = kw.get("email", "client@test.com")
        self.user_type = kw.get("user_type", "client")
        self.role = kw.get("role", "User")
        self.name = kw.get("name", "Test Client")
        self.bio = kw.get("bio", "Experienced client looking for quality work.")
        self.location = kw.get("location", "New York")
        self.skills = kw.get("skills", "management,planning")
        self.is_active = kw.get("is_active", True)
        self.is_verified = True
        self.hourly_rate = 50
        self.profile_image_url = None
        self.profile_data = None
        self.two_factor_enabled = False
        self.first_name = None
        self.last_name = None
        self.joined_at = _NOW


_client_user = _FakeUser(user_type="client")
_freelancer_user = _FakeUser(id=2, email="freelancer@test.com", user_type="freelancer")


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def _mock_turso(monkeypatch):
    """Patch get_turso_http for the projects router."""
    fake = FakeTurso()
    monkeypatch.setattr("app.api.v1.projects_domain.projects.get_turso_http", lambda: fake)
    yield
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_list_projects():
    """GET /api/projects returns a list of projects."""
    resp = client.get("/api/projects")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["title"] == "Build REST API"


def test_list_projects_with_search():
    """GET /api/projects?search=REST filters results."""
    resp = client.get("/api/projects", params={"search": "REST"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_project_by_id():
    """GET /api/projects/1 returns a single project."""
    resp = client.get("/api/projects/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 1
    assert data["title"] == "Build REST API"


def test_get_project_not_found():
    """GET /api/projects/999 returns 404."""
    resp = client.get("/api/projects/999")
    assert resp.status_code == 404


def test_create_project_as_client():
    """POST /api/projects with valid client auth creates a project."""
    app.dependency_overrides[get_current_active_user] = lambda: _client_user
    payload = {
        "title": "New Website",
        "description": "Build a modern website",
        "category": "web-development",
        "budget_type": "fixed",
        "budget_min": 1000,
        "budget_max": 5000,
        "experience_level": "expert",
        "estimated_duration": "1-3 months",
        "skills": ["react", "nextjs"],
        "status": "open",
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "New Website"


def test_create_project_no_auth():
    """POST /api/projects without auth returns 401 or 403."""
    payload = {
        "title": "No Auth Project",
        "description": "Should fail",
        "category": "web",
        "budget_type": "fixed",
        "experience_level": "entry",
        "estimated_duration": "1 week",
        "skills": ["python"],
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code in (401, 403)


def test_create_project_invalid_data():
    """POST /api/projects with missing required fields returns 422."""
    app.dependency_overrides[get_current_active_user] = lambda: _client_user
    resp = client.post("/api/projects", json={"title": "Only title"})
    assert resp.status_code == 422


def test_create_project_as_freelancer_forbidden():
    """POST /api/projects as freelancer returns 403."""
    app.dependency_overrides[get_current_active_user] = lambda: _freelancer_user
    payload = {
        "title": "Freelancer Project",
        "description": "Should be rejected",
        "category": "web",
        "budget_type": "fixed",
        "experience_level": "entry",
        "estimated_duration": "1 week",
        "skills": ["python"],
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code == 403
