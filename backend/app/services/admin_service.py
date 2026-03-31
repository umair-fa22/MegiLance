# @AI-HINT: Admin service layer - all database operations for admin dashboard, analytics, and management
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from app.db.turso_http import execute_query, parse_date
from app.services.db_utils import get_val as _get_val, safe_str as _safe_str

logger = logging.getLogger(__name__)


# ==================== System Stats ====================

def get_system_stats() -> dict:
    """Get overall system statistics."""
    total_users = 0
    total_clients = 0
    total_freelancers = 0
    total_projects = 0
    total_contracts = 0
    total_revenue = 0.0
    active_projects = 0
    pending_proposals = 0

    result = execute_query("SELECT COUNT(*) FROM users", [])
    if result and result.get("rows"):
        total_users = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE user_type = 'Client'", [])
    if result and result.get("rows"):
        total_clients = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE user_type = 'Freelancer'", [])
    if result and result.get("rows"):
        total_freelancers = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM projects", [])
    if result and result.get("rows"):
        total_projects = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM contracts", [])
    if result and result.get("rows"):
        total_contracts = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'", []
    )
    if result and result.get("rows"):
        total_revenue = float(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE status IN ('open', 'in_progress')", []
    )
    if result and result.get("rows"):
        active_projects = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COUNT(*) FROM proposals WHERE status = 'submitted'", []
    )
    if result and result.get("rows"):
        pending_proposals = int(_get_val(result["rows"][0], 0) or 0)

    return {
        "total_users": total_users,
        "total_clients": total_clients,
        "total_freelancers": total_freelancers,
        "total_projects": total_projects,
        "total_contracts": total_contracts,
        "total_revenue": total_revenue,
        "active_projects": active_projects,
        "pending_proposals": pending_proposals
    }


# ==================== User Activity ====================

def get_user_activity_metrics() -> dict:
    """Get user activity metrics (DAU/WAU/MAU, new users)."""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()

    new_today = 0
    new_week = 0
    new_month = 0
    dau = 0
    wau = 0
    mau = 0

    result = execute_query("SELECT COUNT(*) FROM users WHERE joined_at >= ?", [today])
    if result and result.get("rows"):
        new_today = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE joined_at >= ?", [week_ago])
    if result and result.get("rows"):
        new_week = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE joined_at >= ?", [month_ago])
    if result and result.get("rows"):
        new_month = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE updated_at >= ?", [today])
    if result and result.get("rows"):
        dau = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE updated_at >= ?", [week_ago])
    if result and result.get("rows"):
        wau = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE updated_at >= ?", [month_ago])
    if result and result.get("rows"):
        mau = int(_get_val(result["rows"][0], 0) or 0)

    return {
        "daily_active_users": dau,
        "weekly_active_users": wau,
        "monthly_active_users": mau,
        "new_users_today": new_today,
        "new_users_this_week": new_week,
        "new_users_this_month": new_month
    }


# ==================== Project Metrics ====================

def get_project_metrics() -> dict:
    """Get project-related metrics."""
    open_count = 0
    in_progress_count = 0
    completed_count = 0
    cancelled_count = 0
    avg_value = 0.0
    total_value = 0.0

    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'open'", [])
    if result and result.get("rows"):
        open_count = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'in_progress'", [])
    if result and result.get("rows"):
        in_progress_count = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'completed'", [])
    if result and result.get("rows"):
        completed_count = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'cancelled'", [])
    if result and result.get("rows"):
        cancelled_count = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT AVG((budget_min + budget_max) / 2), SUM((budget_min + budget_max) / 2) FROM projects", []
    )
    if result and result.get("rows"):
        avg_value = float(_get_val(result["rows"][0], 0) or 0)
        total_value = float(_get_val(result["rows"][0], 1) or 0)

    return {
        "open_projects": open_count,
        "in_progress_projects": in_progress_count,
        "completed_projects": completed_count,
        "cancelled_projects": cancelled_count,
        "avg_project_value": avg_value,
        "total_project_value": total_value
    }


