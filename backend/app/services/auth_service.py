# @AI-HINT: Auth service layer for user registration, profile updates, and auth-related DB operations via Turso

from typing import Optional, Dict, Any, List
import logging
import json
logger = logging.getLogger(__name__)

from app.db.turso_http import execute_query, parse_rows, parse_date


def _user_from_row(row: list, cols: list) -> dict:
    """Convert a Turso row to a user dict, parsing profile_data and dates."""
    data = {}
    for i, col in enumerate(cols):
        name = col.get("name", "")
        val = row[i].get("value") if row[i].get("type") != "null" else None
        data[name] = val

    if data.get("joined_at"):
        data["joined_at"] = parse_date(data["joined_at"])

    if data.get("profile_data"):
        try:
            profile = json.loads(data["profile_data"])
            if isinstance(profile, dict):
                data.update(profile)
        except Exception:
            pass

    return data


def check_email_exists(email: str) -> bool:
    """Check if a user with the given email already exists."""
    result = execute_query(
        "SELECT id FROM users WHERE email = ?",
        [email.lower()]
    )
    return bool(result and result.get("rows") and len(result["rows"]) > 0)


def insert_user(
    email: str,
    hashed_password: str,
    is_active: bool,
    name: str,
    user_type: str,
    bio: str,
    skills: str,
    hourly_rate: float,
    profile_image_url: str,
    location: str,
    profile_data_json: Optional[str],
    now: str,
) -> Any:
    """Insert a new user record. Returns the query result or None on failure."""
    return execute_query(
        """INSERT INTO users (
            email, hashed_password, is_active, is_verified, email_verified,
            name, user_type, role, bio, skills, hourly_rate,
            profile_image_url, location, profile_data,
            two_factor_enabled, account_balance,
            joined_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            email.lower(),
            hashed_password,
            1 if is_active else 0,
            0,
            0,
            name,
            user_type,
            user_type,
            bio,
            skills,
            hourly_rate or 0,
            profile_image_url,
            location,
            profile_data_json,
            0,
            0.0,
            now,
            now,
            now,
        ]
    )


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Fetch a user by email, returning a parsed user dict or None."""
    result = execute_query(
        """SELECT id, email, is_active, name, user_type, role, bio, skills,
           hourly_rate, profile_image_url, location, profile_data, joined_at
           FROM users WHERE email = ?""",
        [email]
    )
    if not result or not result.get("rows"):
        return None
    return _user_from_row(result["rows"][0], result.get("cols", []))


def check_email_available(email: str, exclude_user_id: int) -> bool:
    """Check if email is available (not used by another user). Returns True if available."""
    result = execute_query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, exclude_user_id]
    )
    return not (result and result.get("rows"))


_ALLOWED_USER_COLUMNS = frozenset({
    "email", "hashed_password", "is_active", "is_verified", "email_verified",
    "name", "user_type", "role", "bio", "skills", "hourly_rate",
    "profile_image_url", "location", "profile_data",
    "two_factor_enabled", "two_factor_secret", "two_factor_backup_codes",
    "account_balance", "phone", "company", "website", "updated_at",
    # Enhanced profile fields
    "tagline", "headline", "experience_level", "years_of_experience",
    "languages", "timezone", "availability_status", "education", "certifications",
    "work_history", "linkedin_url", "github_url", "website_url", "twitter_url",
    "dribbble_url", "behance_url", "stackoverflow_url", "phone_number",
    "video_intro_url", "resume_url", "availability_hours", "preferred_project_size",
    "industry_focus", "tools_and_technologies", "achievements",
    "testimonials_enabled", "contact_preferences", "profile_visibility",
    "profile_slug", "profile_views", "seller_level",
})


def update_user_fields(user_id: int, update_data: Dict[str, Any]) -> Any:
    """Update user fields from a dict of column name to value.

    Column names are validated against an allowlist to prevent SQL injection.
    """
    set_parts = []
    values = []
    for key, value in update_data.items():
        if key not in _ALLOWED_USER_COLUMNS:
            raise ValueError(f"Invalid column name: {key}")
        set_parts.append(f"{key} = ?")
        values.append(value if value is not None else "")
    if not set_parts:
        return None
    values.append(user_id)
    return execute_query(
        f"UPDATE users SET {', '.join(set_parts)} WHERE id = ?",
        values
    )


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Fetch a user by ID, returning a parsed user dict or None."""
    result = execute_query(
        """SELECT id, email, is_active, name, user_type, role, bio, skills,
           hourly_rate, profile_image_url, location, profile_data, joined_at
           FROM users WHERE id = ?""",
        [user_id]
    )
    if not result or not result.get("rows"):
        return None
    return _user_from_row(result["rows"][0], result.get("cols", []))


def update_backup_codes(user_id: int, codes_json: str) -> Any:
    """Update a user's two-factor backup codes."""
    return execute_query(
        "UPDATE users SET two_factor_backup_codes = ? WHERE id = ?",
        [codes_json, user_id]
    )


def get_user_for_password_reset(email: str) -> Optional[Dict[str, Any]]:
    """Get minimal user info needed for the password reset flow."""
    result = execute_query(
        "SELECT id, email, name FROM users WHERE email = ?",
        [email]
    )
    if not result or not result.get("rows"):
        return None
    return _user_from_row(result["rows"][0], result.get("cols", []))
