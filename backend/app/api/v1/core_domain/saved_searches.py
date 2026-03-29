# @AI-HINT: Saved searches API - persistent search queries and search alerts
"""
Saved Searches API - Search Query Management Endpoints

Provides:
- Save/load search queries
- Search alerts with notifications
- Search history tracking
- Popular searches
- Search templates
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.services.saved_searches import saved_searches_service
from app.services.db_utils import sanitize_text


router = APIRouter()


# ============== Pydantic Models ==============

class SaveSearchRequest(BaseModel):
    """Request to save a search."""
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., description="projects, freelancers, companies, skills, jobs, portfolios")
    criteria: Dict[str, Any] = Field(..., description="Search filters and parameters")
    description: Optional[str] = Field(None, max_length=500)
    is_alert: bool = Field(default=False, description="Enable email alerts for new matches")
    alert_frequency: str = Field(default="daily", description="daily, weekly, instant")


class UpdateSearchRequest(BaseModel):
    """Request to update a saved search."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    criteria: Optional[Dict[str, Any]] = None
    description: Optional[str] = Field(None, max_length=500)
    is_alert: Optional[bool] = None
    alert_frequency: Optional[str] = None


class ToggleAlertRequest(BaseModel):
    """Request to toggle search alerts."""
    enable: bool
    frequency: str = Field(default="daily", description="daily, weekly, instant")


class CreateFromTemplateRequest(BaseModel):
    """Request to create search from template."""
    category: str
    template_name: str
    custom_name: Optional[str] = None


class RecordSearchRequest(BaseModel):
    """Request to record a search in history."""
    category: str
    criteria: Dict[str, Any]
    results_count: int = 0


# ============== Saved Search Endpoints ==============