# ==================== Financial Metrics ====================

def get_financial_metrics() -> dict:
    """Get financial analytics and revenue metrics."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (now - timedelta(days=now.weekday())).isoformat()

    total_revenue = 0.0
    revenue_month = 0.0
    revenue_week = 0.0
    pending = 0.0

    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'", []
    )
    if result and result.get("rows"):
        total_revenue = float(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= ?",
        [month_start]
    )
    if result and result.get("rows"):
        revenue_month = float(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at >= ?",
        [week_start]
    )
    if result and result.get("rows"):
        revenue_week = float(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'pending'", []
    )
    if result and result.get("rows"):
        pending = float(_get_val(result["rows"][0], 0) or 0)

    from app.core.config import get_settings
    settings = get_settings()
    platform_fee_rate = settings.STRIPE_PLATFORM_FEE_PERCENT / 100.0
    platform_fees = total_revenue * platform_fee_rate

    return {
        "total_revenue": total_revenue,
        "revenue_this_month": revenue_month,
        "revenue_this_week": revenue_week,
        "pending_payments": pending,
        "completed_payments": total_revenue,
        "platform_fees_collected": platform_fees
    }


# ==================== Top Freelancers / Clients ====================

def get_top_freelancers(limit: int) -> List[dict]:
    """Get top earning freelancers with ratings."""
    result = execute_query(
        """SELECT u.id, u.name, u.email,
           COALESCE(SUM(p.amount), 0) as total_earnings,
           COUNT(DISTINCT c.id) as completed_projects
           FROM users u
           LEFT JOIN payments p ON p.to_user_id = u.id AND p.status = 'completed'
           LEFT JOIN contracts c ON c.freelancer_id = u.id
           WHERE u.user_type = 'Freelancer'
           GROUP BY u.id, u.name, u.email
           ORDER BY total_earnings DESC
           LIMIT ?""",
        [limit]
    )

    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            user_id = int(_get_val(row, 0) or 0)
            avg_rating = _get_user_avg_rating(user_id)

            freelancers.append({
                "id": user_id,
                "name": _safe_str(_get_val(row, 1)) or "Unknown",
                "email": _safe_str(_get_val(row, 2)) or "",
                "total_earnings": float(_get_val(row, 3) or 0),
                "completed_projects": int(_get_val(row, 4) or 0),
                "average_rating": avg_rating
            })

    return freelancers


def get_top_clients(limit: int) -> List[dict]:
    """Get top spending clients with project counts."""
    result = execute_query(
        """SELECT u.id, u.name, u.email,
           COALESCE(SUM(p.amount), 0) as total_spent
           FROM users u
           LEFT JOIN payments p ON p.from_user_id = u.id AND p.status = 'completed'
           WHERE u.user_type = 'Client'
           GROUP BY u.id, u.name, u.email
           ORDER BY total_spent DESC
           LIMIT ?""",
        [limit]
    )

    clients = []
    if result and result.get("rows"):
        for row in result["rows"]:
            user_id = int(_get_val(row, 0) or 0)
            active, completed = _get_user_project_counts(user_id)

            clients.append({
                "id": user_id,
                "name": _safe_str(_get_val(row, 1)) or "Unknown",
                "email": _safe_str(_get_val(row, 2)) or "",
                "total_spent": float(_get_val(row, 3) or 0),
                "active_projects": active,
                "completed_projects": completed
            })

    return clients


# ==================== Recent Activity ====================

def get_recent_platform_activity(limit: int) -> List[dict]:
    """Get recent platform activity from multiple sources."""
    activities = []

    # Recent users
    result = execute_query(
        "SELECT id, name, user_type, joined_at FROM users ORDER BY joined_at DESC LIMIT 5", []
    )
    if result and result.get("rows"):
        for row in result["rows"]:
            name = _safe_str(_get_val(row, 1)) or "Unknown"
            user_type = _safe_str(_get_val(row, 2)) or "User"
            joined_at = parse_date(_get_val(row, 3)) or datetime.now(timezone.utc)
            activities.append({
                'type': 'user_joined',
                'description': f"{user_type} joined the platform",
                'timestamp': joined_at,
                'user_name': name,
                'amount': None
            })

    # Recent projects
    result = execute_query(
        """SELECT p.id, p.title, p.budget_max, p.created_at, u.name
           FROM projects p
           LEFT JOIN users u ON u.id = p.client_id
           ORDER BY p.created_at DESC LIMIT 5""", []
    )
    if result and result.get("rows"):
        for row in result["rows"]:
            title = _safe_str(_get_val(row, 1)) or "Project"
            budget = float(_get_val(row, 2) or 0)
            created_at = parse_date(_get_val(row, 3)) or datetime.now(timezone.utc)
            client_name = _safe_str(_get_val(row, 4)) or "Unknown"
            activities.append({
                'type': 'project_posted',
                'description': f"Posted: {title}",
                'timestamp': created_at,
                'user_name': client_name,
                'amount': budget
            })

    # Recent proposals
    result = execute_query(
        """SELECT pr.id, pr.estimated_hours, pr.hourly_rate, pr.created_at, u.name
           FROM proposals pr
           LEFT JOIN users u ON u.id = pr.freelancer_id
           ORDER BY pr.created_at DESC LIMIT 5""", []
    )
    if result and result.get("rows"):
        for row in result["rows"]:
            hours = float(_get_val(row, 1) or 0)
            rate = float(_get_val(row, 2) or 0)
            created_at = parse_date(_get_val(row, 3)) or datetime.now(timezone.utc)
            freelancer_name = _safe_str(_get_val(row, 4)) or "Unknown"
            amount = hours * rate if rate else None
            activities.append({
                'type': 'proposal_submitted',
                'description': "Submitted proposal",
                'timestamp': created_at,
                'user_name': freelancer_name,
                'amount': amount
            })

    # Recent payments
    result = execute_query(
        """SELECT pay.id, pay.amount, pay.payment_type, pay.description, pay.created_at, u.name
           FROM payments pay
           LEFT JOIN users u ON u.id = pay.to_user_id
           ORDER BY pay.created_at DESC LIMIT 5""", []
    )
    if result and result.get("rows"):
        for row in result["rows"]:
            amount = float(_get_val(row, 1) or 0)
            payment_type = _safe_str(_get_val(row, 2)) or ""
            description = _safe_str(_get_val(row, 3)) or payment_type
            created_at = parse_date(_get_val(row, 4)) or datetime.now(timezone.utc)
            payee_name = _safe_str(_get_val(row, 5)) or "Unknown"
            activities.append({
                'type': 'payment_made',
                'description': f"Payment: {description}",
                'timestamp': created_at,
                'user_name': payee_name,
                'amount': amount
            })

    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    return activities[:limit]


# ==================== User Management ====================

def list_users(user_type: Optional[str], search: Optional[str],
               limit: int, skip: int) -> dict:
    """List all users with filtering options."""
    where_clauses = []
    params = []

    if user_type:
        where_clauses.append("user_type = ?")
        params.append(user_type)

    if search:
        where_clauses.append("(name LIKE ? OR email LIKE ?)")
        params.append(f"%{search}%")
        params.append(f"%{search}%")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    count_result = execute_query(f"SELECT COUNT(*) FROM users {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, email, name, user_type, is_active, joined_at, location, hourly_rate, headline, availability_status
            FROM users {where_sql}
            ORDER BY joined_at DESC
            LIMIT ? OFFSET ?""",
        params
    )

    users = []
    if result and result.get("rows"):
        for row in result["rows"]:
            user_type_val = _safe_str(_get_val(row, 3))
            users.append({
                "id": int(_get_val(row, 0) or 0),
                "email": _safe_str(_get_val(row, 1)),
                "name": _safe_str(_get_val(row, 2)),
                "user_type": user_type_val,
                "is_active": bool(_get_val(row, 4)),
                "joined_at": parse_date(_get_val(row, 5)),
                "location": _safe_str(_get_val(row, 6)),
                "hourly_rate": float(_get_val(row, 7) or 0) if user_type_val == 'Freelancer' else None,
                "headline": _safe_str(_get_val(row, 8)),
                "availability_status": _safe_str(_get_val(row, 9)),
            })

    return {"total": total, "users": users}


