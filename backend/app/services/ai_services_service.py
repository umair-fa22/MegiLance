# @AI-HINT: AI services data access layer with enriched queries, skill parsing, and rating/completion data
"""
AI Services Data Access v2.0 - Enriched queries with rating data,
completion metrics, skill normalization, and market intelligence.
"""
import json
import logging
from typing import List, Optional, Any

from app.db.turso_http import execute_query, to_str

logger = logging.getLogger("megilance")


def _parse_skills(raw: Any) -> List[str]:
    """Robustly parse a skills field from DB (JSON string, list, or CSV)."""
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(s).strip() for s in raw if s]
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(s).strip() for s in parsed if s]
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
        return [s.strip() for s in raw.split(",") if s.strip()]
    return []


def get_project_with_skills(project_id: int) -> Optional[dict]:
    """Get project details including skills for matching. Returns None if not found."""
    result = execute_query(
        "SELECT id, title, skills_required, category, budget_min, budget_max, experience_level FROM projects WHERE id = ?",
        [project_id]
    )
    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    skills_str = to_str(row[2]) or ""
    required_skills = _parse_skills(skills_str)

    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "title": to_str(row[1]),
        "skills_str": skills_str,
        "required_skills": required_skills,
        "category": to_str(row[3]),
        "budget_min": row[4].get("value") if len(row) > 4 and row[4].get("type") != "null" else None,
        "budget_max": row[5].get("value") if len(row) > 5 and row[5].get("type") != "null" else None,
        "experience_level": to_str(row[6]) if len(row) > 6 else None,
    }


def get_active_freelancers(limit: int) -> List[dict]:
    """Get active freelancers with ratings and completion data for matching."""
    result = execute_query(
        """SELECT u.id, u.name, u.email, u.skills, u.hourly_rate,
                  COALESCE(rv.avg_rating, 0) AS rating,
                  u.profile_image_url, u.bio,
                  COALESCE(cc.completed, 0) AS completed_projects,
                  u.location
           FROM users u
           LEFT JOIN (
               SELECT reviewee_id, AVG(rating) AS avg_rating
               FROM reviews GROUP BY reviewee_id
           ) rv ON u.id = rv.reviewee_id
           LEFT JOIN (
               SELECT freelancer_id, COUNT(*) AS completed
               FROM contracts WHERE status = 'completed'
               GROUP BY freelancer_id
           ) cc ON u.id = cc.freelancer_id
           WHERE u.user_type = 'Freelancer' AND u.is_active = 1
           ORDER BY COALESCE(rv.avg_rating, 0) * COALESCE(cc.completed, 0) DESC
           LIMIT ?""",
        [limit]
    )

    freelancers = []
    if not result or not result.get("rows"):
        return freelancers

    for row in result["rows"]:
        freelancer_id = row[0].get("value") if row[0].get("type") != "null" else None
        skills_str = to_str(row[3]) or ""
        freelancer_skills = _parse_skills(skills_str)

        rating = float(row[5].get("value", 0)) if row[5].get("type") != "null" else 0.0

        freelancers.append({
            "freelancer_id": freelancer_id,
            "name": to_str(row[1]),
            "email": to_str(row[2]),
            "skills": freelancer_skills,
            "hourly_rate": row[4].get("value") if row[4].get("type") != "null" else None,
            "rating": round(rating, 2),
            "profile_image": to_str(row[6]),
            "bio": (to_str(row[7]) or "")[:300],
            "completed_projects": row[8].get("value") if row[8].get("type") != "null" else 0,
            "location": to_str(row[9]) if len(row) > 9 else None,
        })

    return freelancers


def get_category_avg_budget(category_value: str) -> float:
    """Get average budget for a project category."""
    result = execute_query(
        """SELECT AVG((budget_min + budget_max) / 2) as avg_budget, COUNT(*) as project_count
           FROM projects
           WHERE category = ? AND status IN ('completed', 'in_progress')""",
        [category_value]
    )

    avg_budget = 500
    if result and result.get("rows"):
        row = result["rows"][0]
        if row[0].get("type") != "null" and row[0].get("value"):
            avg_budget = float(row[0].get("value"))
    return avg_budget


