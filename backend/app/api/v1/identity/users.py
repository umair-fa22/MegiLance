"""
@AI-HINT: Users API endpoints using Turso remote database ONLY
No local SQLite fallback - all queries go directly to Turso
Enhanced with input validation and security measures
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from typing import List, Optional
from datetime import datetime, timezone
import json
import re

from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate, ProfileCompleteUpdate
from app.core.security import get_password_hash, get_current_user, require_admin, invalidate_user_cache
from app.db.turso_http import get_turso_http
from app.services.db_utils import paginate_params
import logging

logger = logging.getLogger("megilance")

router = APIRouter()

# === Input Validation Constants ===
MAX_BIO_LENGTH = 2000
MAX_NAME_LENGTH = 100
MAX_SKILLS_LENGTH = 1000
MAX_LOCATION_LENGTH = 200
MAX_URL_LENGTH = 500
MAX_PHONE_LENGTH = 20
VALID_USER_TYPES = {"client", "freelancer", "both"}
VALID_DIGEST_FREQUENCIES = {"realtime", "daily", "weekly", "never"}

# Validation patterns
EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
URL_PATTERN = re.compile(r'^https?://[a-zA-Z0-9.-]+(?:/[^\s]*)?$')
PHONE_PATTERN = re.compile(r'^[\d\s\+\-\(\)\.]+$')
TIME_PATTERN = re.compile(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')


def _validate_url(url: Optional[str], field_name: str) -> Optional[str]:
    """Validate URL format"""
    if not url:
        return None
    url = url.strip()
    if len(url) > MAX_URL_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} URL exceeds maximum length of {MAX_URL_LENGTH} characters"
        )
    if not URL_PATTERN.match(url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} URL format"
        )
    return url


def _validate_string(value: Optional[str], field_name: str, max_length: int) -> Optional[str]:
    """Validate and sanitize string input"""
    if not value:
        return None
    value = value.strip()
    if len(value) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} exceeds maximum length of {max_length} characters"
        )
    return value


def _parse_date(value) -> datetime:
    """Parse date from various formats"""
    if value is None:
        return datetime.now(timezone.utc)
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            try:
                return datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
            except (ValueError, TypeError):
                return datetime.now(timezone.utc)
    return datetime.now(timezone.utc)


def _to_str(value) -> Optional[str]:
    """Convert bytes to string if needed"""
    if value is None:
        return None
    if isinstance(value, bytes):
        return value.decode('utf-8')
    return str(value) if value is not None else None


def _row_to_user_dict(row: list, columns: list = None) -> dict:
    """Convert database row to user dict using column names for resilience"""
    # Default column order from our SELECT queries
    if columns is None:
        columns = ["id", "email", "name", "role", "is_active", "user_type",
                    "joined_at", "created_at", "bio", "skills", "hourly_rate",
                    "profile_image_url", "location", "profile_data",
                    "headline", "experience_level", "languages"]
    
    # Build a dict from column names and row values
    raw = {}
    for i, col in enumerate(columns):
        raw[col] = row[i] if i < len(row) else None

    user_dict = {
        "id": raw.get("id"),
        "email": _to_str(raw.get("email")),
        "name": _to_str(raw.get("name")),
        "role": _to_str(raw.get("role")),
        "is_active": bool(raw["is_active"]) if raw.get("is_active") is not None else True,
        "user_type": _to_str(raw.get("user_type")),
        "joined_at": _parse_date(raw.get("joined_at")),
        "created_at": _parse_date(raw.get("created_at")),
        "bio": _to_str(raw.get("bio")),
        "skills": _to_str(raw.get("skills")),
        "hourly_rate": raw.get("hourly_rate"),
        "profile_image_url": _to_str(raw.get("profile_image_url")),
        "location": _to_str(raw.get("location")),
        "headline": _to_str(raw.get("headline")),
        "experience_level": _to_str(raw.get("experience_level")),
        "languages": _to_str(raw.get("languages")),
    }
    
    # Parse profile_data if present
    profile_data_raw = raw.get("profile_data")
    if profile_data_raw:
        try:
            profile_data = json.loads(_to_str(profile_data_raw))
            if isinstance(profile_data, dict):
                user_dict.update(profile_data)
        except (json.JSONDecodeError, TypeError):
            pass
            
    # Parse skills if it looks like a list string
    if user_dict.get("skills"):
        try:
            # If it's a JSON string list
            if user_dict["skills"].startswith("["):
                user_dict["skills"] = json.loads(user_dict["skills"])
            # If it's comma separated
            elif "," in user_dict["skills"]:
                user_dict["skills"] = [s.strip() for s in user_dict["skills"].split(",")]
            # If it's a single string, make it a list
            elif isinstance(user_dict["skills"], str):
                user_dict["skills"] = [user_dict["skills"]]
        except (json.JSONDecodeError, AttributeError):
            pass
            
    return user_dict


@router.get("/", response_model=List[UserRead])
def list_users(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user)
) -> list[dict]:
    """List users from Turso database (authenticated, paginated)"""
    offset, limit = paginate_params(page, page_size)
    try:
        turso = get_turso_http()
        result = turso.execute(
            """SELECT id, email, name, role, is_active, user_type, joined_at, created_at,
                      bio, skills, hourly_rate, profile_image_url, location, profile_data,
                      headline, experience_level, languages
               FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?""",
            [limit, offset]
        )
        
        columns = result.get("columns", [])
        users = [_row_to_user_dict(row, columns) for row in result.get("rows", [])]
        
        # Mask emails for non-admin users
        if current_user.get("role") != "admin":
            for user in users:
                email = user.get("email", "")
                if email and "@" in email:
                    local, domain = email.split("@", 1)
                    user["email"] = f"{local[0]}***@{domain}" if local else f"***@{domain}"
        
        return users
        
    except Exception as e:
        logger.error("list_users failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)) -> dict:
    """Get the currently authenticated user's profile"""
    try:
        turso = get_turso_http()
        result = turso.execute(
            """SELECT id, email, name, role, is_active, user_type, joined_at, created_at,
                      bio, skills, hourly_rate, profile_image_url, location, profile_data,
                      headline, experience_level, languages
               FROM users WHERE id = ?""",
            [current_user.id]
        )
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=404, detail="User not found")
        columns = result.get("columns", [])
        return _row_to_user_dict(rows[0], columns)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_current_user_profile failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.put("/me", response_model=UserRead)