def get_user_status(user_id: int) -> Optional[dict]:
    """Get user's is_active and user_type."""
    result = execute_query(
        "SELECT is_active, user_type FROM users WHERE id = ?", [user_id]
    )
    if not result or not result.get("rows"):
        return None
    return {
        "is_active": bool(_get_val(result["rows"][0], 0)),
        "user_type": _safe_str(_get_val(result["rows"][0], 1))
    }


def toggle_user_active(user_id: int, new_status: int) -> bool:
    """Toggle user's active status. Returns True on success."""
    result = execute_query(
        "UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?",
        [new_status, datetime.now(timezone.utc).isoformat(), user_id]
    )
    return bool(result)


# ==================== Admin Projects / Payments ====================

def get_admin_projects(status_filter: Optional[str], limit: int, skip: int) -> dict:
    """Get all projects with optional status filter."""
    where_sql = "WHERE status = ?" if status_filter else ""
    params = [status_filter] if status_filter else []

    count_result = execute_query(f"SELECT COUNT(*) FROM projects {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, title, description, status, budget_min, budget_max, client_id, created_at, updated_at
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
                "client_id": int(_get_val(row, 6) or 0),
                "created_at": parse_date(_get_val(row, 7)),
                "updated_at": parse_date(_get_val(row, 8))
            })

    return {"total": total, "projects": projects}


