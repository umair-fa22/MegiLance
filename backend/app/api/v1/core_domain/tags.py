# @AI-HINT: Tags API endpoints - delegates to tags_service for all data access
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Literal

from app.core.security import get_current_user_from_token
from app.services import tags_service

router = APIRouter(prefix="/tags", tags=["tags"])


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: dict,
    current_user = Depends(get_current_user)
):
    """
    Create a new tag
    - Any authenticated user can create tags
    - Auto-generates slug from name
    - Prevents duplicates
    """
    name = tag.get("name", "").strip().lower()
    tag_type = tag.get("type", "general")

    try:
        return tags_service.find_or_create_tag(name, tag_type)
    except ValueError:
        raise HTTPException(status_code=500, detail="Failed to create tag")


@router.get("/", response_model=List[dict])
async def list_tags(
    type: Optional[Literal["skill", "priority", "location", "budget", "general"]] = Query(None),
    search: Optional[str] = Query(None, description="Search tags by name"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    List all tags
    - Public endpoint
    - Supports filtering by type
    - Supports search by name
    """
    return tags_service.list_tags(tag_type=type, search=search, limit=limit)


@router.get("/popular", response_model=List[dict])
async def get_popular_tags(
    limit: int = Query(20, ge=1, le=100)
):
    """Get most used tags"""
    return tags_service.get_popular_tags(limit=limit)


@router.get("/{slug}", response_model=dict)
async def get_tag(slug: str):
    """Get a tag by slug"""
    tag = tags_service.get_tag_by_slug(slug)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.patch("/{tag_id}", response_model=dict)
async def update_tag(
    tag_id: int,
    update_data: dict,
    current_user = Depends(get_current_user)
):
    """
    Update a tag
    - Admin only
    - Can update name and type
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    tag = tags_service.get_tag_by_id(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    try:
        return tags_service.update_tag(tag_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    current_user = Depends(get_current_user)
):
    """
    Delete a tag
    - Admin only
    - Also removes all project associations
    """
    role = current_user.get("role", "")
    if role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if not tags_service.tag_exists(tag_id):
        raise HTTPException(status_code=404, detail="Tag not found")

    tags_service.delete_tag(tag_id)
    return None


@router.post("/projects/{project_id}/tags/{tag_id}", status_code=status.HTTP_201_CREATED)
async def add_tag_to_project(
    project_id: int,
    tag_id: int,
    current_user = Depends(get_current_user)
):
    """
    Add tag to project
    - Project owner or admin can add tags
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")

    project = tags_service.get_project_owner(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.get("client_id") != user_id and role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if tags_service.get_tag_usage_count(tag_id) is None:
        raise HTTPException(status_code=404, detail="Tag not found")

    if tags_service.is_tag_on_project(project_id, tag_id):
        return {"message": "Tag already added to project"}

    tags_service.add_tag_to_project(project_id, tag_id)
    return {"message": "Tag added to project successfully"}


@router.delete("/projects/{project_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag_from_project(
    project_id: int,
    tag_id: int,
    current_user = Depends(get_current_user)
):
    """
    Remove tag from project
    - Project owner or admin can remove tags
    """
    user_id = current_user.get("user_id")
    role = current_user.get("role", "")

    project = tags_service.get_project_owner(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.get("client_id") != user_id and role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    if not tags_service.remove_tag_from_project(project_id, tag_id):
        raise HTTPException(status_code=404, detail="Tag not associated with project")

    return None


@router.get("/projects/{project_id}/tags", response_model=List[dict])
async def get_project_tags(project_id: int):
    """Get all tags for a project"""
    if not tags_service.project_exists(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    return tags_service.get_project_tags(project_id)
