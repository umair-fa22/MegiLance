# @AI-HINT: Advanced Search API for projects, freelancers, and global search - Turso HTTP only
# Enhanced with input sanitization and security measures
import logging
import re
from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional, Literal
logger = logging.getLogger(__name__)

from app.services import search_service

router = APIRouter(prefix="/search", tags=["search"])

# === Security Constants ===
MAX_QUERY_LENGTH = 200
MAX_SKILLS_LENGTH = 500
MAX_RESULTS = 100

# Characters that could be used for SQL/wildcard injection
UNSAFE_CHARS_PATTERN = re.compile(r'[%_\[\]\\\'\";\-\-]')


def sanitize_search_query(query: str) -> str:
    """Sanitize search query to prevent SQL injection and wildcard abuse"""
    if not query:
        return ""
    
    # Trim and limit length
    query = query.strip()[:MAX_QUERY_LENGTH]
    
    # Escape SQL LIKE wildcards
    query = query.replace('\\', '\\\\')
    query = query.replace('%', '\\%')
    query = query.replace('_', '\\_')
    
    # Remove potentially dangerous characters
    query = re.sub(r'[;\'\"\-\-]', '', query)
    
    return query


def sanitize_skill_list(skills: str) -> List[str]:
    """Sanitize and parse skill list"""
    if not skills:
        return []
    
    skills = skills[:MAX_SKILLS_LENGTH]
    skill_list = []
    
    for s in skills.split(','):
        s = s.strip().lower()
        # Remove special characters from skill names
        s = re.sub(r'[^a-z0-9\s\.\+\#]', '', s)
        if s and len(s) <= 50:
            skill_list.append(s)
    
    return skill_list[:20]  # Max 20 skills


def validate_search_params(q: Optional[str], limit: int, offset: int) -> None:
    """Validate common search parameters"""
    if limit > MAX_RESULTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limit cannot exceed {MAX_RESULTS}"
        )
    
    if q and len(q) > MAX_QUERY_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Search query exceeds maximum length of {MAX_QUERY_LENGTH} characters"
        )


