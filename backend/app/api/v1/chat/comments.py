# @AI-HINT: Comments API - threaded discussion system endpoints
"""
Comments API - Threaded Discussion Endpoints

Provides:
- CRUD for comments
- Threading/replies
- Reactions (emoji)
- Mentions
- Moderation (pin, resolve, delete)
"""

from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.services.comments import comments_service
from app.services.db_utils import sanitize_text
import logging

logger = logging.getLogger("megilance")


router = APIRouter()


# ============== Pydantic Models ==============

class CreateCommentRequest(BaseModel):
    """Request to create a comment."""
    resource_type: str = Field(..., description="project, proposal, deliverable, milestone, contract, portfolio, review, dispute, task")
    resource_id: str = Field(..., description="ID of the resource")
    content: str = Field(..., min_length=1, max_length=10000, description="Comment content (supports Markdown)")
    parent_comment_id: Optional[str] = Field(None, description="Parent comment ID for replies")
    attachments: Optional[List[Dict]] = None


class UpdateCommentRequest(BaseModel):
    """Request to update a comment."""
    content: str = Field(..., min_length=1, max_length=10000)


class ReactionRequest(BaseModel):
    """Request to add/remove reaction."""
    reaction: str = Field(..., description="Reaction type: thumbs_up, heart, laugh, etc.")


# ============== Comment CRUD ==============

@router.post("")
async def create_comment(
    request: CreateCommentRequest,
    current_user = Depends(get_current_active_user),
    
):
    """
    Create a new comment.
    
    Supports Markdown formatting and @mentions.
    Use parent_comment_id to create replies (max depth: 5).
    """
    try:
        result = await comments_service.create_comment(
            user_id=str(current_user.get("id")),
            resource_type=request.resource_type,
            resource_id=request.resource_id,
            content=sanitize_text(request.content, 10000),
            parent_comment_id=request.parent_comment_id,
            attachments=request.attachments
        )
        return result
    except ValueError as e:
        logger.warning("create_comment validation error: %s", e)
        raise HTTPException(status_code=400, detail="Invalid request. Please check your input.")


@router.get("")
async def get_comments(
    resource_type: str = Query(..., description="Resource type"),
    resource_id: str = Query(..., description="Resource ID"),
    sort: str = Query("newest", description="Sort: newest, oldest, top"),
    include_deleted: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_active_user),
    
):
    """
    Get comments for a resource.
    
    Returns flat list with threading info (use threaded endpoint for tree view).
    """
    result = await comments_service.get_comments(
        resource_type=resource_type,
        resource_id=resource_id,
        include_deleted=include_deleted,
        sort=sort,
        limit=limit,
        offset=offset
    )
    return result


@router.get("/threaded")
async def get_threaded_comments(
    resource_type: str = Query(...),
    resource_id: str = Query(...),
    include_deleted: bool = Query(False),
    current_user = Depends(get_current_active_user),
    
):
    """
    Get comments organized as a thread tree.
    
    Each comment includes its replies nested in a 'replies' array.
    """
    result = await comments_service.get_threaded_comments(
        resource_type=resource_type,
        resource_id=resource_id,
        include_deleted=include_deleted
    )
    return result


