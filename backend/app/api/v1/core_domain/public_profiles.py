# @AI-HINT: Public freelancer profile endpoints - shareable profiles for getting work
"""
Public profile endpoints for freelancers.
No authentication required - these are designed for sharing with potential clients.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import json
import logging

from app.db.turso_http import execute_query

logger = logging.getLogger("megilance")

router = APIRouter()

# Columns to fetch for public profiles (no sensitive data)
PUBLIC_PROFILE_COLUMNS = """
    id, name, bio, skills, hourly_rate, profile_image_url, location, title,
    tagline, headline, experience_level, years_of_experience, languages, timezone,
    availability_status, education, certifications, work_history,
    linkedin_url, github_url, website_url, twitter_url, dribbble_url,
    behance_url, stackoverflow_url, video_intro_url, availability_hours,
    preferred_project_size, industry_focus, tools_and_technologies,
    achievements, testimonials_enabled, profile_slug, profile_visibility,
    profile_views, seller_level, joined_at, last_active_at, profile_data
"""


def _parse_json_field(value) -> any:
    """Safely parse a JSON field, returning None on failure."""
    if not value:
        return None
    if isinstance(value, bytes):
        value = value.decode('utf-8')
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, ValueError):
            return value
    return value


def _build_public_profile(row: list, columns: list) -> dict:
    """Build a public profile dict from a DB row."""
    raw = {}
    for i, col in enumerate(columns):
        raw[col] = row[i] if i < len(row) else None

    # Parse JSON fields
    skills = _parse_json_field(raw.get("skills"))
    if isinstance(skills, str):
        if skills.startswith("["):
            skills = _parse_json_field(skills)
        elif "," in skills:
            skills = [s.strip() for s in skills.split(",") if s.strip()]
        else:
            skills = [skills] if skills else []

    languages = _parse_json_field(raw.get("languages"))
    if isinstance(languages, str):
        if languages.startswith("["):
            languages = _parse_json_field(languages)
        elif "," in languages:
            languages = [s.strip() for s in languages.split(",") if s.strip()]
        else:
            languages = [languages] if languages else []

    education = _parse_json_field(raw.get("education"))
    certifications = _parse_json_field(raw.get("certifications"))
    work_history = _parse_json_field(raw.get("work_history"))
    achievements = _parse_json_field(raw.get("achievements"))
    industry_focus = _parse_json_field(raw.get("industry_focus"))
    tools_and_technologies = _parse_json_field(raw.get("tools_and_technologies"))

    # Parse profile_data for extra fields
    profile_data = _parse_json_field(raw.get("profile_data"))
    extra = profile_data if isinstance(profile_data, dict) else {}

    profile = {
        "id": raw.get("id"),
        "name": raw.get("name"),
        "title": extra.get("title") or raw.get("title"),
        "tagline": raw.get("tagline"),
        "headline": raw.get("headline"),
        "bio": raw.get("bio"),
        "skills": skills or [],
        "hourly_rate": raw.get("hourly_rate"),
        "location": raw.get("location"),
        "timezone": raw.get("timezone"),
        "profile_image_url": raw.get("profile_image_url"),
        "experience_level": raw.get("experience_level"),
        "years_of_experience": raw.get("years_of_experience"),
        "availability_status": raw.get("availability_status"),
        "availability_hours": raw.get("availability_hours"),
        "preferred_project_size": raw.get("preferred_project_size"),
        "languages": languages or [],
        "education": education if isinstance(education, list) else [],
        "certifications": certifications if isinstance(certifications, list) else [],
        "work_history": work_history if isinstance(work_history, list) else [],
        "achievements": achievements if isinstance(achievements, list) else [],
        "industry_focus": industry_focus if isinstance(industry_focus, list) else [],
        "tools_and_technologies": tools_and_technologies if isinstance(tools_and_technologies, list) else [],
        "linkedin_url": raw.get("linkedin_url"),
        "github_url": raw.get("github_url"),
        "website_url": raw.get("website_url"),
        "twitter_url": raw.get("twitter_url"),
        "dribbble_url": raw.get("dribbble_url"),
        "behance_url": raw.get("behance_url"),
        "stackoverflow_url": raw.get("stackoverflow_url"),
        "video_intro_url": raw.get("video_intro_url"),
        "testimonials_enabled": bool(raw.get("testimonials_enabled", True)),
        "profile_slug": raw.get("profile_slug"),
        "profile_views": raw.get("profile_views", 0),
        "seller_level": raw.get("seller_level"),
        "joined_at": raw.get("joined_at"),
        "last_active_at": raw.get("last_active_at"),
        # Include portfolio_url from profile_data if available
        "portfolio_url": extra.get("portfolio_url"),
    }

    return profile


@router.get("/search")
def search_freelancers(
    query: Optional[str] = Query(None, description="Search by name or skills"),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    location: Optional[str] = None,
    min_rate: Optional[float] = None,
    max_rate: Optional[float] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    """Search freelancers by name, skills, location, etc."""
    try:
        conditions = ["role = 'freelancer'", "is_active = 1"]
        params = []
        if query:
            conditions.append("(name LIKE ? OR skills LIKE ? OR bio LIKE ?)")
            params.extend([f"%{query}%", f"%{query}%", f"%{query}%"])
        if skills:
            for skill in [s.strip() for s in skills.split(",") if s.strip()]:
                conditions.append("skills LIKE ?")
                params.append(f"%{skill}%")
        if location:
            conditions.append("location LIKE ?")
            params.append(f"%{location}%")
        if min_rate is not None:
            conditions.append("hourly_rate >= ?")
            params.append(min_rate)
        if max_rate is not None:
            conditions.append("hourly_rate <= ?")
            params.append(max_rate)
        where = " AND ".join(conditions)
        offset = (page - 1) * page_size
        params += [page_size, offset]
        result = execute_query(
            f"SELECT {PUBLIC_PROFILE_COLUMNS} FROM users WHERE {where} ORDER BY profile_views DESC LIMIT ? OFFSET ?",
            params
        )
        cols = result.get("columns", result.get("cols", []))
        freelancers = [_build_public_profile(r, cols) for r in result.get("rows", [])]
        return {"freelancers": freelancers, "total": len(freelancers), "page": page, "page_size": page_size}
    except Exception as e:
        logger.error("search_freelancers failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/id/{user_id}")
def get_public_profile_by_id(user_id: int) -> dict:
    """Get a freelancer's public profile by user ID."""
    try:
        result = execute_query(
            f"SELECT {PUBLIC_PROFILE_COLUMNS} FROM users WHERE id = ? AND role = 'freelancer'",
            [user_id]
        )
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=404, detail="Freelancer not found")

        columns = result.get("columns", result.get("cols", []))
        profile = _build_public_profile(rows[0], columns)

        # Check visibility
        visibility = profile.get("profile_visibility", "public")
        if visibility == "private":
            raise HTTPException(status_code=404, detail="This profile is private")

        # Increment view count
        try:
            execute_query(
                "UPDATE users SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = ?",
                [user_id]
            )
        except Exception:
            pass  # Non-critical

        return {"profile": profile}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_public_profile_by_id failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/slug/{slug}")
