# @AI-HINT: Advanced search API endpoints using Turso FTS5 for high-performance full-text search
"""
Advanced Search API
Provides full-text search across projects, freelancers, and skills using Turso's FTS5 extension
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel, Field

from app.core.security import get_current_user_optional, get_current_active_user, require_admin
from app.services.search_fts import get_search_service


router = APIRouter(prefix="/search", tags=["search-advanced"])


# Request/Response Models
class ProjectSearchRequest(BaseModel):
    """Project search request with filters"""
    query: str = Field(..., min_length=1, description="Search query")
    category: Optional[str] = None
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    experience_level: Optional[str] = None
    status: Optional[str] = "open"
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)


class FreelancerSearchRequest(BaseModel):
    """Freelancer search request with filters"""
    query: str = Field(..., min_length=1, description="Search query")
    skills: Optional[List[str]] = None
    min_hourly_rate: Optional[float] = None
    max_hourly_rate: Optional[float] = None
    location: Optional[str] = None
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)


class SearchResult(BaseModel):
    """Generic search result wrapper"""
    results: List[dict]
    total: int
    limit: int
    offset: int
    query_time_ms: float
    query: Optional[str] = None


class AutocompleteResponse(BaseModel):
    """Autocomplete suggestions"""
    suggestions: List[str]
    query: str


# Endpoints
@router.post("/projects", response_model=SearchResult)
async def search_projects(
    request: ProjectSearchRequest,
    current_user = Depends(get_current_user_optional)
):
    """
    Advanced project search with full-text search and filters
    
    Features:
    - Full-text search using Turso FTS5
    - Relevance ranking
    - Category, budget, and experience filters
    - Fast performance with indexed search
    """
    search_service = get_search_service()
    
    results = await search_service.search_projects(
        query=request.query,
        category=request.category,
        min_budget=request.min_budget,
        max_budget=request.max_budget,
        experience_level=request.experience_level,
        status=request.status,
        limit=request.limit,
        offset=request.offset
    )
    
    return results


@router.post("/freelancers", response_model=SearchResult)
async def search_freelancers(
    request: FreelancerSearchRequest,
    current_user = Depends(get_current_user_optional)
):
    """
    Advanced freelancer search with full-text search and filters
    
    Features:
    - Search across name, bio, skills, location
    - FTS5 relevance ranking
    - Hourly rate and location filters
    - Skill matching
    """
    search_service = get_search_service()
    
    results = await search_service.search_freelancers(
        query=request.query,
        skills=request.skills,
        min_hourly_rate=request.min_hourly_rate,
        max_hourly_rate=request.max_hourly_rate,
        location=request.location,
        limit=request.limit,
        offset=request.offset
    )
    
    return results


@router.get("/autocomplete-fts", response_model=AutocompleteResponse)
async def autocomplete_fts(
    q: str = Query(..., min_length=1, description="Search query"),
    type: str = Query("all", pattern="^(all|projects|skills)$"),
    limit: int = Query(10, ge=1, le=50),
):
    """
    FTS5-powered autocomplete suggestions for search queries
    
    Returns suggestions from:
    - Project titles
    - Skill names
    - Popular search terms
    """
    search_service = get_search_service()
    
    suggestions = await search_service.autocomplete(
        query=q,
        type=type,
        limit=limit
    )
    
    return {
        "suggestions": suggestions,
        "query": q
    }


@router.get("/analytics")
async def get_search_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_active_user),
    _admin = Depends(require_admin)
):
    """
    Get search analytics (admin only)
    
    Returns:
    - Total searches
    - Popular search terms
    - Zero-result queries
    - Average results per search
    """
    # In production, check if user is admin
    search_service = get_search_service()
    
    analytics = await search_service.get_search_analytics(days=days)
    
    return analytics


@router.post("/reindex")
async def reindex_search(
    current_user = Depends(get_current_active_user),
    _admin = Depends(require_admin)
):
    """
    Reindex all searchable content (admin only)
    
    Rebuilds FTS5 indexes for:
    - Projects
    - Users (freelancers)
    - Skills
    """
    # In production, check if user is admin
    search_service = get_search_service()
    
    try:
        result = await search_service.reindex_all()
        return {
            "status": "success",
            "message": "Search indexes rebuilt successfully",
            **result
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Reindexing failed"
        )


@router.get("/")
async def unified_search(
    q: str = Query(..., min_length=1, description="Search query"),
    types: str = Query("all", description="Search types: all, projects, freelancers, skills"),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Unified search across all entity types
    
    Returns combined results from projects, freelancers, and skills
    """
    search_service = get_search_service()
    
    results = {
        "query": q,
        "projects": [],
        "freelancers": [],
        "skills": []
    }
    
    if types in ["all", "projects"]:
        project_results = await search_service.search_projects(
            query=q,
            limit=limit
        )
        results["projects"] = project_results["results"]
    
    if types in ["all", "freelancers"]:
        freelancer_results = await search_service.search_freelancers(
            query=q,
            limit=limit
        )
        results["freelancers"] = freelancer_results["results"]
    
    return results
