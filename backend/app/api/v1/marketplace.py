# @AI-HINT: Marketplace search and discovery API endpoints
"""
Marketplace API - Advanced search and discovery endpoints.

Features:
- Smart project search
- Freelancer search
- Category browsing
- Trending & featured
- Recommendations
- Search suggestions
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user, get_current_user_optional
from app.services.marketplace import (
    get_marketplace_service,
    SortOption,
    FreelancerSort
)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


# Request/Response Models
class SaveSearchRequest(BaseModel):
    search_params: Dict[str, Any]
    name: Optional[str] = None
    notify: bool = False


# Project Search Endpoints
@router.get("/projects")
async def search_projects(
    query: Optional[str] = None,
    categories: Optional[str] = None,
    skills: Optional[str] = None,
    budget_min: Optional[float] = None,
    budget_max: Optional[float] = None,
    project_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    duration: Optional[str] = None,
    location: Optional[str] = None,
    sort_by: SortOption = SortOption.RELEVANCE,
    page: int = 1,
    limit: int = 20,
    ,
    current_user = Depends(get_current_user_optional)
):
    """Search projects with advanced filters."""
    service = get_marketplace_service()
    
    # Parse comma-separated values
    cat_list = categories.split(",") if categories else None
    skill_list = skills.split(",") if skills else None
    
    results = await service.search_projects(
        query=query,
        categories=cat_list,
        skills=skill_list,
        budget_min=budget_min,
        budget_max=budget_max,
        project_type=project_type,
        experience_level=experience_level,
        duration=duration,
        location=location,
        sort_by=sort_by,
        page=page,
        limit=limit
    )
    
    return results


@router.get("/projects/featured")
async def get_featured_projects(
    limit: int = 10,
    
):
    """Get featured projects."""
    service = get_marketplace_service()
    projects = await service.get_featured_projects(limit)
    return {"projects": projects}


# Freelancer Search Endpoints
@router.get("/freelancers")
async def search_freelancers(
    query: Optional[str] = None,
    skills: Optional[str] = None,
    categories: Optional[str] = None,
    hourly_rate_min: Optional[float] = None,
    hourly_rate_max: Optional[float] = None,
    rating_min: Optional[float] = None,
    location: Optional[str] = None,
    language: Optional[str] = None,
    experience_level: Optional[str] = None,
    availability: Optional[str] = None,
    sort_by: str = "relevance",
    page: int = 1,
    limit: int = 20,
    ,
    current_user = Depends(get_current_user_optional)
):
    """Search freelancers with advanced filters."""
    service = get_marketplace_service()
    
    skill_list = skills.split(",") if skills else None
    cat_list = categories.split(",") if categories else None
    
    results = await service.search_freelancers(
        query=query,
        skills=skill_list,
        categories=cat_list,
        hourly_rate_min=hourly_rate_min,
        hourly_rate_max=hourly_rate_max,
        rating_min=rating_min,
        location=location,
        language=language,
        experience_level=experience_level,
        availability=availability,
        sort_by=sort_by,
        page=page,
        limit=limit
    )
    
    return results


@router.get("/freelancers/featured")
async def get_featured_freelancers(
    limit: int = 10,
    
):
    """Get featured freelancers."""
    service = get_marketplace_service()
    freelancers = await service.get_featured_freelancers(limit)
    return {"freelancers": freelancers}


# Category Endpoints
@router.get("/categories")
async def get_categories():
    """Get all categories with subcategories."""
    service = get_marketplace_service()
    categories = await service.get_categories()
    return {"categories": categories}


@router.get("/categories/{category_id}/projects")
async def get_category_projects(
    category_id: str,
    subcategory_id: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    
):
    """Get projects by category."""
    service = get_marketplace_service()
    results = await service.get_category_projects(category_id, subcategory_id, page, limit)
    return results


# Trending Endpoints
@router.get("/trending/skills")
async def get_trending_skills(
    limit: int = 10,
    
):
    """Get trending skills."""
    service = get_marketplace_service()
    skills = await service.get_trending_skills(limit)
    return {"skills": skills}


@router.get("/skills/{skill}/demand")
async def get_skill_demand(
    skill: str,
    
):
    """Get demand statistics for a skill."""
    service = get_marketplace_service()
    demand = await service.get_skill_demand(skill)
    return {"demand": demand}


# Recommendations Endpoints
@router.get("/recommendations/projects")
async def get_personalized_projects(
    limit: int = 20,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get personalized project recommendations."""
    service = get_marketplace_service()
    projects = await service.get_personalized_projects(current_user["id"], limit)
    return {"projects": projects}


@router.get("/recommendations/freelancers")
async def get_recommended_freelancers(
    project_id: Optional[str] = None,
    limit: int = 10,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get recommended freelancers for a client."""
    service = get_marketplace_service()
    freelancers = await service.get_recommended_freelancers(current_user["id"], project_id, limit)
    return {"freelancers": freelancers}


# Search Suggestions Endpoints
@router.get("/suggestions")
async def get_search_suggestions(
    query: str,
    type: str = "all",
    
):
    """Get search suggestions."""
    service = get_marketplace_service()
    suggestions = await service.get_search_suggestions(query, type)
    return suggestions


@router.get("/autocomplete")
async def get_autocomplete(
    query: str,
    type: str = "all",
    
):
    """Get autocomplete results."""
    service = get_marketplace_service()
    results = await service.get_autocomplete(query, type)
    return {"results": results}


# Recent & Saved Searches
@router.get("/searches/recent")
async def get_recent_searches(
    limit: int = 10,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get user's recent searches."""
    service = get_marketplace_service()
    searches = await service.get_recent_searches(current_user["id"], limit)
    return {"searches": searches}


@router.post("/searches/save")
async def save_search(
    request: SaveSearchRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Save a search for later."""
    service = get_marketplace_service()
    saved = await service.save_search(
        current_user["id"],
        request.search_params,
        request.name,
        request.notify
    )
    return {"saved_search": saved}


# Statistics Endpoints
@router.get("/stats")
async def get_marketplace_stats():
    """Get marketplace statistics."""
    service = get_marketplace_service()
    stats = await service.get_marketplace_stats()
    return {"stats": stats}