@router.get("/projects")
async def search_projects(
    q: Optional[str] = Query(None, description="Search query (title, description)"),
    skills: Optional[str] = Query(None, description="Comma-separated skill names"),
    category: Optional[str] = Query(None, description="Project category"),
    budget_min: Optional[float] = Query(None, ge=0, description="Minimum budget"),
    budget_max: Optional[float] = Query(None, ge=0, description="Maximum budget"),
    budget_type: Optional[Literal["fixed", "hourly"]] = Query(None, description="Budget type"),
    experience_level: Optional[Literal["entry", "intermediate", "expert"]] = Query(None),
    project_status: Optional[str] = Query("open", alias="status", description="Project status"),
    sort: Optional[Literal["newest", "oldest", "budget_high", "budget_low", "most_proposals"]] = Query("newest"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Advanced project search with sorting, faceted counts, and pagination metadata.
    Returns {items, total_count, facets:{categories, experience_levels}}.
    """
    validate_search_params(q, limit, offset)
    
    conditions = []
    params = []
    
    # Text search with sanitization
    if q:
        safe_q = sanitize_search_query(q)
        if safe_q:
            conditions.append("(p.title LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')")
            search_term = f"%{safe_q}%"
            params.extend([search_term, search_term])
    
    # Filter by status
    valid_statuses = {"open", "in_progress", "completed", "cancelled", "draft", "paused"}
    if project_status:
        if project_status.lower() not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Allowed: {', '.join(valid_statuses)}"
            )
        conditions.append("p.status = ?")
        params.append(project_status.lower())
    
    # Filter by category
    if category:
        safe_category = sanitize_search_query(category)
        if safe_category:
            conditions.append("p.category LIKE ? ESCAPE '\\'")
            params.append(f"%{safe_category}%")
    
    # Filter by budget range
    if budget_min is not None:
        conditions.append("p.budget_min >= ?")
        params.append(budget_min)
    if budget_max is not None:
        conditions.append("p.budget_max <= ?")
        params.append(budget_max)
    
    # Filter by budget type
    if budget_type:
        conditions.append("p.budget_type = ?")
        params.append(budget_type)
    
    # Filter by experience level
    if experience_level:
        conditions.append("p.experience_level = ?")
        params.append(experience_level)
    
    # Filter by skills
    if skills:
        skill_list = sanitize_skill_list(skills)
        for skill in skill_list:
            conditions.append("LOWER(p.skills) LIKE ? ESCAPE '\\'")
            params.append(f"%{skill}%")
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    params.extend([limit, offset])
    
    return search_service.search_projects_advanced(where_clause, params, sort or "newest")


@router.get("/freelancers")
async def search_freelancers(
    q: Optional[str] = Query(None, description="Search query (name, bio, headline)"),
    skills: Optional[str] = Query(None, description="Comma-separated skill names"),
    min_rate: Optional[float] = Query(None, ge=0, description="Minimum hourly rate"),
    max_rate: Optional[float] = Query(None, ge=0, description="Maximum hourly rate"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum average rating"),
    location: Optional[str] = Query(None, description="Location filter"),
    experience_level: Optional[Literal["entry", "intermediate", "expert"]] = Query(None, description="Experience level"),
    availability_status: Optional[Literal["available", "busy", "unavailable", "on_vacation"]] = Query(None, description="Availability status"),
    languages: Optional[str] = Query(None, description="Language filter"),
    timezone: Optional[str] = Query(None, description="Timezone filter"),
    preferred_project_size: Optional[Literal["small", "medium", "large", "enterprise"]] = Query(None, description="Preferred project size"),
    sort: Optional[Literal["newest", "rate_high", "rate_low", "rating_high", "most_reviews", "most_viewed"]] = Query("newest"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Advanced freelancer search with rating data, sorting, and facets.
    Returns {items (with avg_rating, review_count, completed_projects), total_count, facets:{locations}}.
    """
    conditions = ["LOWER(u.user_type) = 'freelancer'", "u.is_active = 1"]
    params = []
    
    validate_search_params(q, limit, offset)

    # Exclude private profiles
    conditions.append("(u.profile_visibility IS NULL OR u.profile_visibility != 'private')")
    
    # Text search - include headline and tagline
    if q:
        safe_q = sanitize_search_query(q)
        if safe_q:
            conditions.append("(u.name LIKE ? ESCAPE '\\' OR u.first_name LIKE ? ESCAPE '\\' OR u.last_name LIKE ? ESCAPE '\\' OR u.bio LIKE ? ESCAPE '\\' OR u.headline LIKE ? ESCAPE '\\' OR u.tagline LIKE ? ESCAPE '\\')")
            search_term = f"%{safe_q}%"
            params.extend([search_term, search_term, search_term, search_term, search_term, search_term])
    
    # Hourly rate range
    if min_rate is not None:
        conditions.append("u.hourly_rate >= ?")
        params.append(min_rate)
    if max_rate is not None:
        conditions.append("u.hourly_rate <= ?")
        params.append(max_rate)
    
    # Location
    if location:
        safe_location = sanitize_search_query(location)
        if safe_location:
            conditions.append("u.location LIKE ? ESCAPE '\\'")
            params.append(f"%{safe_location}%")
    
    # Skills
    if skills:
        skill_list = sanitize_skill_list(skills)
        for skill in skill_list:
            conditions.append("LOWER(u.skills) LIKE ? ESCAPE '\\'")
            params.append(f"%{skill}%")

    # Experience level
    if experience_level:
        conditions.append("u.experience_level = ?")
        params.append(experience_level)

    # Availability status
    if availability_status:
        conditions.append("u.availability_status = ?")
        params.append(availability_status)

    # Languages
    if languages:
        safe_lang = sanitize_search_query(languages)
        if safe_lang:
            conditions.append("LOWER(u.languages) LIKE ? ESCAPE '\\'")
            params.append(f"%{safe_lang.lower()}%")

    # Timezone
    if timezone:
        safe_tz = sanitize_search_query(timezone)
        if safe_tz:
            conditions.append("u.timezone LIKE ? ESCAPE '\\'")
            params.append(f"%{safe_tz}%")

    # Preferred project size
    if preferred_project_size:
        conditions.append("u.preferred_project_size = ?")
        params.append(preferred_project_size)
    
    where_clause = " AND ".join(conditions)
    params.extend([limit, offset])
    
    result = search_service.search_freelancers_advanced(where_clause, params, sort or "newest")
    
    # Post-filter by minimum rating (done in Python since rating comes from JOIN)
    if min_rating is not None:
        result["items"] = [
            f for f in result["items"]
            if (f.get("avg_rating") or 0) >= min_rating
        ]
        result["total_count"] = len(result["items"])
    
    return result


@router.get("/global")
async def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Global search across projects, freelancers, gigs, and skills
    - Returns mixed results from all searchable entities
    - Public endpoint
    """
    safe_q = sanitize_search_query(q)
    if not safe_q:
        return {"query": q, "results": {"projects": [], "freelancers": [], "gigs": [], "skills": [], "tags": []}, "total_results": 0}
    search_term = f"%{safe_q}%"
    
    projects = search_service.global_search_projects(search_term, limit)
    freelancers = search_service.global_search_freelancers(search_term, limit)
    gigs = search_service.global_search_gigs(search_term, limit)
    skills = search_service.global_search_skills(search_term, limit)
    tags = search_service.global_search_tags(search_term, limit)
    
    return {
        "query": q,
        "results": {
            "projects": projects,
            "freelancers": freelancers,
            "gigs": gigs,
            "skills": skills,
            "tags": tags
        },
        "total_results": len(projects) + len(freelancers) + len(gigs) + len(skills) + len(tags)
    }


@router.get("/autocomplete")
async def search_autocomplete(
    q: str = Query(..., min_length=2, description="Search query"),
    type: Optional[Literal["project", "freelancer", "skill", "tag"]] = Query(None),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Autocomplete suggestions for search
    - Returns quick suggestions as user types
    - Can filter by entity type
    """
    safe_q = sanitize_search_query(q)
    if not safe_q:
        return {"query": q, "suggestions": []}
    search_term = f"{safe_q}%"
    suggestions = []
    
    if type is None or type == "project":
        suggestions.extend(search_service.autocomplete_projects(search_term, limit))
    
    if type is None or type == "freelancer":
        suggestions.extend(search_service.autocomplete_freelancers(search_term, limit))
    
    if type is None or type == "skill":
        suggestions.extend(search_service.autocomplete_skills(search_term, limit))
    
    if type is None or type == "tag":
        suggestions.extend(search_service.autocomplete_tags(search_term, limit))
    
    return {
        "query": q,
        "suggestions": suggestions[:limit]
    }


@router.get("/trending")
async def get_trending(
    type: Literal["projects", "freelancers", "skills", "tags"] = Query("projects"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get trending items
    - Most viewed projects
    - Most active freelancers
    - Most used skills/tags
    """
    if type == "projects":
        items = search_service.get_trending_projects(limit)
        return {"type": "projects", "items": items}
    
    elif type == "freelancers":
        items = search_service.get_trending_freelancers(limit)
        return {"type": "freelancers", "items": items}
    
    elif type == "skills":
        items = search_service.get_trending_skills(limit)
        return {"type": "skills", "items": items}
    
    elif type == "tags":
        items = search_service.get_trending_tags(limit)
        return {"type": "tags", "items": items}