@router.get("/{comment_id}")
async def get_comment(
    comment_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Get a single comment by ID."""
    try:
        comment = await comments_service.get_comment(comment_id=comment_id)
        return comment
    except ValueError as e:
        logger.warning("get_comment not found: %s", e)
        raise HTTPException(status_code=404, detail="The requested resource was not found.")


@router.put("/{comment_id}")
async def update_comment(
    comment_id: str,
    request: UpdateCommentRequest,
    current_user = Depends(get_current_active_user),
    
):
    """
    Update a comment.
    
    Edit history is preserved.
    """
    try:
        result = await comments_service.update_comment(
            user_id=str(current_user.get("id")),
            comment_id=comment_id,
            content=sanitize_text(request.content, 10000)
        )
        return result
    except ValueError as e:
        logger.warning("update_comment validation error: %s", e)
        raise HTTPException(status_code=400, detail="Invalid request. Please check your input.")


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """
    Delete a comment (soft delete).
    
    Content is replaced with [deleted] but structure remains.
    """
    try:
        is_admin = current_user.get("role") == "admin"
        result = await comments_service.delete_comment(
            user_id=str(current_user.get("id")),
            comment_id=comment_id,
            is_admin=is_admin
        )
        return result
    except ValueError as e:
        logger.warning("delete_comment validation error: %s", e)
        raise HTTPException(status_code=400, detail="Invalid request. Please check your input.")


# ============== Reactions ==============

@router.post("/{comment_id}/reactions")
async def add_reaction(
    comment_id: str,
    request: ReactionRequest,
    current_user = Depends(get_current_active_user),
    
):
    """
    Add a reaction to a comment.
    
    Available reactions: thumbs_up, thumbs_down, heart, laugh, 
    surprised, sad, thinking, celebrate, fire, rocket
    """
    try:
        result = await comments_service.add_reaction(
            user_id=str(current_user.get("id")),
            comment_id=comment_id,
            reaction=request.reaction
        )
        return result
    except ValueError as e:
        logger.warning("add_reaction validation error: %s", e)
        raise HTTPException(status_code=400, detail="Invalid request. Please check your input.")


@router.delete("/{comment_id}/reactions/{reaction}")
async def remove_reaction(
    comment_id: str,
    reaction: str,
    current_user = Depends(get_current_active_user),
    
):
    """Remove a reaction from a comment."""
    try:
        result = await comments_service.remove_reaction(
            user_id=str(current_user.get("id")),
            comment_id=comment_id,
            reaction=reaction
        )
        return result
    except ValueError as e:
        logger.warning("remove_reaction not found: %s", e)
        raise HTTPException(status_code=404, detail="The requested resource was not found.")


# ============== Moderation ==============

@router.post("/{comment_id}/pin")
async def pin_comment(
    comment_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Pin a comment (admin only)."""
    try:
        is_admin = current_user.get("role") == "admin"
        result = await comments_service.pin_comment(
            user_id=str(current_user.get("id")),
            comment_id=comment_id,
            is_admin=is_admin
        )
        return result
    except ValueError as e:
        logger.warning("pin_comment access denied: %s", e)
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")


@router.delete("/{comment_id}/pin")
async def unpin_comment(
    comment_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Unpin a comment."""
    try:
        is_admin = current_user.get("role") == "admin"
        result = await comments_service.unpin_comment(
            user_id=str(current_user.get("id")),
            comment_id=comment_id,
            is_admin=is_admin
        )
        return result
    except ValueError as e:
        logger.warning("unpin_comment not found: %s", e)
        raise HTTPException(status_code=404, detail="The requested resource was not found.")


@router.post("/{comment_id}/resolve")
async def resolve_comment(
    comment_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Mark a comment thread as resolved."""
    try:
        result = await comments_service.resolve_comment(
            user_id=str(current_user.get("id")),
            comment_id=comment_id
        )
        return result
    except ValueError as e:
        logger.warning("resolve_comment not found: %s", e)
        raise HTTPException(status_code=404, detail="The requested resource was not found.")


# ============== History & Mentions ==============

@router.get("/{comment_id}/history")
async def get_edit_history(
    comment_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Get edit history for a comment."""
    try:
        result = await comments_service.get_edit_history(comment_id=comment_id)
        return result
    except ValueError as e:
        logger.warning("get_edit_history not found: %s", e)
        raise HTTPException(status_code=404, detail="The requested resource was not found.")


@router.get("/mentions/me")
async def get_my_mentions(
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_active_user),
    
):
    """Get comments where you are mentioned."""
    result = await comments_service.get_user_mentions(
        user_id=str(current_user.get("id")),
        limit=limit
    )
    return result


# ============== Statistics ==============

@router.get("/stats")
async def get_comment_stats(
    resource_type: str = Query(...),
    resource_id: str = Query(...),
    current_user = Depends(get_current_active_user),
    
):
    """Get comment statistics for a resource."""
    result = await comments_service.get_comment_stats(
        resource_type=resource_type,
        resource_id=resource_id
    )
    return result


# ============== Info ==============

@router.get("/info/reactions")
async def get_available_reactions(
    current_user = Depends(get_current_active_user),
    
):
    """Get available reaction types."""
    return {
        "reactions": comments_service.REACTIONS,
        "resource_types": comments_service.COMMENT_TYPES,
        "max_depth": comments_service.MAX_DEPTH
    }