def update_current_user_profile(payload: UserUpdate, current_user: User = Depends(get_current_user)) -> dict:
    """Update the currently authenticated user's profile"""
    try:
        turso = get_turso_http()
        updates = []
        params = []
        data = payload.dict(exclude_unset=True)
        allowed_fields = {"name", "bio", "skills", "hourly_rate", "profile_image_url", "location", "headline", "experience_level", "languages"}
        # Fields that need JSON serialization (list/dict types stored as TEXT in SQLite)
        json_fields = {"skills", "languages", "education", "certifications", "work_history", "industry_focus"}
        for field, value in data.items():
            if field in allowed_fields:
                updates.append(f"{field} = ?")
                if field in json_fields and isinstance(value, (list, dict)):
                    import json as _json
                    params.append(_json.dumps(value))
                else:
                    params.append(value)
        if not updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(current_user.id)
        turso.execute(
            f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
            params
        )
        # Invalidate auth cache so subsequent requests see updated profile
        invalidate_user_cache(current_user.email)
        result = turso.execute(
            """SELECT id, email, name, role, is_active, user_type, joined_at, created_at,
                      bio, skills, hourly_rate, profile_image_url, location, profile_data,
                      headline, experience_level, languages
               FROM users WHERE id = ?""",
            [current_user.id]
        )
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=404, detail="User not found")
        return _row_to_user_dict(rows[0], result.get("columns", []))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("update_current_user_profile failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int) -> dict:
    """Get user by ID from Turso database (public profile - email masked)"""
    try:
        turso = get_turso_http()
        result = turso.execute(
            """SELECT id, email, name, role, is_active, user_type, joined_at, created_at,
                      bio, skills, hourly_rate, profile_image_url, location, profile_data,
                      headline, experience_level, languages
               FROM users WHERE id = ?""",
            [user_id]
        )
        
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        user_dict = _row_to_user_dict(rows[0], result.get("columns", []))
        # Mask email for public profile view
        email = user_dict.get("email", "")
        if email and "@" in email:
            local, domain = email.split("@", 1)
            user_dict["email"] = f"{local[0]}***@{domain}" if local else f"***@{domain}"
        
        return user_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_user failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, current_user: User = Depends(require_admin)) -> dict:
    """Create new user in Turso database"""
    try:
        turso = get_turso_http()
        
        # Check if email exists
        existing = turso.fetch_one("SELECT id FROM users WHERE email = ?", [payload.email])
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        now = datetime.now(timezone.utc).isoformat()
        hashed_pw = get_password_hash(payload.password)
        
        turso.execute(
            """INSERT INTO users (email, hashed_password, name, role, is_active, user_type, 
                                  bio, skills, hourly_rate, profile_image_url, location,
                                  joined_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [payload.email, hashed_pw, payload.name, "User", payload.is_active,
             payload.user_type, payload.bio, payload.skills, payload.hourly_rate,
             payload.profile_image_url, payload.location, now, now, now]
        )
        
        # Get created user
        row = turso.fetch_one(
            "SELECT id, email, name, role, is_active, user_type, joined_at, created_at FROM users WHERE email = ?",
            [payload.email]
        )
        
        return _row_to_user_dict(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("create_user failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


from pydantic import BaseModel, Field

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


@router.post("/me/change-password")
def change_password(
    request: Request,
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Change user password"""
    from app.core.security import verify_password, add_token_to_blacklist
    from app.services.users_service import get_user_password_hash, update_user_password
    
    # Get current hashed password
    current_hash = get_user_password_hash(current_user.id)
    
    if current_hash is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(payload.current_password, current_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long"
        )
    
    # Hash and update password
    update_user_password(current_user.id, payload.new_password)
    
    # Invalidate current session token so old tokens can't be reused
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        old_token = auth_header[7:]
        try:
            add_token_to_blacklist(old_token)
        except Exception:
            pass  # Best-effort blacklisting
    
    return {"message": "Password changed successfully. Please log in again."}


@router.put("/me/complete-profile", response_model=UserRead)
def complete_user_profile(
    profile_data: ProfileCompleteUpdate,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Complete user profile after initial signup"""
    try:
        turso = get_turso_http()
        
        updates = []
        params = []
        
        # Validate and build name from first/last
        if profile_data.firstName and profile_data.lastName:
            first_name = _validate_string(profile_data.firstName, "First name", 50)
            last_name = _validate_string(profile_data.lastName, "Last name", 50)
            if first_name and last_name:
                updates.append("name = ?")
                params.append(f"{first_name} {last_name}")
        
        if profile_data.bio:
            bio = _validate_string(profile_data.bio, "Bio", MAX_BIO_LENGTH)
            if bio:
                updates.append("bio = ?")
                params.append(bio)
        
        if profile_data.location:
            location = _validate_string(profile_data.location, "Location", MAX_LOCATION_LENGTH)
            if location:
                updates.append("location = ?")
                params.append(location)
        
        if profile_data.skills:
            # Handle both list and string format for skills
            skills_value = profile_data.skills
            if isinstance(skills_value, list):
                skills_value = ",".join(skills_value)
            skills = _validate_string(skills_value, "Skills", MAX_SKILLS_LENGTH)
            if skills:
                updates.append("skills = ?")
                params.append(skills)
        
        if profile_data.hourlyRate:
            # Validate hourly rate is reasonable
            try:
                rate = float(profile_data.hourlyRate)
                if rate < 0 or rate > 10000:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Hourly rate must be between 0 and 10000"
                    )
                updates.append("hourly_rate = ?")
                params.append(rate)
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid hourly rate format"
                )
        
        # Build profile_data JSON with validation
        extra_data = {}
        if profile_data.title:
            title = _validate_string(profile_data.title, "Title", 100)
            if title:
                extra_data['title'] = title
        if profile_data.timezone:
            tz_value = _validate_string(profile_data.timezone, "Timezone", 100)
            if tz_value:
                extra_data['timezone'] = tz_value
        if profile_data.experienceLevel:
            valid_levels = {"entry", "intermediate", "expert", "junior", "mid", "senior"}
            if profile_data.experienceLevel.lower() not in valid_levels:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid experience level. Must be one of: {', '.join(valid_levels)}"
                )
            extra_data['experience_level'] = profile_data.experienceLevel
        if profile_data.availability:
            valid_availability = {"full_time", "part_time", "contract", "hourly", "not_available"}
            if profile_data.availability.lower().replace("-", "_") not in valid_availability:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid availability. Must be one of: {', '.join(valid_availability)}"
                )
            extra_data['availability'] = profile_data.availability
        if profile_data.languages:
            # Handle both list and string format for languages
            languages_value = profile_data.languages
            if isinstance(languages_value, list):
                languages_value = ",".join(languages_value)
            languages = _validate_string(languages_value, "Languages", 500)
            if languages:
                extra_data['languages'] = languages
        if profile_data.portfolioItems:
            # Validate portfolio items
            validated_items = []
            for idx, item in enumerate(profile_data.portfolioItems[:10]):  # Max 10 items
                validated_item = {
                    'title': _validate_string(item.title, f"Portfolio item {idx+1} title", 200),
                    'description': _validate_string(item.description, f"Portfolio item {idx+1} description", 1000),
                    'url': _validate_url(item.url, f"Portfolio item {idx+1}"),
                    'imageUrl': _validate_url(item.imageUrl, f"Portfolio item {idx+1} image"),
                    'tags': item.tags[:20] if item.tags else []  # Max 20 tags
                }
                validated_items.append(validated_item)
            extra_data['portfolio_items'] = validated_items
        if profile_data.phoneNumber:
            phone = profile_data.phoneNumber.strip()
            if len(phone) > MAX_PHONE_LENGTH:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Phone number exceeds maximum length of {MAX_PHONE_LENGTH} characters"
                )
            if not PHONE_PATTERN.match(phone):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format"
                )
            extra_data['phone_number'] = phone
        if profile_data.linkedinUrl:
            linkedin = _validate_url(profile_data.linkedinUrl, "LinkedIn")
            if linkedin and "linkedin.com" not in linkedin.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="LinkedIn URL must be a valid LinkedIn profile URL"
                )
            extra_data['linkedin_url'] = linkedin
        if profile_data.githubUrl:
            github = _validate_url(profile_data.githubUrl, "GitHub")
            if github and "github.com" not in github.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="GitHub URL must be a valid GitHub profile URL"
                )
            extra_data['github_url'] = github
        if profile_data.websiteUrl:
            extra_data['website_url'] = _validate_url(profile_data.websiteUrl, "Website")
        
        extra_data['profile_completed'] = True
        
        if extra_data:
            updates.append("profile_data = ?")
            params.append(json.dumps(extra_data))
        
        updates.append("updated_at = ?")
        params.append(datetime.now(timezone.utc).isoformat())
        params.append(current_user.id)
        
        if updates:
            turso.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
            invalidate_user_cache(current_user.email)
        
        # Return updated user
        row = turso.fetch_one(
            "SELECT id, email, name, role, is_active, user_type, joined_at, created_at FROM users WHERE id = ?",
            [current_user.id]
        )
        return _row_to_user_dict(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("complete_user_profile failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/me/notification-preferences")
def get_notification_preferences(current_user: User = Depends(get_current_user)) -> dict:
    """Get the current user's notification preferences"""
    try:
        turso = get_turso_http()
        row = turso.fetch_one(
            "SELECT notification_preferences FROM users WHERE id = ?",
            [current_user.id]
        )
        
        if row and row[0]:
            try:
                return json.loads(row[0])
            except json.JSONDecodeError:
                pass
        
        # Return default preferences
        return {
            "preferences": {
                "projectUpdates": {"email": True, "push": True, "sms": False, "inApp": True},
                "proposals": {"email": True, "push": True, "sms": True, "inApp": True},
                "messages": {"email": True, "push": True, "sms": False, "inApp": True},
                "payments": {"email": True, "push": True, "sms": True, "inApp": True},
                "reviews": {"email": True, "push": False, "sms": False, "inApp": True},
                "marketing": {"email": False, "push": False, "sms": False, "inApp": False}
            },
            "digest": {
                "frequency": "realtime",
                "quietHoursStart": "22:00",
                "quietHoursEnd": "08:00"
            }
        }
        
    except Exception as e:
        logger.error("get_notification_preferences failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.put("/me/notification-preferences")
def update_notification_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_user)
) -> dict:
    """Update the current user's notification preferences"""
    try:
        # Validate preferences structure
        if "preferences" not in preferences or "digest" not in preferences:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid preferences structure. Must include 'preferences' and 'digest' keys."
            )
        
        # Validate preferences object
        prefs = preferences.get("preferences", {})
        if not isinstance(prefs, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'preferences' must be an object"
            )
        
        valid_channels = {"email", "push", "sms", "inApp"}
        valid_categories = {"projectUpdates", "proposals", "messages", "payments", "reviews", "marketing"}
        
        for category, settings in prefs.items():
            if category not in valid_categories:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid preference category: {category}"
                )
            if not isinstance(settings, dict):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Settings for '{category}' must be an object"
                )
            for channel, value in settings.items():
                if channel not in valid_channels:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid channel '{channel}' in category '{category}'"
                    )
                if not isinstance(value, bool):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Channel value for '{channel}' in '{category}' must be boolean"
                    )
        
        # Validate digest settings
        digest = preferences.get("digest", {})
        if not isinstance(digest, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'digest' must be an object"
            )
        
        if "frequency" in digest:
            if digest["frequency"] not in VALID_DIGEST_FREQUENCIES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid digest frequency. Must be one of: {', '.join(VALID_DIGEST_FREQUENCIES)}"
                )
        
        for time_field in ["quietHoursStart", "quietHoursEnd"]:
            if time_field in digest:
                if not TIME_PATTERN.match(str(digest[time_field])):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid time format for {time_field}. Use HH:MM format."
                    )
        
        turso = get_turso_http()
        turso.execute(
            "UPDATE users SET notification_preferences = ?, updated_at = ? WHERE id = ?",
            [json.dumps(preferences), datetime.now(timezone.utc).isoformat(), current_user.id]
        )
        
        return {
            "message": "Notification preferences updated successfully",
            "preferences": preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("update_notification_preferences failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )


@router.get("/me/profile-completeness")
def get_profile_completeness(current_user: User = Depends(get_current_user)) -> dict:
    """Get profile completeness percentage and missing fields"""
    try:
        from app.services.profile_validation import (
            get_profile_completeness as calc_completeness,
            get_missing_profile_fields,
            is_profile_complete,
        )

        percentage = calc_completeness(current_user)
        missing = get_missing_profile_fields(current_user)

        # Build detailed field status for UI
        fields = {
            "name": bool(current_user.name or (current_user.first_name and current_user.last_name)),
            "bio": bool(current_user.bio and len(current_user.bio) > 20),
            "location": bool(current_user.location),
            "profile_picture": bool(current_user.profile_picture_url),
        }

        if str(current_user.user_type).lower() == "freelancer":
            fields["skills"] = bool(current_user.skills and len(current_user.skills) > 2)
            fields["hourly_rate"] = bool(current_user.hourly_rate and current_user.hourly_rate > 0)
            fields["headline"] = bool(getattr(current_user, "headline", None))
            fields["experience_level"] = bool(getattr(current_user, "experience_level", None))
            fields["languages"] = bool(getattr(current_user, "languages", None))
            fields["timezone"] = bool(getattr(current_user, "timezone", None))
            fields["linkedin_url"] = bool(getattr(current_user, "linkedin_url", None))
            fields["github_url"] = bool(getattr(current_user, "github_url", None))
            fields["website_url"] = bool(getattr(current_user, "website_url", None))
        elif str(current_user.user_type).lower() == "client":
            fields["company_name"] = bool(current_user.company_name)

        completed = sum(1 for v in fields.values() if v)
        total = len(fields)

        return {
            "percentage": percentage,
            "completed": completed,
            "total": total,
            "is_complete": is_profile_complete(current_user),
            "missing_fields": missing,
            "fields": fields
        }
        
    except Exception as e:
        logger.error("get_profile_completeness failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to calculate profile completeness"
        )
