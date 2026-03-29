# @AI-HINT: Service layer for analytics with cohort analysis, retention metrics, growth trends, and platform health scoring
"""
Analytics Service v2.0 - Comprehensive analytics with cohort analysis,
retention metrics, period-over-period growth, and platform health scoring.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any

from app.db.turso_http import execute_query, to_str


def _extract_count(result) -> int:
    """Extract a COUNT(*) scalar from a Turso result."""
    if result and result.get("rows"):
        return result["rows"][0][0].get("value", 0) if result["rows"][0][0].get("type") != "null" else 0
    return 0


def _extract_float(result) -> float:
    """Extract a single float scalar from a Turso result."""
    if result and result.get("rows"):
        val = result["rows"][0][0]
        if val.get("type") != "null":
            return float(val.get("value", 0))
    return 0.0


def _safe_pct(numerator: float, denominator: float) -> float:
    """Safe percentage calculation."""
    if denominator == 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


# ==================== User Analytics ====================

def get_registration_trends(start_date: str, end_date: str, interval: str) -> List[Dict[str, Any]]:
    """Get user registration trends over a time period."""
    if interval == "day":
        date_format = "DATE(created_at)"
    elif interval == "week":
        date_format = "DATE(created_at, 'weekday 0', '-6 days')"
    else:
        date_format = "DATE(created_at, 'start of month')"

    result = execute_query(
        f"""SELECT {date_format} as date,
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(user_type) = 'client' THEN 1 ELSE 0 END) as clients,
            SUM(CASE WHEN LOWER(user_type) = 'freelancer' THEN 1 ELSE 0 END) as freelancers
           FROM users
           WHERE created_at >= ? AND created_at <= ?
           GROUP BY {date_format}
           ORDER BY date""",
        [start_date, end_date]
    )

    trends = []
    if result and result.get("rows"):
        for row in result["rows"]:
            trends.append({
                "date": to_str(row[0]),
                "total": row[1].get("value", 0) if row[1].get("type") != "null" else 0,
                "clients": row[2].get("value", 0) if row[2].get("type") != "null" else 0,
                "freelancers": row[3].get("value", 0) if row[3].get("type") != "null" else 0
            })
    return trends


def get_active_user_stats(days: int) -> Dict[str, Any]:
    """Get active user statistics for a given period."""
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    total_users = _extract_count(execute_query("SELECT COUNT(*) FROM users", []))
    active_users = _extract_count(execute_query(
        "SELECT COUNT(*) FROM users WHERE last_login >= ?", [cutoff_date]
    ))
    verified_users = _extract_count(execute_query(
        "SELECT COUNT(*) FROM users WHERE email_verified = 1", []
    ))
    users_with_2fa = _extract_count(execute_query(
        "SELECT COUNT(*) FROM users WHERE two_factor_enabled = 1", []
    ))

    types_result = execute_query(
        "SELECT user_type, COUNT(*) FROM users GROUP BY user_type", []
    )
    user_types = {}
    if types_result and types_result.get("rows"):
        for row in types_result["rows"]:
            user_type = to_str(row[0]) or "unknown"
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            user_types[user_type] = count

    return {
        "total_users": total_users,
        "active_users": active_users,
        "verified_users": verified_users,
        "users_with_2fa": users_with_2fa,
        "user_types": user_types,
        "period_days": days
    }


def get_location_distribution() -> List[Dict[str, Any]]:
    """Get user distribution by location."""
    result = execute_query(
        """SELECT location, COUNT(*) as count
           FROM users
           WHERE location IS NOT NULL AND location != ''
           GROUP BY location
           ORDER BY count DESC
           LIMIT 20""",
        []
    )

    locations = []
    if result and result.get("rows"):
        for row in result["rows"]:
            locations.append({
                "location": to_str(row[0]),
                "count": row[1].get("value", 0) if row[1].get("type") != "null" else 0
            })
    return locations


# ==================== Project Analytics ====================

def get_project_stats() -> Dict[str, Any]:
    """Get overall project statistics."""
    status_result = execute_query(
        "SELECT status, COUNT(*) FROM projects GROUP BY status", []
    )
    status_breakdown = {}
    if status_result and status_result.get("rows"):
        for row in status_result["rows"]:
            s = to_str(row[0]) or "unknown"
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            status_breakdown[s] = count

    avg_budget = _extract_float(execute_query(
        "SELECT AVG((COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2) FROM projects", []
    ))

    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_projects = _extract_count(execute_query(
        "SELECT COUNT(*) FROM projects WHERE created_at >= ?", [thirty_days_ago]
    ))

    avg_proposals = _extract_float(execute_query(
        """SELECT AVG(proposal_count) FROM (
            SELECT COUNT(*) as proposal_count FROM proposals GROUP BY project_id
        )""",
        []
    ))

    return {
        "status_breakdown": status_breakdown,
        "average_budget": avg_budget,
        "projects_last_30_days": recent_projects,
        "average_proposals_per_project": avg_proposals
    }


def get_completion_rate() -> Dict[str, Any]:
    """Get project completion rate."""
    result = execute_query(
        """SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
           FROM projects""",
        []
    )

    total = completed = in_progress = cancelled = 0
    if result and result.get("rows"):
        row = result["rows"][0]
        total = row[0].get("value", 0) if row[0].get("type") != "null" else 0
        completed = row[1].get("value", 0) if row[1].get("type") != "null" else 0
        in_progress = row[2].get("value", 0) if row[2].get("type") != "null" else 0
        cancelled = row[3].get("value", 0) if row[3].get("type") != "null" else 0

    completion_rate = (completed / total * 100) if total > 0 else 0

    return {
        "total_projects": total,
        "completed": completed,
        "in_progress": in_progress,
        "cancelled": cancelled,
        "completion_rate": round(completion_rate, 2)
    }


def get_popular_categories(limit: int) -> List[Dict[str, Any]]:
    """Get most popular project categories."""
    result = execute_query(
        """SELECT category, COUNT(*) as count
           FROM projects
           WHERE category IS NOT NULL AND category != ''
           GROUP BY category
           ORDER BY count DESC
           LIMIT ?""",
        [limit]
    )

    categories = []
    if result and result.get("rows"):
        for row in result["rows"]:
            categories.append({
                "category": to_str(row[0]),
                "count": row[1].get("value", 0) if row[1].get("type") != "null" else 0
            })
    return categories


# ==================== Revenue Analytics ====================

def get_revenue_stats(start_date: str, end_date: str, platform_fee_pct: float = 10.0) -> Dict[str, Any]:
    """Get revenue statistics for a date range with configurable platform fee."""
    result = execute_query(
        """SELECT 
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count,
            payment_method
           FROM payments
           WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
           GROUP BY payment_method""",
        [start_date, end_date]
    )

    total_revenue = 0.0
    transaction_count = 0
    payment_methods = {}

    if result and result.get("rows"):
        for row in result["rows"]:
            amount = float(row[0].get("value", 0)) if row[0].get("type") != "null" else 0
            count = row[1].get("value", 0) if row[1].get("type") != "null" else 0
            method = to_str(row[2]) or "unknown"
            total_revenue += amount
            transaction_count += count
            payment_methods[method] = amount

    platform_fees = total_revenue * (platform_fee_pct / 100.0)
    avg_transaction = total_revenue / transaction_count if transaction_count > 0 else 0

    # Period-over-period comparison
    prev_start = _shift_date_back(start_date, end_date)
    prev_result = execute_query(
        """SELECT COALESCE(SUM(amount), 0) FROM payments
           WHERE created_at >= ? AND created_at < ? AND status = 'completed'""",
        [prev_start, start_date]
    )
    prev_revenue = _extract_float(prev_result)
    revenue_growth = _safe_pct(total_revenue - prev_revenue, prev_revenue) if prev_revenue > 0 else 0

    return {
        "total_revenue": total_revenue,
        "platform_fees": platform_fees,
        "net_revenue": total_revenue - platform_fees,
        "transaction_count": transaction_count,
        "average_transaction": avg_transaction,
        "payment_methods": payment_methods,
        "revenue_growth_pct": revenue_growth,
        "platform_fee_pct": platform_fee_pct,
    }


def _shift_date_back(start_date: str, end_date: str) -> str:
    """Calculate a previous period start date of equal length."""
    try:
        s = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        e = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        delta = e - s
        prev = s - delta
        return prev.isoformat()
    except Exception:
        return start_date


def get_revenue_trends(start_date: str, end_date: str, interval: str) -> List[Dict[str, Any]]:
    """Get revenue trends over time."""
    if interval == "day":
        date_format = "DATE(created_at)"
    elif interval == "week":
        date_format = "DATE(created_at, 'weekday 0', '-6 days')"
    else:
        date_format = "DATE(created_at, 'start of month')"

    result = execute_query(
        f"""SELECT {date_format} as date,
            COALESCE(SUM(amount), 0) as total,
            COUNT(*) as count
           FROM payments
           WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
           GROUP BY {date_format}
           ORDER BY date""",
        [start_date, end_date]
    )

    trends = []
    if result and result.get("rows"):
        for row in result["rows"]:
            trends.append({
                "date": to_str(row[0]),
                "revenue": float(row[1].get("value", 0)) if row[1].get("type") != "null" else 0,
                "transactions": row[2].get("value", 0) if row[2].get("type") != "null" else 0
            })
    return trends


# ==================== Freelancer Analytics ====================

def get_top_freelancers(limit: int, sort_by: str) -> List[Dict[str, Any]]:
    """Get top performing freelancers."""
    order_by = {
        "earnings": "total_earnings DESC",
        "rating": "avg_rating DESC",
        "projects": "project_count DESC"
    }.get(sort_by, "total_earnings DESC")

    result = execute_query(
        f"""SELECT 
            u.id, u.first_name, u.last_name, u.email,
            COUNT(DISTINCT c.id) as project_count,
            COALESCE(SUM(p.amount), 0) as total_earnings,
            COALESCE(AVG(r.rating), 0) as avg_rating
           FROM users u
           LEFT JOIN contracts c ON c.freelancer_id = u.id
           LEFT JOIN payments p ON p.to_user_id = u.id AND p.status = 'completed'
           LEFT JOIN reviews r ON r.reviewee_id = u.id
           WHERE LOWER(u.user_type) = 'freelancer'
           GROUP BY u.id, u.first_name, u.last_name, u.email
           ORDER BY {order_by}
           LIMIT ?""",
        [limit]
    )

    freelancers = []
    if result and result.get("rows"):
        for row in result["rows"]:
            first = to_str(row[1]) or ""
            last = to_str(row[2]) or ""
            freelancers.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": f"{first} {last}".strip(),
                "email": to_str(row[3]),
                "project_count": row[4].get("value", 0) if row[4].get("type") != "null" else 0,
                "total_earnings": float(row[5].get("value", 0)) if row[5].get("type") != "null" else 0,
                "average_rating": round(float(row[6].get("value", 0)), 2) if row[6].get("type") != "null" else 0
            })
    return freelancers


def get_freelancer_success_rate(freelancer_id: int) -> Dict[str, Any]:
    """Get success metrics for a specific freelancer."""
    proposals_result = execute_query(
        """SELECT 
            COUNT(*) as submitted,
            SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
           FROM proposals WHERE freelancer_id = ?""",
        [freelancer_id]
    )

    submitted = accepted = 0
    if proposals_result and proposals_result.get("rows"):
        row = proposals_result["rows"][0]
        submitted = row[0].get("value", 0) if row[0].get("type") != "null" else 0
        accepted = row[1].get("value", 0) if row[1].get("type") != "null" else 0

    completed = _extract_count(execute_query(
        "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status = 'completed'",
        [freelancer_id]
    ))

    avg_rating = _extract_float(execute_query(
        "SELECT AVG(rating) FROM reviews WHERE reviewee_id = ?",
        [freelancer_id]
    ))

    total_earnings = _extract_float(execute_query(
        "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
        [freelancer_id]
    ))

    success_rate = (accepted / submitted * 100) if submitted > 0 else 0

    return {
        "proposals_submitted": submitted,
        "proposals_accepted": accepted,
        "success_rate": round(success_rate, 2),
        "projects_completed": completed,
        "average_rating": round(avg_rating, 2),
        "total_earnings": total_earnings
    }


# ==================== Client Analytics ====================

def get_top_clients(limit: int) -> List[Dict[str, Any]]:
    """Get top clients by spending."""
    result = execute_query(
        """SELECT 
            u.id, u.first_name, u.last_name, u.email,
            COUNT(DISTINCT pr.id) as project_count,
            COALESCE(SUM(p.amount), 0) as total_spent
           FROM users u
           LEFT JOIN projects pr ON pr.client_id = u.id
           LEFT JOIN payments p ON p.from_user_id = u.id AND p.status = 'completed'
           WHERE LOWER(u.user_type) = 'client'
           GROUP BY u.id, u.first_name, u.last_name, u.email
           ORDER BY total_spent DESC
           LIMIT ?""",
        [limit]
    )

    clients = []
    if result and result.get("rows"):
        for row in result["rows"]:
            first = to_str(row[1]) or ""
            last = to_str(row[2]) or ""
            clients.append({
                "id": row[0].get("value") if row[0].get("type") != "null" else None,
                "name": f"{first} {last}".strip(),
                "email": to_str(row[3]),
                "project_count": row[4].get("value", 0) if row[4].get("type") != "null" else 0,
                "total_spent": float(row[5].get("value", 0)) if row[5].get("type") != "null" else 0
            })
    return clients


# ==================== Platform Health ====================

def get_platform_health() -> Dict[str, Any]:
    """Get platform health metrics with composite health score."""
    active_disputes = _extract_count(execute_query(
        "SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'investigating')", []
    ))
    pending_tickets = _extract_count(execute_query(
        "SELECT COUNT(*) FROM support_tickets WHERE status = 'open'", []
    ))

    user_satisfaction = _extract_float(execute_query(
        "SELECT AVG(rating) FROM reviews", []
    ))

    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    daily_active = _extract_count(execute_query(
        "SELECT COUNT(*) FROM users WHERE last_login >= ?", [yesterday]
    ))
    total_users = _extract_count(execute_query("SELECT COUNT(*) FROM users", []))

    # Composite health score (0-100)
    satisfaction_score = min((user_satisfaction / 5.0) * 30, 30) if user_satisfaction > 0 else 15
    dispute_score = max(25 - active_disputes * 5, 0)
    ticket_score = max(20 - pending_tickets * 2, 0)
    dau_score = min((daily_active / max(total_users, 1)) * 100, 25) if total_users > 0 else 10
    health_score = round(satisfaction_score + dispute_score + ticket_score + dau_score, 1)

    if health_score >= 80:
        health_status = "excellent"
    elif health_score >= 60:
        health_status = "good"
    elif health_score >= 40:
        health_status = "fair"
    else:
        health_status = "needs_attention"

    return {
        "health_score": health_score,
        "health_status": health_status,
        "active_disputes": active_disputes,
        "pending_support_tickets": pending_tickets,
        "user_satisfaction_rating": round(user_satisfaction, 2),
        "daily_active_users": daily_active,
        "total_users": total_users,
        "dau_ratio": round(daily_active / max(total_users, 1) * 100, 2),
    }


def get_engagement_metrics(days: int) -> Dict[str, Any]:
    """Get user engagement metrics with period-over-period comparison."""
    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    prev_cutoff = (datetime.now(timezone.utc) - timedelta(days=days * 2)).isoformat()

    def _count_in_range(table: str, start: str, end: str) -> int:
        return _extract_count(execute_query(
            f"SELECT COUNT(*) FROM {table} WHERE created_at >= ? AND created_at < ?",
            [start, end]
        ))

    now_iso = datetime.now(timezone.utc).isoformat()

    # Current period
    messages = _count_in_range("messages", cutoff_date, now_iso)
    proposals = _count_in_range("proposals", cutoff_date, now_iso)
    projects = _count_in_range("projects", cutoff_date, now_iso)
    contracts = _count_in_range("contracts", cutoff_date, now_iso)
    reviews = _count_in_range("reviews", cutoff_date, now_iso)

    # Previous period
    prev_messages = _count_in_range("messages", prev_cutoff, cutoff_date)
    prev_proposals = _count_in_range("proposals", prev_cutoff, cutoff_date)
    prev_projects = _count_in_range("projects", prev_cutoff, cutoff_date)

    return {
        "period_days": days,
        "messages_sent": messages,
        "proposals_submitted": proposals,
        "projects_posted": projects,
        "contracts_created": contracts,
        "reviews_posted": reviews,
        "growth": {
            "messages_growth_pct": _safe_pct(messages - prev_messages, prev_messages) if prev_messages else 0,
            "proposals_growth_pct": _safe_pct(proposals - prev_proposals, prev_proposals) if prev_proposals else 0,
            "projects_growth_pct": _safe_pct(projects - prev_projects, prev_projects) if prev_projects else 0,
        },
    }


# ==================== NEW: Cohort & Retention Analytics ====================

def get_registration_cohort_analysis(months: int = 6) -> List[Dict[str, Any]]:
    """
    Monthly cohort analysis: for each registration month, track how many
    users from that cohort were active in subsequent months.
    """
    cohorts = []
    now = datetime.now(timezone.utc)

    for i in range(months - 1, -1, -1):
        cohort_start = (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        cohort_end = (cohort_start + timedelta(days=32)).replace(day=1)

        # Users who registered in this month
        cohort_size = _extract_count(execute_query(
            "SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at < ?",
            [cohort_start.isoformat(), cohort_end.isoformat()]
        ))

        if cohort_size == 0:
            cohorts.append({
                "cohort_month": cohort_start.strftime("%Y-%m"),
                "cohort_size": 0,
                "retention": [],
            })
            continue

        retention = []
        for month_offset in range(1, months - i + 1):
            check_start = (cohort_start + timedelta(days=30 * month_offset)).replace(day=1)
            check_end = (check_start + timedelta(days=32)).replace(day=1)
            if check_start > now:
                break

            active_in_month = _extract_count(execute_query(
                """SELECT COUNT(DISTINCT u.id) FROM users u
                   WHERE u.created_at >= ? AND u.created_at < ?
                     AND u.last_login >= ? AND u.last_login < ?""",
                [cohort_start.isoformat(), cohort_end.isoformat(),
                 check_start.isoformat(), check_end.isoformat()]
            ))

            retention.append({
                "month": month_offset,
                "active_users": active_in_month,
                "retention_pct": _safe_pct(active_in_month, cohort_size),
            })

        cohorts.append({
            "cohort_month": cohort_start.strftime("%Y-%m"),
            "cohort_size": cohort_size,
            "retention": retention,
        })

    return cohorts


def get_conversion_funnel() -> Dict[str, Any]:
    """
    Platform conversion funnel:
    Registered → Profile Complete → First Project/Proposal → First Contract → First Payment
    """
    total_users = _extract_count(execute_query("SELECT COUNT(*) FROM users", []))
    verified = _extract_count(execute_query("SELECT COUNT(*) FROM users WHERE email_verified = 1", []))
    with_bio = _extract_count(execute_query("SELECT COUNT(*) FROM users WHERE bio IS NOT NULL AND bio != ''", []))

    freelancers_with_proposal = _extract_count(execute_query(
        "SELECT COUNT(DISTINCT freelancer_id) FROM proposals", []
    ))
    clients_with_project = _extract_count(execute_query(
        "SELECT COUNT(DISTINCT client_id) FROM projects", []
    ))
    users_with_contract = _extract_count(execute_query(
        "SELECT COUNT(DISTINCT freelancer_id) FROM contracts", []
    ))
    users_with_payment = _extract_count(execute_query(
        "SELECT COUNT(DISTINCT to_user_id) FROM payments WHERE status = 'completed'", []
    ))

    stages = [
        {"stage": "registered", "count": total_users, "pct": 100.0},
        {"stage": "verified", "count": verified, "pct": _safe_pct(verified, total_users)},
        {"stage": "profile_complete", "count": with_bio, "pct": _safe_pct(with_bio, total_users)},
        {"stage": "first_activity", "count": freelancers_with_proposal + clients_with_project,
         "pct": _safe_pct(freelancers_with_proposal + clients_with_project, total_users)},
        {"stage": "first_contract", "count": users_with_contract, "pct": _safe_pct(users_with_contract, total_users)},
        {"stage": "first_payment", "count": users_with_payment, "pct": _safe_pct(users_with_payment, total_users)},
    ]

    return {"funnel": stages, "total_users": total_users}


def get_growth_summary() -> Dict[str, Any]:
    """
    Platform growth summary: key metrics with week-over-week and month-over-month changes.
    """
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()
    two_weeks_ago = (now - timedelta(days=14)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()
    two_months_ago = (now - timedelta(days=60)).isoformat()

    def _wow(current_start, prev_start, current_end, table):
        curr = _extract_count(execute_query(
            f"SELECT COUNT(*) FROM {table} WHERE created_at >= ? AND created_at < ?",
            [current_start, current_end]
        ))
        prev = _extract_count(execute_query(
            f"SELECT COUNT(*) FROM {table} WHERE created_at >= ? AND created_at < ?",
            [prev_start, current_start]
        ))
        return {"current": curr, "previous": prev, "growth_pct": _safe_pct(curr - prev, prev) if prev else 0}

    now_iso = now.isoformat()

    return {
        "users_wow": _wow(week_ago, two_weeks_ago, now_iso, "users"),
        "projects_wow": _wow(week_ago, two_weeks_ago, now_iso, "projects"),
        "proposals_wow": _wow(week_ago, two_weeks_ago, now_iso, "proposals"),
        "users_mom": _wow(month_ago, two_months_ago, now_iso, "users"),
        "projects_mom": _wow(month_ago, two_months_ago, now_iso, "projects"),
    }