@router.post("")
async def save_search(
    request: SaveSearchRequest,
    current_user = Depends(get_current_active_user)
):
    """
    Save a search query for later use.
    
    - **name**: Display name for the saved search
    - **category**: Search category (projects, freelancers, etc.)
    - **criteria**: Search filters (keywords, budget range, skills, etc.)
    - **is_alert**: Enable email notifications for new matches
    - **alert_frequency**: How often to check for new matches
    """
    try:
        result = await saved_searches_service.save_search(
            user_id=str(current_user.get("id")),
            name=sanitize_text(request.name, 100),
            category=request.category,
            criteria=request.criteria,
            description=sanitize_text(request.description, 500) if request.description else None,
            is_alert=request.is_alert,
            alert_frequency=request.alert_frequency
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def get_saved_searches(
    category: Optional[str] = Query(None, description="Filter by category"),
    alerts_only: bool = Query(False, description="Only searches with alerts enabled"),
    current_user = Depends(get_current_active_user)
):
    """
    Get all saved searches for the current user.
    
    Optional filters:
    - **category**: Filter by search category
    - **alerts_only**: Only return searches with alerts enabled
    """
    result = await saved_searches_service.get_saved_searches(
        user_id=str(current_user.get("id")),
        category=category,
        include_alerts_only=alerts_only
    )
    return result


@router.get("/{search_id}")
async def get_saved_search(
    search_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get a specific saved search by ID."""
    result = await saved_searches_service.get_saved_searches(
        user_id=str(current_user.get("id"))
    )
    
    for search in result["saved_searches"]:
        if search["id"] == search_id:
            return search
    
    raise HTTPException(status_code=404, detail="Saved search not found")


@router.put("/{search_id}")
async def update_saved_search(
    search_id: str,
    request: UpdateSearchRequest,
    current_user = Depends(get_current_active_user)
):
    """Update a saved search."""
    try:
        updates = request.dict(exclude_unset=True)
        result = await saved_searches_service.update_saved_search(
            user_id=str(current_user.get("id")),
            search_id=search_id,
            updates=updates
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{search_id}")
async def delete_saved_search(
    search_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a saved search."""
    try:
        result = await saved_searches_service.delete_saved_search(
            user_id=str(current_user.get("id")),
            search_id=search_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{search_id}/execute")
async def execute_saved_search(
    search_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Execute a saved search and return results.
    
    This runs the search with the saved criteria and returns matching items.
    """
    try:
        result = await saved_searches_service.execute_saved_search(
            user_id=str(current_user.get("id")),
            search_id=search_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== Alert Endpoints ==============

@router.post("/{search_id}/alert")
async def toggle_search_alert(
    search_id: str,
    request: ToggleAlertRequest,
    current_user = Depends(get_current_active_user)
):
    """
    Enable or disable alerts for a saved search.
    
    - **enable**: True to enable, False to disable
    - **frequency**: How often to send alerts (daily, weekly, instant)
    """
    try:
        result = await saved_searches_service.toggle_search_alert(
            user_id=str(current_user.get("id")),
            search_id=search_id,
            enable=request.enable,
            frequency=request.frequency
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/alerts/active")
async def get_active_alerts(
    current_user = Depends(get_current_active_user)
):
    """Get all saved searches with alerts enabled."""
    result = await saved_searches_service.get_saved_searches(
        user_id=str(current_user.get("id")),
        include_alerts_only=True
    )
    return result


# ============== History Endpoints ==============

@router.get("/history/recent")
async def get_search_history(
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_active_user)
):
    """Get user's recent search history."""
    result = await saved_searches_service.get_search_history(
        user_id=str(current_user.get("id")),
        category=category,
        limit=limit
    )
    return result


@router.post("/history/record")
async def record_search(
    request: RecordSearchRequest,
    current_user = Depends(get_current_active_user)
):
    """Record a search in user's history."""
    result = await saved_searches_service.add_to_history(
        user_id=str(current_user.get("id")),
        category=request.category,
        criteria=request.criteria,
        results_count=request.results_count
    )
    return result


@router.delete("/history/clear")
async def clear_search_history(
    category: Optional[str] = Query(None, description="Only clear specific category"),
    current_user = Depends(get_current_active_user)
):
    """Clear search history."""
    result = await saved_searches_service.clear_search_history(
        user_id=str(current_user.get("id")),
        category=category
    )
    return result


# ============== Template Endpoints ==============

@router.get("/templates/list")
async def get_search_templates(
    category: Optional[str] = Query(None),
    current_user = Depends(get_current_active_user)
):
    """
    Get predefined search templates.
    
    Templates provide common search patterns like:
    - High Budget Projects
    - Top Rated Freelancers
    - Urgent Projects
    - Remote Jobs
    """
    result = await saved_searches_service.get_search_templates(
        category=category
    )
    return result


@router.post("/templates/create")
async def create_from_template(
    request: CreateFromTemplateRequest,
    current_user = Depends(get_current_active_user)
):
    """
    Create a saved search from a predefined template.
    
    - **category**: Template category
    - **template_name**: Name of the template to use
    - **custom_name**: Optional custom name for the saved search
    """
    try:
        result = await saved_searches_service.create_search_from_template(
            user_id=str(current_user.get("id")),
            category=request.category,
            template_name=request.template_name,
            custom_name=request.custom_name
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== Analytics Endpoints ==============

@router.get("/analytics/popular")
async def get_popular_searches(
    category: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    current_user = Depends(get_current_active_user)
):
    """Get most popular searches across the platform."""
    result = await saved_searches_service.get_popular_searches(
        category=category,
        limit=limit
    )
    return result


@router.get("/analytics/me")
async def get_my_search_analytics(
    current_user = Depends(get_current_active_user)
):
    """Get search analytics for the current user."""
    result = await saved_searches_service.get_search_analytics(
        user_id=str(current_user.get("id"))
    )
    return result


# ============== Categories Endpoint ==============

@router.get("/categories/list")
async def get_search_categories(
    current_user = Depends(get_current_active_user)
):
    """Get available search categories."""
    return {
        "categories": saved_searches_service.SEARCH_CATEGORIES,
        "descriptions": {
            "projects": "Search for projects to bid on",
            "freelancers": "Find freelancers for your projects",
            "companies": "Search for companies and agencies",
            "skills": "Browse by skill categories",
            "jobs": "Job listings and opportunities",
            "portfolios": "Browse freelancer portfolios"
        }
    }
