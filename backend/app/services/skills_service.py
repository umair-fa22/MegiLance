# @AI-HINT: Service layer for skills catalog and user-skill management via Turso HTTP (not skill_assessment/skill_graph)
"""
Skills Service - Data access and business logic for skills endpoints.
Handles skills CRUD, user skills, freelancer matching, and categories.
"""
import logging
import json
from datetime import datetime, timezone
from typing import List, Optional
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, parse_rows


INDUSTRIES = {
    'healthcare': {'name': 'Healthcare', 'icon': '🏥', 'growth': 'high'},
    'fintech': {'name': 'FinTech', 'icon': '💰', 'growth': 'high'},
    'ecommerce': {'name': 'E-commerce', 'icon': '🛒', 'growth': 'medium'},
    'education': {'name': 'Education', 'icon': '📚', 'growth': 'high'},
    'real-estate': {'name': 'Real Estate', 'icon': '🏠', 'growth': 'medium'},
    'saas': {'name': 'SaaS', 'icon': '☁️', 'growth': 'high'},
    'gaming': {'name': 'Gaming', 'icon': '🎮', 'growth': 'high'},
    'travel': {'name': 'Travel & Hospitality', 'icon': '✈️', 'growth': 'medium'},
    'logistics': {'name': 'Logistics', 'icon': '📦', 'growth': 'medium'},
    'media': {'name': 'Media & Entertainment', 'icon': '🎬', 'growth': 'medium'},
    'automotive': {'name': 'Automotive', 'icon': '🚗', 'growth': 'medium'},
    'startup': {'name': 'Startups', 'icon': '🚀', 'growth': 'high'},
    'enterprise': {'name': 'Enterprise', 'icon': '🏢', 'growth': 'stable'},
    'nonprofit': {'name': 'Non-Profit', 'icon': '❤️', 'growth': 'stable'},
    'government': {'name': 'Government', 'icon': '🏛️', 'growth': 'stable'},
    'crypto': {'name': 'Cryptocurrency', 'icon': '₿', 'growth': 'volatile'},
    'ai': {'name': 'AI & Machine Learning', 'icon': '🤖', 'growth': 'explosive'},
    'sustainability': {'name': 'Sustainability', 'icon': '🌱', 'growth': 'high'},
}


# ============ Skills Catalog ============

def list_skills(category: Optional[str], search: Optional[str],
                active_only: bool, skip: int, limit: int) -> List[dict]:
    """List skills from catalog with filtering."""
    where_clauses = []
    params: list = []

    if active_only:
        where_clauses.append("is_active = 1")
    if category:
        where_clauses.append("category = ?")
        params.append(category)
    if search:
        pattern = f"%{search}%"
        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        params.extend([pattern, pattern])

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    params.extend([limit, skip])

    result = execute_query(
        f"""SELECT id, name, description, category, icon, is_active, sort_order, created_at, updated_at
            FROM skills WHERE {where_sql}
            ORDER BY category ASC, sort_order ASC, name ASC
            LIMIT ? OFFSET ?""",
        params
    )
    if not result:
        return []
    rows = parse_rows(result)
    for row in rows:
        row["is_active"] = bool(row.get("is_active"))
    return rows


def list_skill_categories() -> List[str]:
    """Get distinct active skill categories."""
    result = execute_query(
        "SELECT DISTINCT category FROM skills WHERE is_active = 1 AND category IS NOT NULL", []
    )
    if not result or not result.get("rows"):
        return []
    rows = parse_rows(result)
    return [r.get("category") for r in rows if r.get("category")]


def get_skill_by_id(skill_id: int) -> Optional[dict]:
    """Get a single skill by ID."""
    result = execute_query(
        """SELECT id, name, description, category, icon, is_active, sort_order, created_at, updated_at
           FROM skills WHERE id = ?""",
        [skill_id]
    )
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    if not rows:
        return None
    skill = rows[0]
    skill["is_active"] = bool(skill.get("is_active"))
    return skill


def skill_name_exists(name: str, exclude_id: Optional[int] = None) -> bool:
    """Check if a skill with the given name already exists."""
    if exclude_id is not None:
        result = execute_query("SELECT id FROM skills WHERE LOWER(name) = LOWER(?) AND id != ?", [name, exclude_id])
    else:
        result = execute_query("SELECT id FROM skills WHERE LOWER(name) = LOWER(?)", [name])
    return bool(result and result.get("rows"))


