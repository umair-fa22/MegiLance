# @AI-HINT: Templates API endpoints for reusable project/proposal/contract templates
"""
Templates API - Template management endpoints.

Features:
- CRUD for templates
- Template marketplace
- Apply templates with variables
- Rate and favorite templates
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.services.db_utils import sanitize_text
from app.models.user import User
from app.services.templates import (
    get_templates_service,
    TemplateType,
    TemplateCategory,
    TemplateVisibility
)

router = APIRouter(prefix="/templates", tags=["templates"])


# Request/Response Models
class CreateTemplateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    template_type: TemplateType
    category: TemplateCategory
    content: Dict[str, Any]
    variables: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None
    visibility: TemplateVisibility = TemplateVisibility.PRIVATE
    price: Optional[float] = None


class UpdateTemplateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TemplateCategory] = None
    content: Optional[Dict[str, Any]] = None
    variables: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[str]] = None
    visibility: Optional[TemplateVisibility] = None
    price: Optional[float] = None


class ApplyTemplateRequest(BaseModel):
    variables: Dict[str, Any]


class RateTemplateRequest(BaseModel):
    rating: float = Field(..., ge=1, le=5)


class DuplicateTemplateRequest(BaseModel):
    new_name: Optional[str] = None


# Endpoints
@router.post("")
async def create_template(
    request: CreateTemplateRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new template."""
    service = get_templates_service()
    
    template = await service.create_template(
        user_id=current_user["id"],
        name=sanitize_text(request.name, 200),
        template_type=request.template_type,
        category=request.category,
        content=request.content,
        description=sanitize_text(request.description, 2000) if request.description else None,
        variables=request.variables,
        tags=request.tags,
        visibility=request.visibility,
        price=request.price
    )
    
    return {"template": template, "message": "Template created successfully"}


@router.get("")
async def get_my_templates(
    template_type: Optional[TemplateType] = None,
    current_user = Depends(get_current_active_user)
):
    """Get all templates owned by current user."""
    service = get_templates_service()
    
    templates = await service.get_user_templates(
        user_id=current_user["id"],
        template_type=template_type
    )
    
    return {"templates": templates, "total": len(templates)}


@router.get("/public")
async def get_public_templates(
    template_type: Optional[TemplateType] = None,
    category: Optional[TemplateCategory] = None,
    search: Optional[str] = None,
    featured_only: bool = False,
    limit: int = 20,
    offset: int = 0,
    
):
    """Get public templates from marketplace."""
    service = get_templates_service()
    
    result = await service.get_public_templates(
        template_type=template_type,
        category=category,
        search_query=search,
        featured_only=featured_only,
        limit=limit,
        offset=offset
    )
    
    return result


@router.get("/stats")
async def get_template_stats(
    current_user = Depends(get_current_active_user)
):
    """Get template statistics for current user."""
    service = get_templates_service()
    stats = await service.get_template_stats(current_user["id"])
    return stats


@router.get("/favorites")
async def get_favorite_templates(
    current_user = Depends(get_current_active_user)
):
    """Get user's favorite templates."""
    service = get_templates_service()
    favorites = await service.get_favorites(current_user["id"])
    return {"favorites": favorites}


@router.get("/{template_id}")
async def get_template(
    template_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get a specific template."""
    service = get_templates_service()
    
    template = await service.get_template(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Check access
    if template.visibility == TemplateVisibility.PRIVATE and template.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return {"template": template}


@router.put("/{template_id}")
async def update_template(
    template_id: str,
    request: UpdateTemplateRequest,
    current_user = Depends(get_current_active_user)
):
    """Update an existing template."""
    service = get_templates_service()
    
    updates = request.dict(exclude_unset=True)
    for k in ("name", "description"):
        if k in updates and isinstance(updates[k], str):
            updates[k] = sanitize_text(updates[k], 2000 if k == "description" else 200)
    template = await service.update_template(
        template_id=template_id,
        user_id=current_user["id"],
        updates=updates
    )
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or access denied"
        )
    
    return {"template": template, "message": "Template updated successfully"}


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a template."""
    service = get_templates_service()
    
    success = await service.delete_template(
        template_id=template_id,
        user_id=current_user["id"]
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or access denied"
        )
    
    return {"message": "Template deleted successfully"}


@router.post("/{template_id}/duplicate")
async def duplicate_template(
    template_id: str,
    request: DuplicateTemplateRequest,
    current_user = Depends(get_current_active_user)
):
    """Duplicate a template to your library."""
    service = get_templates_service()
    
    template = await service.duplicate_template(
        template_id=template_id,
        user_id=current_user["id"],
        new_name=request.new_name
    )
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or access denied"
        )
    
    return {"template": template, "message": "Template duplicated successfully"}


@router.post("/{template_id}/apply")
async def apply_template(
    template_id: str,
    request: ApplyTemplateRequest,
    current_user = Depends(get_current_active_user)
):
    """Apply a template with variables to generate content."""
    service = get_templates_service()
    
    result = await service.apply_template(
        template_id=template_id,
        variables=request.variables
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return result


@router.post("/{template_id}/rate")
async def rate_template(
    template_id: str,
    request: RateTemplateRequest,
    current_user = Depends(get_current_active_user)
):
    """Rate a template (1-5 stars)."""
    service = get_templates_service()
    
    template = await service.rate_template(
        template_id=template_id,
        user_id=current_user["id"],
        rating=request.rating
    )
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"template": template, "message": "Rating submitted successfully"}


@router.post("/{template_id}/favorite")
async def add_to_favorites(
    template_id: str,
    current_user = Depends(get_current_active_user)
):
    """Add template to favorites."""
    service = get_templates_service()
    
    success = await service.add_to_favorites(
        user_id=current_user["id"],
        template_id=template_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return {"message": "Added to favorites"}


@router.delete("/{template_id}/favorite")
async def remove_from_favorites(
    template_id: str,
    current_user = Depends(get_current_active_user)
):
    """Remove template from favorites."""
    service = get_templates_service()
    
    success = await service.remove_from_favorites(
        user_id=current_user["id"],
        template_id=template_id
    )
    
    return {"message": "Removed from favorites" if success else "Not in favorites"}
