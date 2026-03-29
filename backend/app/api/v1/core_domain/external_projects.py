"""
@AI-HINT: External Projects API endpoints - aggregates and serves freelance/remote
project & task listings scraped from RemoteOK, Jobicy, Arbeitnow, and other free APIs.
Provides project discovery for freelancers with built-in scam detection and filtering.
This is a KEY feature for platform growth - providing value to freelancers from day 1.

IMPORTANT: turso.execute() returns {"columns": [...], "rows": [[...], ...]}
           NOT a list of dicts. Use _rows_to_dicts() helper to convert.
           turso.fetch_one() returns a single list (row) or None.
           turso.fetch_scalar() returns a single value.
"""

import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List, Dict, Any

from app.db.turso_http import get_turso_http
from app.core.security import require_admin, get_current_active_user
from app.models.user import User
from app.services.external_project_scraper import (
    scrape_all_sources,
    save_projects_to_db,
)

logger = logging.getLogger("megilance.external_projects")

router = APIRouter()


# ============================================================================
# HELPERS - Convert Turso raw format to list of dicts
# ============================================================================

def _rows_to_dicts(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert Turso result {"columns": [...], "rows": [[...]]} to list of dicts"""
    if not result:
        return []
    columns = result.get("columns", [])
    rows = result.get("rows", [])
    return [dict(zip(columns, row)) for row in rows]


def _parse_project_tags(project: dict) -> dict:
    """Parse tags from JSON string in a project dict"""
    if isinstance(project.get("tags"), str):
        try:
            project["tags"] = json.loads(project["tags"])
        except Exception:
            project["tags"] = []
    return project


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

_table_created = False

def ensure_external_projects_table(turso):
    """Create external_projects table if it doesn't exist (runs once per process)"""
    global _table_created
    if _table_created:
        return

    turso.execute_many([
        {"q": """CREATE TABLE IF NOT EXISTS external_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_id TEXT UNIQUE NOT NULL,
            source_url TEXT NOT NULL,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            company_logo TEXT,
            description TEXT NOT NULL,
            description_plain TEXT,
            category TEXT DEFAULT 'Other',
            tags TEXT DEFAULT '[]',
            project_type TEXT DEFAULT 'remote',
            experience_level TEXT DEFAULT 'any',
            budget_min REAL,
            budget_max REAL,
            budget_currency TEXT DEFAULT 'USD',
            budget_period TEXT DEFAULT 'fixed',
            location TEXT DEFAULT 'Remote',
            geo TEXT,
            apply_url TEXT NOT NULL,
            trust_score REAL DEFAULT 0.5,
            is_verified INTEGER DEFAULT 0,
            is_flagged INTEGER DEFAULT 0,
            flag_reason TEXT,
            posted_at TEXT,
            scraped_at TEXT DEFAULT (datetime('now')),
            expires_at TEXT,
            views_count INTEGER DEFAULT 0,
            clicks_count INTEGER DEFAULT 0,
            saves_count INTEGER DEFAULT 0
        )""", "params": []},
        {"q": "CREATE INDEX IF NOT EXISTS idx_ext_projects_category ON external_projects(category)", "params": []},
        {"q": "CREATE INDEX IF NOT EXISTS idx_ext_projects_source ON external_projects(source)", "params": []},
        {"q": "CREATE INDEX IF NOT EXISTS idx_ext_projects_posted ON external_projects(posted_at DESC)", "params": []},
        {"q": "CREATE INDEX IF NOT EXISTS idx_ext_projects_trust ON external_projects(trust_score DESC)", "params": []},
        {"q": "CREATE INDEX IF NOT EXISTS idx_ext_projects_flagged ON external_projects(is_flagged)", "params": []},
    ])
    _table_created = True


# ============================================================================
# PUBLIC ENDPOINTS - No auth required (for attracting freelancers)
# ============================================================================

@router.get("/external-projects")
async def list_external_projects(
    query: Optional[str] = Query(None, max_length=200, description="Search in title, company, description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    source: Optional[str] = Query(None, description="Filter by source: remoteok, jobicy, arbeitnow"),
    project_type: Optional[str] = Query(None, description="Filter: remote, hybrid, onsite"),
    experience_level: Optional[str] = Query(None, description="Filter: Entry, Intermediate, Expert"),
    min_budget: Optional[float] = Query(None, ge=0, description="Minimum budget filter"),
    tags: Optional[str] = Query(None, description="Comma-separated tags to filter by"),
    sort_by: str = Query("posted_at", description="Sort field: posted_at, budget_max, trust_score"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List external project/task listings with search, filtering, and pagination.
    This endpoint is PUBLIC - no authentication required to attract freelancers.
    Results exclude flagged/scam listings by default.
    """
    try:
        turso = get_turso_http()
        ensure_external_projects_table(turso)
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")

    # Build query
    conditions = ["is_flagged = 0"]  # Always exclude flagged projects
    params: list = []

    if query:
        conditions.append("(title LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\' OR description_plain LIKE ? ESCAPE '\\')")
        safe_query = query.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
        q = f"%{safe_query}%"
        params.extend([q, q, q])

    if category:
        conditions.append("category = ?")
        params.append(category)

    if source:
        conditions.append("source = ?")
        params.append(source)

    if project_type:
        conditions.append("project_type = ?")
        params.append(project_type)

    if experience_level:
        conditions.append("experience_level = ?")
        params.append(experience_level)

    if min_budget:
        conditions.append("(budget_max >= ? OR budget_min >= ?)")
        params.extend([min_budget, min_budget])

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag in tag_list:
            conditions.append("tags LIKE ? ESCAPE '\\'")
            safe_tag = tag.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_')
            params.append(f"%{safe_tag}%")

    where = " AND ".join(conditions)

    # Validate sort field
    allowed_sorts = {"posted_at", "budget_max", "trust_score", "scraped_at", "title", "company"}
    if sort_by not in allowed_sorts:
        sort_by = "posted_at"
    order = "DESC" if sort_order.lower() == "desc" else "ASC"

    # Batch all queries in a SINGLE HTTP call to Turso for speed
    offset = (page - 1) * page_size
    statements = [
        {"q": f"SELECT COUNT(*) as cnt FROM external_projects WHERE {where}", "params": params},
        {"q": f"""SELECT * FROM external_projects WHERE {where}
                   ORDER BY {sort_by} {order}
                   LIMIT ? OFFSET ?""", "params": params + [page_size, offset]},
        {"q": "SELECT DISTINCT source FROM external_projects WHERE is_flagged = 0", "params": []},
        {"q": "SELECT MAX(scraped_at) as last FROM external_projects", "params": []},
    ]

    try:
        results = turso.execute_many(statements)
    except Exception as e:
        logger.error(f"Batch query error: {e}")
        raise HTTPException(status_code=500, detail="Query failed")

    # Parse results
    total = results[0]["rows"][0][0] if results[0]["rows"] else 0
    projects = [_parse_project_tags(p) for p in _rows_to_dicts(results[1])]
    sources = [r[0] for r in results[2].get("rows", [])]
    last_scraped = results[3]["rows"][0][0] if results[3]["rows"] else None

    return {
        "projects": projects,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
        "sources": sources,
        "last_scraped": last_scraped,
    }


@router.get("/external-projects/{project_id}")
async def get_external_project(project_id: int):
    """Get details of a specific external project listing"""
    try:
        turso = get_turso_http()
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

    result = turso.execute("SELECT * FROM external_projects WHERE id = ?", [project_id])
    rows = _rows_to_dicts(result)
    if not rows:
        raise HTTPException(status_code=404, detail="Project not found")

    project = _parse_project_tags(rows[0])

    # Increment view count
    turso.execute(
        "UPDATE external_projects SET views_count = views_count + 1 WHERE id = ?",
        [project_id]
    )

    return project


@router.post("/external-projects/{project_id}/click")
async def track_external_project_click(project_id: int):
    """Track when a freelancer clicks to apply for an external project"""
    try:
        turso = get_turso_http()
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

    row = turso.fetch_one("SELECT apply_url FROM external_projects WHERE id = ?", [project_id])
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")

    turso.execute(
        "UPDATE external_projects SET clicks_count = clicks_count + 1 WHERE id = ?",
        [project_id]
    )

    # row is a list — apply_url is the first (and only) column
    return {"apply_url": row[0], "tracked": True}


@router.get("/external-projects-categories")
async def get_external_project_categories():
    """Get available categories with project counts"""
    try:
        turso = get_turso_http()
        ensure_external_projects_table(turso)
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

    result = turso.execute("""
        SELECT category, COUNT(*) as count
        FROM external_projects
        WHERE is_flagged = 0
        GROUP BY category
        ORDER BY count DESC
    """)

    rows = _rows_to_dicts(result)
    return {
        "categories": [{"name": r["category"], "count": r["count"]} for r in rows]
    }


@router.get("/external-projects-stats")
async def get_external_project_stats():
    """Get statistics about external project listings"""
    try:
        turso = get_turso_http()
        ensure_external_projects_table(turso)
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

    # Batch all stat queries in one HTTP call
    statements = [
        {"q": "SELECT COUNT(*) FROM external_projects", "params": []},
        {"q": "SELECT COUNT(*) FROM external_projects WHERE is_verified = 1", "params": []},
        {"q": "SELECT COUNT(*) FROM external_projects WHERE is_flagged = 1", "params": []},
        {"q": "SELECT source, COUNT(*) as count FROM external_projects WHERE is_flagged = 0 GROUP BY source", "params": []},
        {"q": "SELECT category, COUNT(*) as count FROM external_projects WHERE is_flagged = 0 GROUP BY category ORDER BY count DESC LIMIT 10", "params": []},
        {"q": "SELECT AVG(trust_score) FROM external_projects WHERE is_flagged = 0", "params": []},
        {"q": "SELECT MAX(scraped_at) FROM external_projects", "params": []},
    ]

    try:
        results = turso.execute_many(statements)
    except Exception as e:
        logger.error(f"Stats batch query error: {e}")
        raise HTTPException(status_code=500, detail="Query failed")

    total_projects = results[0]["rows"][0][0] if results[0]["rows"] else 0
    verified_projects = results[1]["rows"][0][0] if results[1]["rows"] else 0
    flagged_projects = results[2]["rows"][0][0] if results[2]["rows"] else 0
    by_source = {r[0]: r[1] for r in results[3].get("rows", [])}
    by_category = {r[0]: r[1] for r in results[4].get("rows", [])}
    avg_trust = results[5]["rows"][0][0] if results[5]["rows"] else 0
    last_scrape_time = results[6]["rows"][0][0] if results[6]["rows"] else None

    return {
        "total_projects": total_projects,
        "verified_projects": verified_projects,
        "flagged_projects": flagged_projects,
        "by_source": by_source,
        "by_category": by_category,
        "avg_trust_score": round(avg_trust or 0, 2),
        "last_scrape_time": last_scrape_time,
    }


# ============================================================================
# ADMIN ENDPOINTS - Trigger scraping and manage listings
# ============================================================================

@router.post("/external-projects/scrape")
async def trigger_scrape(current_user: User = Depends(require_admin)):
    """
    Trigger an immediate scrape of all external project sources.
    This endpoint aggregates projects from RemoteOK, Jobicy, and Arbeitnow,
    applies scam detection, and saves results to the database.
    """
    try:
        turso = get_turso_http()
        ensure_external_projects_table(turso)
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")

    # Run scrapers
    started_at = datetime.now(timezone.utc)
    results = scrape_all_sources()

    # Save to database
    all_projects = results["all_projects"]
    db_result = save_projects_to_db(turso, all_projects)

    completed_at = datetime.now(timezone.utc)

    return {
        "status": "completed",
        "projects_scraped": results["stats"]["total_scraped"],
        "projects_added": db_result["inserted"],
        "projects_updated": db_result["updated"],
        "projects_flagged": results["stats"]["flagged"],
        "sources_scraped": results["stats"]["sources"],
        "errors": results["stats"]["errors"],
        "started_at": started_at.isoformat(),
        "completed_at": completed_at.isoformat(),
        "duration_seconds": (completed_at - started_at).total_seconds(),
    }


@router.post("/external-projects/{project_id}/flag")
async def flag_external_project(
    project_id: int,
    reason: str = Query(..., min_length=3),
    current_user: User = Depends(get_current_active_user)
):
    """Flag an external project as potentially fraudulent or spam"""
    try:
        turso = get_turso_http()
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

    row = turso.fetch_one("SELECT id FROM external_projects WHERE id = ?", [project_id])
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")

    turso.execute(
        "UPDATE external_projects SET is_flagged = 1, flag_reason = ? WHERE id = ?",
        [reason, project_id]
    )

    return {"message": "Project flagged for review", "project_id": project_id}


@router.delete("/external-projects/cleanup")
async def cleanup_old_projects(
    days: int = Query(90, ge=0, le=365),
    current_user: User = Depends(require_admin)
):
    """Remove external projects older than specified days. Use days=0 to clear ALL."""
    try:
        turso = get_turso_http()
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

    if days == 0:
        turso.execute("DELETE FROM external_projects")
        return {"message": "Cleared all external projects"}

    turso.execute(
        "DELETE FROM external_projects WHERE scraped_at < datetime('now', '-' || CAST(? AS TEXT) || ' days')",
        [days]
    )

    return {"message": f"Cleaned up projects older than {days} days"}