def get_public_profile_by_slug(slug: str) -> dict:
    """Get a freelancer's public profile by their unique URL slug."""
    try:
        result = execute_query(
            f"SELECT {PUBLIC_PROFILE_COLUMNS} FROM users WHERE profile_slug = ? AND role = 'freelancer'",
            [slug]
        )
        rows = result.get("rows", [])
        if not rows:
            raise HTTPException(status_code=404, detail="Freelancer not found")

        columns = result.get("columns", result.get("cols", []))
        profile = _build_public_profile(rows[0], columns)

        visibility = profile.get("profile_visibility", "public")
        if visibility == "private":
            raise HTTPException(status_code=404, detail="This profile is private")

        # Increment view count
        try:
            execute_query(
                "UPDATE users SET profile_views = COALESCE(profile_views, 0) + 1 WHERE profile_slug = ?",
                [slug]
            )
        except Exception:
            pass

        return {"profile": profile}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_public_profile_by_slug failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/featured")
def get_featured_freelancers(
    limit: int = Query(12, ge=1, le=50),
    skills: Optional[str] = Query(None, description="Comma-separated skills to filter by"),
    location: Optional[str] = None,
    min_rate: Optional[float] = None,
    max_rate: Optional[float] = None,
    experience_level: Optional[str] = None,
    availability: Optional[str] = None,
) -> dict:
    """Get featured freelancers for public browsing with optional filters."""
    try:
        conditions = ["role = 'freelancer'", "is_active = 1"]
        params = []

        if skills:
            skill_list = [s.strip() for s in skills.split(",") if s.strip()]
            for skill in skill_list:
                conditions.append("skills LIKE ?")
                params.append(f"%{skill}%")

        if location:
            conditions.append("location LIKE ?")
            params.append(f"%{location}%")

        if min_rate is not None:
            conditions.append("hourly_rate >= ?")
            params.append(min_rate)

        if max_rate is not None:
            conditions.append("hourly_rate <= ?")
            params.append(max_rate)

        if experience_level:
            conditions.append("experience_level = ?")
            params.append(experience_level)

        if availability:
            conditions.append("availability_status = ?")
            params.append(availability)

        where_clause = " AND ".join(conditions)
        params.append(limit)

        result = execute_query(
            f"""SELECT {PUBLIC_PROFILE_COLUMNS}
                FROM users WHERE {where_clause}
                AND (profile_visibility IS NULL OR profile_visibility != 'private')
                ORDER BY profile_views DESC, seller_level DESC
                LIMIT ?""",
            params
        )

        columns = result.get("columns", result.get("cols", []))
        profiles = [_build_public_profile(row, columns) for row in result.get("rows", [])]

        return {"freelancers": profiles, "total": len(profiles)}

    except Exception as e:
        logger.error("get_featured_freelancers failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/{user_id}/stats")