def create_skill(skill_data: dict) -> dict:
    """Insert a new skill and return it."""
    now = datetime.now(timezone.utc).isoformat()
    name = skill_data.get("name", "")
    execute_query(
        """INSERT INTO skills (name, description, category, icon, is_active, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            name,
            skill_data.get("description"),
            skill_data.get("category"),
            skill_data.get("icon"),
            1 if skill_data.get("is_active", True) else 0,
            skill_data.get("sort_order", 0),
            now, now
        ]
    )
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    return {
        "id": new_id,
        "name": name,
        "description": skill_data.get("description"),
        "category": skill_data.get("category"),
        "icon": skill_data.get("icon"),
        "is_active": skill_data.get("is_active", True),
        "sort_order": skill_data.get("sort_order", 0),
        "created_at": now,
        "updated_at": now,
    }


def update_skill(skill_id: int, skill_data: dict) -> Optional[dict]:
    """Apply partial update to a skill and return the updated record."""
    updates = []
    params: list = []
    for field in ["name", "description", "category", "icon", "sort_order"]:
        if field in skill_data:
            updates.append(f"{field} = ?")
            params.append(skill_data[field])
    if "is_active" in skill_data:
        updates.append("is_active = ?")
        params.append(1 if skill_data["is_active"] else 0)
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(skill_id)
        execute_query(f"UPDATE skills SET {', '.join(updates)} WHERE id = ?", params)
    return get_skill_by_id(skill_id)


def soft_delete_skill(skill_id: int):
    """Soft-delete a skill by setting is_active to 0."""
    execute_query("UPDATE skills SET is_active = 0, updated_at = ? WHERE id = ?",
                  [datetime.now(timezone.utc).isoformat(), skill_id])


def skill_exists(skill_id: int) -> bool:
    """Check if a skill exists."""
    result = execute_query("SELECT id FROM skills WHERE id = ?", [skill_id])
    return bool(result and result.get("rows"))


# ============ Freelancer Match ============

def find_skill_by_slug(slug: str) -> Optional[dict]:
    """Find a skill by slug/name. Returns {id, name} or None."""
    clean = slug.replace("-", " ")
    result = execute_query(
        "SELECT id, name FROM skills WHERE LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?)",
        [clean, slug]
    )
    if not result or not result.get("rows"):
        result = execute_query("SELECT id, name FROM skills WHERE name LIKE ? LIMIT 1",
                               [f"%{clean}%"])
        if not result or not result.get("rows"):
            return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def match_freelancers(skill_id: int, skill_name: str,
                      industry_slug: Optional[str], limit: int) -> List[dict]:
    """Find freelancers matching a skill and optional industry."""
    query = """
        SELECT u.id, u.name, u.bio, u.profile_image_url, u.hourly_rate, u.location, u.profile_data,
               us.proficiency_level, us.years_experience, us.is_verified
        FROM users u
        JOIN user_skills us ON u.id = us.user_id
        WHERE us.skill_id = ? AND u.user_type = 'freelancer' AND u.is_active = 1
    """
    params: list = [skill_id]

    if industry_slug:
        industry_name = INDUSTRIES.get(industry_slug, {}).get('name', industry_slug)
        query += " AND (LOWER(u.bio) LIKE ? OR LOWER(u.profile_data) LIKE ?)"
        params.extend([f"%{industry_name.lower()}%", f"%{industry_name.lower()}%"])

    query += " ORDER BY us.proficiency_level DESC, us.is_verified DESC LIMIT ?"
    params.append(limit)

    result = execute_query(query, params)
    if not result:
        return []
    rows = parse_rows(result)

    freelancers = []
    for row in rows:
        profile_data = {}
        if row.get("profile_data"):
            try:
                profile_data = json.loads(row["profile_data"])
            except Exception:
                pass
        freelancers.append({
            "id": row["id"],
            "name": row["name"],
            "title": profile_data.get("title", f"{skill_name} Specialist"),
            "bio": row["bio"],
            "avatar": row["profile_image_url"],
            "hourly_rate": row["hourly_rate"],
            "location": row["location"],
            "rating": 5.0,
            "reviews_count": 0,
            "skills": [skill_name],
            "verified": bool(row["is_verified"]),
        })
    return freelancers


# ============ User Skills ============

def list_user_skills(target_user_id: int, skill_category: Optional[str],
                     min_proficiency: Optional[int], verified_only: bool) -> List[dict]:
    """List skills for a user with optional filters."""
    where_clauses = ["us.user_id = ?"]
    params: list = [target_user_id]

    if skill_category:
        where_clauses.append("s.category = ?")
        params.append(skill_category)
    if min_proficiency is not None:
        where_clauses.append("us.proficiency_level >= ?")
        params.append(min_proficiency)
    if verified_only:
        where_clauses.append("us.is_verified = 1")

    where_sql = " AND ".join(where_clauses)
    result = execute_query(
        f"""SELECT us.id, us.user_id, us.skill_id, us.proficiency_level, us.years_experience,
                   us.is_verified, us.verified_at, us.verified_by, us.created_at, us.updated_at,
                   s.name as skill_name, s.category as skill_category
            FROM user_skills us
            LEFT JOIN skills s ON us.skill_id = s.id
            WHERE {where_sql}
            ORDER BY us.proficiency_level DESC""",
        params
    )
    if not result:
        return []
    rows = parse_rows(result)
    for row in rows:
        row["is_verified"] = bool(row.get("is_verified"))
    return rows


def active_skill_exists(skill_id: int) -> bool:
    """Check if an active skill exists."""
    result = execute_query("SELECT id FROM skills WHERE id = ? AND is_active = 1", [skill_id])
    return bool(result and result.get("rows"))


def user_has_skill(user_id: int, skill_id: int) -> bool:
    """Check if user already has this skill."""
    result = execute_query("SELECT id FROM user_skills WHERE user_id = ? AND skill_id = ?",
                           [user_id, skill_id])
    return bool(result and result.get("rows"))


def add_user_skill(user_id: int, skill_data: dict) -> dict:
    """Add a skill to user's profile."""
    skill_id = skill_data.get("skill_id")
    now = datetime.now(timezone.utc).isoformat()
    execute_query(
        """INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_experience, is_verified, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [user_id, skill_id, skill_data.get("proficiency_level", 1),
         skill_data.get("years_experience"), 0, now, now]
    )
    id_result = execute_query("SELECT last_insert_rowid() as id", [])
    new_id = 0
    if id_result and id_result.get("rows"):
        id_rows = parse_rows(id_result)
        if id_rows:
            new_id = id_rows[0].get("id", 0)
    return {
        "id": new_id,
        "user_id": user_id,
        "skill_id": skill_id,
        "proficiency_level": skill_data.get("proficiency_level", 1),
        "years_experience": skill_data.get("years_experience"),
        "is_verified": False,
        "created_at": now,
        "updated_at": now,
    }


def get_user_skill_owner(user_skill_id: int) -> Optional[dict]:
    """Get user_skill record for permission checks."""
    result = execute_query("SELECT id, user_id FROM user_skills WHERE id = ?", [user_skill_id])
    if not result or not result.get("rows"):
        return None
    rows = parse_rows(result)
    return rows[0] if rows else None


def update_user_skill(user_skill_id: int, user_skill_data: dict, is_admin: bool, admin_user_id: Optional[int] = None) -> Optional[dict]:
    """Update a user skill record and return the updated version."""
    updates = []
    params: list = []
    if "proficiency_level" in user_skill_data:
        updates.append("proficiency_level = ?")
        params.append(user_skill_data["proficiency_level"])
    if "years_experience" in user_skill_data:
        updates.append("years_experience = ?")
        params.append(user_skill_data["years_experience"])
    if "is_verified" in user_skill_data and is_admin:
        updates.append("is_verified = ?")
        params.append(1 if user_skill_data["is_verified"] else 0)
        if user_skill_data["is_verified"]:
            updates.append("verified_at = ?")
            params.append(datetime.now(timezone.utc).isoformat())
            updates.append("verified_by = ?")
            params.append(admin_user_id)
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(user_skill_id)
        execute_query(f"UPDATE user_skills SET {', '.join(updates)} WHERE id = ?", params)

    result = execute_query(
        """SELECT id, user_id, skill_id, proficiency_level, years_experience,
                  is_verified, verified_at, verified_by, created_at, updated_at
           FROM user_skills WHERE id = ?""",
        [user_skill_id]
    )
    if not result:
        return None
    rows = parse_rows(result)
    if not rows:
        return None
    updated = rows[0]
    updated["is_verified"] = bool(updated.get("is_verified"))
    return updated


def delete_user_skill(user_skill_id: int):
    """Delete a user skill record."""
    execute_query("DELETE FROM user_skills WHERE id = ?", [user_skill_id])