def get_skills_avg_hourly_rate(skills_pattern: str) -> float:
    """Get average hourly rate for freelancers with matching skills."""
    result = execute_query(
        """SELECT AVG(hourly_rate) as avg_rate
           FROM users
           WHERE user_type = 'Freelancer'
           AND hourly_rate IS NOT NULL
           AND skills LIKE ?""",
        [f"%{skills_pattern}%"]
    )

    avg_hourly = 35
    if result and result.get("rows"):
        row = result["rows"][0]
        if row[0].get("type") != "null" and row[0].get("value"):
            avg_hourly = float(row[0].get("value"))
    return avg_hourly


def get_freelancer_for_rate_estimation(freelancer_id: int) -> Optional[dict]:
    """Get freelancer details for rate estimation. Returns None if not found."""
    result = execute_query(
        """SELECT id, name, skills, hourly_rate, NULL as rating, NULL as completed_projects,
                  NULL as years_experience
           FROM users
           WHERE id = ? AND user_type = 'Freelancer'""",
        [freelancer_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "full_name": to_str(row[1]),
        "skills": to_str(row[2]),
        "current_rate": row[3].get("value") if row[3].get("type") != "null" else None,
        "rating": row[4].get("value") if row[4].get("type") != "null" else 0,
        "completed_projects": row[5].get("value") if row[5].get("type") != "null" else 0,
        "years_experience": row[6].get("value") if row[6].get("type") != "null" else 0,
    }


def get_user_for_fraud_check(user_id: int) -> Optional[dict]:
    """Get user data for fraud analysis. Returns None if not found."""
    result = execute_query(
        """SELECT id, email, name, created_at, is_active, is_verified,
                  user_type, bio
           FROM users WHERE id = ?""",
        [user_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "email": to_str(row[1]) or "",
        "full_name": to_str(row[2]) or "",
        "created_at": to_str(row[3]),
        "is_active": row[4].get("value") if row[4].get("type") != "null" else False,
        "is_verified": row[5].get("value") if row[5].get("type") != "null" else False,
        "user_type": to_str(row[6]),
        "bio": to_str(row[7]) or "",
    }


def get_urgent_ticket_count(user_id: int) -> int:
    """Get count of urgent support tickets for a user."""
    result = execute_query(
        "SELECT COUNT(*) FROM support_tickets WHERE user_id = ? AND priority = 'urgent'",
        [user_id]
    )
    if result and result.get("rows"):
        return result["rows"][0][0].get("value") or 0
    return 0


def get_project_for_fraud_check(project_id: int) -> Optional[dict]:
    """Get project data for fraud analysis. Returns None if not found."""
    result = execute_query(
        """SELECT id, title, description, budget, client_id
           FROM projects WHERE id = ?""",
        [project_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "title": to_str(row[1]) or "",
        "description": to_str(row[2]) or "",
        "budget": row[3].get("value") if row[3].get("type") != "null" else 0,
        "client_id": row[4].get("value") if row[4].get("type") != "null" else None,
    }


def get_proposal_for_fraud_check(proposal_id: int) -> Optional[dict]:
    """Get proposal data for fraud analysis. Returns None if not found."""
    result = execute_query(
        """SELECT id, cover_letter, bid_amount, freelancer_id
           FROM proposals WHERE id = ?""",
        [proposal_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "cover_letter": to_str(row[1]) or "",
        "bid_amount": row[2].get("value") if row[2].get("type") != "null" else 0,
        "freelancer_id": row[3].get("value") if row[3].get("type") != "null" else None,
    }


def get_user_profile_for_suggestions(user_id: int) -> Optional[dict]:
    """Get user profile data for optimization suggestions. Returns None if not found."""
    result = execute_query(
        """SELECT id, name, bio, skills, hourly_rate, NULL as portfolio_url,
                  profile_image_url, NULL as completed_projects, NULL as rating, NULL as years_experience
           FROM users WHERE id = ?""",
        [user_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    return {
        "id": row[0].get("value") if row[0].get("type") != "null" else None,
        "full_name": to_str(row[1]),
        "bio": to_str(row[2]) or "",
        "skills_str": to_str(row[3]) or "",
        "hourly_rate": row[4].get("value") if row[4].get("type") != "null" else None,
        "portfolio_url": to_str(row[5]),
        "profile_image": to_str(row[6]),
        "completed_projects": row[7].get("value") if row[7].get("type") != "null" else 0,
        "rating": row[8].get("value") if row[8].get("type") != "null" else 0,
        "years_experience": row[9].get("value") if row[9].get("type") != "null" else 0,
    }


def get_user_skills_and_rate(user_id: int) -> Optional[dict]:
    """Get user skills and hourly rate with completion data. Returns None if not found."""
    result = execute_query(
        """SELECT u.skills, u.hourly_rate, u.location,
                  COALESCE(rv.avg_rating, 0) AS avg_rating,
                  COALESCE(cc.completed, 0) AS completed_projects
           FROM users u
           LEFT JOIN (
               SELECT reviewee_id, AVG(rating) AS avg_rating
               FROM reviews GROUP BY reviewee_id
           ) rv ON u.id = rv.reviewee_id
           LEFT JOIN (
               SELECT freelancer_id, COUNT(*) AS completed
               FROM contracts WHERE status = 'completed'
               GROUP BY freelancer_id
           ) cc ON u.id = cc.freelancer_id
           WHERE u.id = ?""",
        [user_id]
    )

    if not result or not result.get("rows"):
        return None

    row = result["rows"][0]
    skills_str = to_str(row[0]) or ""
    hourly_rate = row[1].get("value") if row[1].get("type") != "null" else 0
    user_skills = _parse_skills(skills_str)

    return {
        "skills": user_skills,
        "hourly_rate": hourly_rate,
        "location": to_str(row[2]) if len(row) > 2 else None,
        "avg_rating": round(float(row[3].get("value", 0)), 2) if len(row) > 3 and row[3].get("type") != "null" else 0,
        "completed_projects": row[4].get("value") if len(row) > 4 and row[4].get("type") != "null" else 0,
    }


def get_open_projects(limit: int) -> List[dict]:
    """Get open projects with proposal counts for job recommendations."""
    result = execute_query(
        """SELECT p.id, p.title, p.description, p.skills_required,
                  p.budget_min, p.budget_max, p.category,
                  p.experience_level, p.created_at,
                  COALESCE(pc.proposal_count, 0) AS proposal_count
           FROM projects p
           LEFT JOIN (
               SELECT project_id, COUNT(*) AS proposal_count
               FROM proposals WHERE status != 'withdrawn'
               GROUP BY project_id
           ) pc ON p.id = pc.project_id
           WHERE p.status = 'open'
           ORDER BY p.created_at DESC
           LIMIT ?""",
        [limit]
    )

    projects = []
    if not result or not result.get("rows"):
        return projects

    for row in result["rows"]:
        project_id = row[0].get("value") if row[0].get("type") != "null" else None
        proj_skills_str = to_str(row[3]) or ""
        proj_skills = _parse_skills(proj_skills_str)

        budget_min = row[4].get("value") if row[4].get("type") != "null" else 0
        budget_max = row[5].get("value") if row[5].get("type") != "null" else 0

        projects.append({
            "project_id": project_id,
            "title": to_str(row[1]),
            "description": (to_str(row[2]) or "")[:400],
            "skills": proj_skills,
            "budget_min": budget_min,
            "budget_max": budget_max,
            "category": to_str(row[6]),
            "experience_level": to_str(row[7]) if len(row) > 7 else None,
            "created_at": to_str(row[8]) if len(row) > 8 else None,
            "proposal_count": row[9].get("value") if len(row) > 9 and row[9].get("type") != "null" else 0,
        })

    return projects