def get_freelancer_stats(user_id: int) -> dict:
    """Get public statistics for a freelancer."""
    try:
        result = execute_query(
            """SELECT level, total_orders, completed_orders, average_rating,
                      total_reviews, on_time_delivery_rate, response_rate,
                      repeat_client_rate, job_success_score, identity_verified,
                      member_since
               FROM seller_stats WHERE user_id = ?""",
            [user_id]
        )
        rows = result.get("rows", [])
        if not rows:
            return {"stats": {
                "level": "new_seller",
                "completed_projects": 0,
                "average_rating": 0,
                "total_reviews": 0,
                "on_time_delivery": 0,
                "response_rate": 0,
                "repeat_client_rate": 0,
                "job_success_score": 0,
                "identity_verified": False,
            }}

        row = rows[0]
        columns = result.get("columns", result.get("cols", []))
        raw = dict(zip(columns, row))

        return {"stats": {
            "level": raw.get("level", "new_seller"),
            "completed_projects": raw.get("completed_orders", 0),
            "average_rating": float(raw.get("average_rating", 0) or 0),
            "total_reviews": raw.get("total_reviews", 0),
            "on_time_delivery": float(raw.get("on_time_delivery_rate", 0) or 0),
            "response_rate": float(raw.get("response_rate", 0) or 0),
            "repeat_client_rate": float(raw.get("repeat_client_rate", 0) or 0),
            "job_success_score": float(raw.get("job_success_score", 0) or 0),
            "identity_verified": bool(raw.get("identity_verified", False)),
            "member_since": raw.get("member_since"),
        }}

    except Exception as e:
        logger.error("get_freelancer_stats failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/{user_id}/portfolio")
def get_freelancer_portfolio(user_id: int) -> dict:
    """Get a freelancer's portfolio items for public viewing."""
    try:
        result = execute_query(
            """SELECT id, title, description, image_url, project_url, tags, created_at
               FROM portfolio_items WHERE freelancer_id = ?
               ORDER BY created_at DESC""",
            [user_id]
        )

        columns = result.get("columns", result.get("cols", []))
        items = []
        for row in result.get("rows", []):
            raw = dict(zip(columns, row))
            tags = _parse_json_field(raw.get("tags"))
            items.append({
                "id": raw.get("id"),
                "title": raw.get("title"),
                "description": raw.get("description"),
                "image_url": raw.get("image_url"),
                "project_url": raw.get("project_url"),
                "tags": tags if isinstance(tags, list) else [],
                "created_at": raw.get("created_at"),
            })

        return {"portfolio": items, "total": len(items)}

    except Exception as e:
        logger.error("get_freelancer_portfolio failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.get("/{user_id}/reviews")
def get_freelancer_reviews(
    user_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
) -> dict:
    """Get public reviews for a freelancer."""
    try:
        offset = (page - 1) * page_size
        result = execute_query(
            """SELECT r.id, r.rating, r.comment, r.created_at,
                      u.name as reviewer_name, u.profile_image_url as reviewer_avatar
               FROM reviews r
               LEFT JOIN users u ON r.reviewer_id = u.id
               WHERE r.reviewee_id = ?
               ORDER BY r.created_at DESC
               LIMIT ? OFFSET ?""",
            [user_id, page_size, offset]
        )

        columns = result.get("columns", result.get("cols", []))
        reviews = []
        for row in result.get("rows", []):
            raw = dict(zip(columns, row))
            reviews.append({
                "id": raw.get("id"),
                "rating": float(raw.get("rating", 0) or 0),
                "comment": raw.get("comment"),
                "created_at": raw.get("created_at"),
                "reviewer_name": raw.get("reviewer_name"),
                "reviewer_avatar": raw.get("reviewer_avatar"),
            })

        # Get total count
        count_result = execute_query(
            "SELECT COUNT(*) as total FROM reviews WHERE reviewee_id = ?",
            [user_id]
        )
        total = 0
        if count_result and count_result.get("rows"):
            total = count_result["rows"][0][0] or 0

        return {"reviews": reviews, "total": total, "page": page, "page_size": page_size}

    except Exception as e:
        logger.error("get_freelancer_reviews failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