def get_admin_payments(status_filter: Optional[str], limit: int, skip: int) -> dict:
    """Get all payments with optional status filter."""
    where_sql = "WHERE status = ?" if status_filter else ""
    params = [status_filter] if status_filter else []

    count_result = execute_query(f"SELECT COUNT(*) FROM payments {where_sql}", params)
    total = 0
    if count_result and count_result.get("rows"):
        total = int(_get_val(count_result["rows"][0], 0) or 0)

    params.extend([limit, skip])
    result = execute_query(
        f"""SELECT id, amount, status, payment_type, from_user_id, to_user_id, description, created_at
            FROM payments {where_sql}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?""",
        params
    )

    payments = []
    if result and result.get("rows"):
        for row in result["rows"]:
            payments.append({
                "id": int(_get_val(row, 0) or 0),
                "amount": float(_get_val(row, 1) or 0),
                "status": _safe_str(_get_val(row, 2)),
                "payment_type": _safe_str(_get_val(row, 3)),
                "from_user_id": int(_get_val(row, 4) or 0),
                "to_user_id": int(_get_val(row, 5) or 0),
                "description": _safe_str(_get_val(row, 6)),
                "created_at": parse_date(_get_val(row, 7))
            })

    return {"total": total, "payments": payments}


# ==================== Analytics Overview ====================

