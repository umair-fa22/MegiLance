# @AI-HINT: Service layer for public client showcase and statistics
# All database queries for the public-clients endpoints (no auth required)

from app.db.turso_http import execute_query
from typing import List, Optional, Dict, Any


def fetch_featured_clients(limit: int) -> List[List]:
    """Fetch featured clients from the database ordered by activity."""
    query = """
        SELECT 
            u.id, 
            COALESCE(u.name, u.first_name || ' ' || u.last_name) as name,
            u.location,
            u.profile_image_url,
            u.created_at,
            COUNT(DISTINCT p.id) as project_count,
            COALESCE(SUM(pay.amount), 0) as total_spent
        FROM users u
        LEFT JOIN projects p ON p.client_id = u.id
        LEFT JOIN payments pay ON pay.from_user_id = u.id AND pay.status = 'completed'
        WHERE LOWER(u.user_type) = 'client' 
          AND u.is_active = 1
        GROUP BY u.id, u.name, u.first_name, u.last_name, u.location, u.profile_image_url, u.created_at
        ORDER BY project_count DESC, total_spent DESC
        LIMIT ?
    """
    result = execute_query(query, [limit])
    if result and result.get("rows"):
        return result["rows"]
    return []


def _extract_scalar(result: Optional[Dict[str, Any]]) -> Any:
    """Extract a single scalar value from a query result."""
    if result and result.get("rows"):
        val = result["rows"][0][0]
        return val.get("value", 0) if isinstance(val, dict) else val
    return 0


def fetch_client_stats() -> Dict[str, Any]:
    """Fetch aggregate client statistics from the database."""
    total_clients = _extract_scalar(
        execute_query(
            "SELECT COUNT(*) FROM users WHERE LOWER(user_type) = 'client' AND is_active = 1",
            []
        )
    )

    total_projects = _extract_scalar(
        execute_query("SELECT COUNT(*) FROM projects", [])
    )

    total_spent_raw = _extract_scalar(
        execute_query(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'",
            []
        )
    )
    total_spent = float(total_spent_raw) if total_spent_raw else 0.0

    countries = _extract_scalar(
        execute_query(
            "SELECT COUNT(DISTINCT location) FROM users WHERE location IS NOT NULL AND location != ''",
            []
        )
    )

    return {
        "total_clients": total_clients,
        "total_projects": total_projects,
        "total_spent": total_spent,
        "countries": countries,
    }
