# @AI-HINT: Portal service layer - all database operations for client and freelancer portal endpoints
import json
import logging
import time
from typing import Optional, List

from app.db.turso_http import execute_query, parse_date, get_turso_http
from app.services.db_utils import get_val as _get_val, safe_str as _safe_str

logger = logging.getLogger(__name__)

# Simple TTL cache for dashboard stats (avoids repeated slow Turso queries)
_stats_cache: dict = {}
STATS_CACHE_TTL = 120  # seconds


def _batch_scalar_queries(queries: list[dict]) -> list:
    """Execute multiple scalar queries in a single HTTP request to Turso.
    Each query dict has 'q' and 'params' keys.
    Returns a list of scalar values (first column of first row) for each query.
    """
    try:
        client = get_turso_http()
        results = client.execute_many(queries)
        values = []
        for result in results:
            rows = result.get("rows", [])
            if rows and len(rows[0]) > 0:
                val = rows[0][0]
                values.append(val)
            else:
                values.append(None)
        return values
    except Exception as e:
        logger.error(f"Batch query error: {e}")
        return [None] * len(queries)



# ==================== Client Dashboard ====================

def get_client_stats(client_id: int) -> dict:
    """Get all client dashboard statistics in a single batched HTTP request."""
    cache_key = f"client_stats_{client_id}"
    cached = _stats_cache.get(cache_key)
    if cached and time.time() - cached["ts"] < STATS_CACHE_TTL:
        return cached["data"]

    queries = [
        {"q": "SELECT COUNT(*) FROM projects WHERE client_id = ?", "params": [client_id]},
        {"q": "SELECT COUNT(*) FROM projects WHERE client_id = ? AND status IN ('open', 'in_progress')", "params": [client_id]},
        {"q": "SELECT COUNT(*) FROM projects WHERE client_id = ? AND status = 'completed'", "params": [client_id]},
        {"q": "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE from_user_id = ? AND status = 'completed'", "params": [client_id]},
        {"q": "SELECT COUNT(DISTINCT freelancer_id) FROM contracts WHERE client_id = ? AND status IN ('active', 'in_progress')", "params": [client_id]},
        {"q": "SELECT COUNT(*) FROM proposals pr JOIN projects p ON pr.project_id = p.id WHERE p.client_id = ? AND pr.status = 'submitted'", "params": [client_id]},
    ]

    values = _batch_scalar_queries(queries)

    result = {
        "total_projects": int(values[0] or 0),
        "active_projects": int(values[1] or 0),
        "completed_projects": int(values[2] or 0),
        "total_spent": float(values[3] or 0),
        "active_freelancers": int(values[4] or 0),
        "pending_proposals": int(values[5] or 0),
    }
    _stats_cache[cache_key] = {"ts": time.time(), "data": result}
    return result