def get_analytics_overview_data() -> dict:
    """Get platform analytics overview."""
    users_total = 0
    users_active = 0
    users_clients = 0
    users_freelancers = 0
    projects_total = 0
    projects_open = 0
    projects_in_progress = 0
    projects_completed = 0
    revenue_total = 0.0
    revenue_pending = 0.0

    result = execute_query("SELECT COUNT(*) FROM users", [])
    if result and result.get("rows"):
        users_total = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE is_active = 1", [])
    if result and result.get("rows"):
        users_active = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE user_type = 'Client'", [])
    if result and result.get("rows"):
        users_clients = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM users WHERE user_type = 'Freelancer'", [])
    if result and result.get("rows"):
        users_freelancers = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM projects", [])
    if result and result.get("rows"):
        projects_total = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'open'", [])
    if result and result.get("rows"):
        projects_open = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'in_progress'", [])
    if result and result.get("rows"):
        projects_in_progress = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query("SELECT COUNT(*) FROM projects WHERE status = 'completed'", [])
    if result and result.get("rows"):
        projects_completed = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed'", []
    )
    if result and result.get("rows"):
        revenue_total = float(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'pending'", []
    )
    if result and result.get("rows"):
        revenue_pending = float(_get_val(result["rows"][0], 0) or 0)

    return {
        "users": {
            "total": users_total,
            "active": users_active,
            "clients": users_clients,
            "freelancers": users_freelancers
        },
        "projects": {
            "total": projects_total,
            "open": projects_open,
            "in_progress": projects_in_progress,
            "completed": projects_completed
        },
        "revenue": {
            "total": revenue_total,
            "pending": revenue_pending
        }
    }


# ==================== Reviews ====================

def get_review_stats() -> dict:
    """Get platform-wide review statistics."""
    overall_rating = 0.0
    total_reviews = 0
    positive_reviews = 0
    neutral_reviews = 0
    negative_reviews = 0

    result = execute_query(
        """SELECT
           COUNT(*),
           AVG(rating),
           SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END),
           SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END),
           SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END)
           FROM reviews""", []
    )

    if result and result.get("rows"):
        row = result["rows"][0]
        total_reviews = int(_get_val(row, 0) or 0)
        overall_rating = float(_get_val(row, 1) or 0)
        positive_reviews = int(_get_val(row, 2) or 0)
        neutral_reviews = int(_get_val(row, 3) or 0)
        negative_reviews = int(_get_val(row, 4) or 0)

    return {
        "overall_rating": round(overall_rating, 2),
        "total_reviews": total_reviews,
        "positive_reviews": positive_reviews,
        "neutral_reviews": neutral_reviews,
        "negative_reviews": negative_reviews
    }


def get_recent_reviews(limit: int = 5) -> List[dict]:
    """Get recent reviews."""
    result = execute_query(
        """SELECT r.id, r.rating, r.comment, r.created_at, u.name
           FROM reviews r
           LEFT JOIN users u ON u.id = r.reviewer_id
           ORDER BY r.created_at DESC LIMIT ?""", [limit]
    )

    reviews = []
    if result and result.get("rows"):
        for row in result["rows"]:
            reviews.append({
                "id": int(_get_val(row, 0) or 0),
                "rating": float(_get_val(row, 1) or 0),
                "comment": _safe_str(_get_val(row, 2)),
                "created_at": parse_date(_get_val(row, 3)),
                "reviewer_name": _safe_str(_get_val(row, 4)) or "Unknown"
            })
    return reviews


# ==================== Internal Helpers ====================

def _get_user_avg_rating(user_id: int) -> Optional[float]:
    """Get average rating for a user."""
    result = execute_query(
        "SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?",
        [user_id]
    )
    if result and result.get("rows"):
        rating_val = _get_val(result["rows"][0], 0)
        if rating_val:
            return round(float(rating_val), 2)
    return None


def _get_user_project_counts(user_id: int) -> tuple:
    """Get active and completed project counts for a client."""
    active = 0
    completed = 0

    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE client_id = ? AND status IN ('open', 'in_progress')",
        [user_id]
    )
    if result and result.get("rows"):
        active = int(_get_val(result["rows"][0], 0) or 0)

    result = execute_query(
        "SELECT COUNT(*) FROM projects WHERE client_id = ? AND status = 'completed'",
        [user_id]
    )
    if result and result.get("rows"):
        completed = int(_get_val(result["rows"][0], 0) or 0)

    return active, completed