def get_client_projects_list(client_id: int, status_filter: Optional[str],
                             limit: int, skip: int) -> dict:
    """Get client's projects with pagination."""
    where_sql = "WHERE client_id = ?"
    params = [client_id]

    if status_filter:
        where_sql += " AND status = ?"
        params.append(status_filter)

    count_result = execute_query(f"SELECT COUNT(*) FROM projects {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, title, description, status, budget_min, budget_max, created_at, updated_at
            FROM projects {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )

    projects = []
    if result and result.get("rows"):
        for row in result["rows"]:
            projects.append({
                "id": int(_get_val(row, 0) or 0),
                "title": _safe_str(_get_val(row, 1)),
                "description": _safe_str(_get_val(row, 2)),
                "status": _safe_str(_get_val(row, 3)),
                "budget_min": float(_get_val(row, 4) or 0),
                "budget_max": float(_get_val(row, 5) or 0),
                "created_at": parse_date(_get_val(row, 6)),
                "updated_at": parse_date(_get_val(row, 7))
            })

    return {"total": total, "projects": projects}


def create_project(client_id: int, title: str, description: str, budget_min: float,
                   budget_max: float, budget_type: str, category: str,
                   timeline: str, skills: list, now: str) -> dict:
    """Create a new project. Returns dict with id, title, status."""
    result = execute_query(
        """INSERT INTO projects (title, description, client_id, budget_min, budget_max,
           budget_type, category, estimated_duration, status, skills, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [title, description, client_id, budget_min, budget_max, budget_type,
         category, timeline, "open", json.dumps(skills), now, now]
    )

    if not result:
        return None

    get_result = execute_query(
        "SELECT id, title, status FROM projects WHERE client_id = ? ORDER BY id DESC LIMIT 1",
        [client_id]
    )

    project_id = 0
    if get_result and get_result.get("rows"):
        project_id = int(_get_val(get_result["rows"][0], 0) or 0)

    return {"id": project_id, "title": title, "status": "open"}


def get_client_proposals_list(client_id: int, project_id: Optional[int],
                              limit: int, skip: int) -> dict:
    """Get proposals for client's projects."""
    where_sql = "WHERE p.client_id = ?"
    params = [client_id]

    if project_id:
        where_sql += " AND pr.project_id = ?"
        params.append(project_id)

    count_result = execute_query(
        f"""SELECT COUNT(*) FROM proposals pr
            JOIN projects p ON pr.project_id = p.id
            {where_sql}""",
        params
    )
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT pr.id, pr.project_id, pr.freelancer_id, pr.status,
            pr.estimated_hours, pr.hourly_rate, pr.created_at
            FROM proposals pr
            JOIN projects p ON pr.project_id = p.id
            {where_sql}
            ORDER BY pr.created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )

    proposals = []
    if result and result.get("rows"):
        for row in result["rows"]:
            proposals.append({
                "id": int(_get_val(row, 0) or 0),
                "project_id": int(_get_val(row, 1) or 0),
                "freelancer_id": int(_get_val(row, 2) or 0),
                "status": _safe_str(_get_val(row, 3)),
                "estimated_hours": float(_get_val(row, 4) or 0),
                "hourly_rate": float(_get_val(row, 5) or 0),
                "created_at": parse_date(_get_val(row, 6))
            })

    return {"total": total, "proposals": proposals}


def get_payments_list(user_id: int, direction: str, limit: int, skip: int) -> dict:
    """Get payment history. direction='from' for client, 'to' for freelancer."""
    col = "from_user_id" if direction == "from" else "to_user_id"

    count_result = execute_query(f"SELECT COUNT(*) FROM payments WHERE {col} = ?", [user_id])
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    result = execute_query(
        f"""SELECT id, amount, status, payment_type, description, created_at
           FROM payments
           WHERE {col} = ?
           ORDER BY created_at DESC
           LIMIT ? OFFSET ?""",
        [user_id, limit, skip]
    )

    payments = []
    if result and result.get("rows"):
        for row in result["rows"]:
            payments.append({
                "id": int(_get_val(row, 0) or 0),
                "amount": float(_get_val(row, 1) or 0),
                "status": _safe_str(_get_val(row, 2)),
                "payment_type": _safe_str(_get_val(row, 3)),
                "description": _safe_str(_get_val(row, 4)),
                "created_at": parse_date(_get_val(row, 5))
            })

    return {"total": total, "payments": payments}


def get_monthly_payment_data(user_id: int, direction: str, months: int) -> dict:
    """Get monthly payment data for charts. direction='from' for spending, 'to' for earnings."""
    col = "from_user_id" if direction == "from" else "to_user_id"

    result = execute_query(
        f"""SELECT
            strftime('%Y-%m', created_at) as month,
            COALESCE(SUM(amount), 0) as total
           FROM payments
           WHERE {col} = ?
             AND status = 'completed'
             AND created_at >= date('now', '-' || ? || ' months')
           GROUP BY strftime('%Y-%m', created_at)
           ORDER BY month ASC""",
        [user_id, months]
    )

    monthly_data = {}
    if result and result.get("rows"):
        for row in result["rows"]:
            month_key = _safe_str(_get_val(row, 0))
            amount = float(_get_val(row, 1) or 0)
            if month_key:
                monthly_data[month_key] = amount

    return monthly_data


def get_wallet_payments(user_id: int, direction: str) -> dict:
    """Get pending and completed payment sums for wallet display - batched."""
    col = "from_user_id" if direction == "from" else "to_user_id"

    queries = [
        {"q": f"SELECT COALESCE(SUM(amount), 0) FROM payments WHERE {col} = ? AND status = 'pending'", "params": [user_id]},
        {"q": f"SELECT COALESCE(SUM(amount), 0) FROM payments WHERE {col} = ? AND status = 'completed'", "params": [user_id]},
    ]

    values = _batch_scalar_queries(queries)

    return {
        "pending": float(values[0] or 0),
        "completed": float(values[1] or 0),
    }


# ==================== Freelancer Dashboard ====================

def get_freelancer_stats(freelancer_id: int) -> dict:
    """Get all freelancer dashboard statistics in a single batched HTTP request."""
    cache_key = f"freelancer_stats_{freelancer_id}"
    cached = _stats_cache.get(cache_key)
    if cached and time.time() - cached["ts"] < STATS_CACHE_TTL:
        return cached["data"]

    queries = [
        {"q": "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'", "params": [freelancer_id]},
        {"q": "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status IN ('active', 'in_progress')", "params": [freelancer_id]},
        {"q": "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status = 'completed'", "params": [freelancer_id]},
        {"q": "SELECT COUNT(*) FROM proposals WHERE freelancer_id = ? AND status = 'submitted'", "params": [freelancer_id]},
        {"q": "SELECT COUNT(*) FROM proposals WHERE freelancer_id = ?", "params": [freelancer_id]},
        {"q": "SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?", "params": [freelancer_id]},
    ]

    values = _batch_scalar_queries(queries)

    total_earnings = float(values[0] or 0)
    active_projects = int(values[1] or 0)
    completed_projects = int(values[2] or 0)
    pending_proposals = int(values[3] or 0)
    total_proposals = int(values[4] or 0)
    avg_rating = round(float(values[5]), 2) if values[5] is not None else None

    success_rate = (completed_projects / total_proposals * 100) if total_proposals > 0 else 0.0

    result = {
        "total_earnings": total_earnings,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "pending_proposals": pending_proposals,
        "success_rate": round(success_rate, 2),
        "average_rating": avg_rating
    }
    _stats_cache[cache_key] = {"ts": time.time(), "data": result}
    return result


def get_available_jobs(category: Optional[str], limit: int, skip: int) -> dict:
    """Get available jobs for freelancers."""
    where_sql = "WHERE status = 'open'"
    params = []

    if category:
        where_sql += " AND category LIKE ?"
        params.append(f"%{category}%")

    count_result = execute_query(f"SELECT COUNT(*) FROM projects {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT p.id, p.title, p.description, p.budget_min, p.budget_max, p.created_at, u.name, p.skills
            FROM projects p
            JOIN users u ON p.client_id = u.id
            {where_sql}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )

    jobs = []
    if result and result.get("rows"):
        for row in result["rows"]:
            skills_val = _get_val(row, 7)
            skills_list = []
            if skills_val:
                try:
                    skills_list = json.loads(skills_val)
                except Exception:
                    skills_list = []

            jobs.append({
                "id": int(_get_val(row, 0) or 0),
                "title": _safe_str(_get_val(row, 1)),
                "description": _safe_str(_get_val(row, 2)),
                "budget_min": float(_get_val(row, 3) or 0),
                "budget_max": float(_get_val(row, 4) or 0),
                "created_at": parse_date(_get_val(row, 5)),
                "client_name": _safe_str(_get_val(row, 6)),
                "skills": skills_list
            })

    return {"total": total, "jobs": jobs}


def get_freelancer_contracts(freelancer_id: int, status_filter: Optional[str],
                             limit: int, skip: int) -> dict:
    """Get freelancer's active contracts/projects."""
    where_sql = "WHERE freelancer_id = ?"
    params = [freelancer_id]

    if status_filter:
        where_sql += " AND status = ?"
        params.append(status_filter)

    count_result = execute_query(f"SELECT COUNT(*) FROM contracts {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT c.id, c.project_id, c.status, c.start_date, c.end_date, c.total_amount, c.created_at,
            p.title, u.name as client_name
            FROM contracts c
            JOIN projects p ON c.project_id = p.id
            JOIN users u ON p.client_id = u.id
            {where_sql}
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )

    projects = []
    if result and result.get("rows"):
        for row in result["rows"]:
            projects.append({
                "id": int(_get_val(row, 0) or 0),
                "project_id": int(_get_val(row, 1) or 0),
                "status": _safe_str(_get_val(row, 2)),
                "start_date": parse_date(_get_val(row, 3)),
                "end_date": parse_date(_get_val(row, 4)),
                "total_amount": float(_get_val(row, 5) or 0),
                "title": _safe_str(_get_val(row, 7)),
                "client_name": _safe_str(_get_val(row, 8))
            })

    return {"total": total, "projects": projects}


def check_project_exists(project_id: int) -> bool:
    """Check if a project exists."""
    result = execute_query("SELECT id FROM projects WHERE id = ?", [project_id])
    return bool(result and result.get("rows"))


def check_proposal_exists(project_id: int, freelancer_id: int) -> bool:
    """Check if freelancer already submitted proposal for project."""
    result = execute_query(
        "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ?",
        [project_id, freelancer_id]
    )
    return bool(result and result.get("rows"))


def create_proposal(project_id: int, freelancer_id: int, cover_letter: str,
                    delivery_time: int, hourly_rate: float, now: str) -> Optional[int]:
    """Create a proposal. Returns proposal ID or None."""
    result = execute_query(
        """INSERT INTO proposals (project_id, freelancer_id, cover_letter, estimated_hours,
           hourly_rate, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [project_id, freelancer_id, cover_letter, delivery_time, hourly_rate, "submitted", now, now]
    )

    if not result:
        return None

    get_result = execute_query(
        "SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ? ORDER BY id DESC LIMIT 1",
        [project_id, freelancer_id]
    )

    if get_result and get_result.get("rows"):
        return int(_get_val(get_result["rows"][0], 0) or 0)
    return 0


def get_freelancer_proposals_list(freelancer_id: int, limit: int, skip: int) -> dict:
    """Get freelancer's submitted proposals with project titles."""
    count_result = execute_query(
        "SELECT COUNT(*) FROM proposals WHERE freelancer_id = ?",
        [freelancer_id]
    )
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    result = execute_query(
        """SELECT pr.id, pr.project_id, pr.status, pr.hourly_rate, pr.estimated_hours,
           pr.created_at, p.title as project_title
           FROM proposals pr
           LEFT JOIN projects p ON pr.project_id = p.id
           WHERE pr.freelancer_id = ?
           ORDER BY pr.created_at DESC
           LIMIT ? OFFSET ?""",
        [freelancer_id, limit, skip]
    )

    proposals = []
    if result and result.get("rows"):
        for row in result["rows"]:
            proposals.append({
                "id": int(_get_val(row, 0) or 0),
                "project_id": int(_get_val(row, 1) or 0),
                "status": _safe_str(_get_val(row, 2)),
                "hourly_rate": float(_get_val(row, 3) or 0),
                "estimated_hours": float(_get_val(row, 4) or 0),
                "created_at": parse_date(_get_val(row, 5)),
                "project_title": _safe_str(_get_val(row, 6)) or "Untitled Project",
            })

    return {"total": total, "proposals": proposals}


def get_freelancer_portfolio_items(freelancer_id: int) -> List[dict]:
    """Get freelancer's portfolio items."""
    result = execute_query(
        """SELECT id, title, description, image_url, project_url, created_at
           FROM portfolio_items
           WHERE freelancer_id = ?
           ORDER BY created_at DESC""",
        [freelancer_id]
    )

    items = []
    if result and result.get("rows"):
        for row in result["rows"]:
            items.append({
                "id": int(_get_val(row, 0) or 0),
                "title": _safe_str(_get_val(row, 1)),
                "description": _safe_str(_get_val(row, 2)),
                "image_url": _safe_str(_get_val(row, 3)),
                "project_url": _safe_str(_get_val(row, 4)),
                "created_at": parse_date(_get_val(row, 5))
            })
    return items


def create_withdrawal(freelancer_id: int, amount: float, now: str) -> bool:
    """Create a withdrawal payment record. Returns True on success."""
    result = execute_query(
        """INSERT INTO payments (from_user_id, to_user_id, amount, payment_type, payment_method,
           status, description, platform_fee, freelancer_amount, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [freelancer_id, freelancer_id, amount, "withdrawal", "bank_transfer",
         "pending", "Withdrawal of ", 0, amount, now, now]
    )
    return bool(result)


def update_user_balance(user_id: int, new_balance: float):
    """Update user's account balance."""
    execute_query(
        "UPDATE users SET account_balance = ? WHERE id = ?",
        [new_balance, user_id]
    )


def list_all_freelancers(limit: int, skip: int) -> dict:
    """List all active freelancers."""
    count_result = execute_query(
        "SELECT COUNT(*) FROM users WHERE user_type = 'Freelancer' AND is_active = 1", []
    )
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    result = execute_query(
        """SELECT id, name, email, bio, hourly_rate, location, skills
           FROM users
           WHERE user_type = 'Freelancer' AND is_active = 1
           LIMIT ? OFFSET ?""",
        [limit, skip]
    )

    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            freelancers.append({
                "id": int(_get_val(row, 0) or 0),
                "name": _safe_str(_get_val(row, 1)),
                "email": _safe_str(_get_val(row, 2)),
                "bio": _safe_str(_get_val(row, 3)),
                "hourly_rate": float(_get_val(row, 4) or 0),
                "location": _safe_str(_get_val(row, 5)),
                "skills": _safe_str(_get_val(row, 6))
            })

    return {"total": total, "freelancers": freelancers}
