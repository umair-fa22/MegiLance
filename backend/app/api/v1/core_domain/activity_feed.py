# @AI-HINT: Activity feed API - user timeline and social features
"""
Activity Feed API - User Timeline & Social Endpoints

Provides:
- User activity timeline
- Social feed (following activities)
- Follow/unfollow users
- Like and comment on activities
- Privacy settings
- Trending activities
"""

from typing import Dict, Any, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.services.activity_feed import activity_feed_service
from app.services.db_utils import sanitize_text


router = APIRouter()


# ============== Pydantic Models ==============

class CreateActivityRequest(BaseModel):
    """Request to create an activity."""
    activity_type: str = Field(..., max_length=100, description="Type of activity")
    data: Dict[str, Any] = Field(..., description="Activity-specific data")
    privacy: Literal["public", "followers", "private"] = Field(default="public", description="public, followers, private")
    target_user_id: Optional[str] = None


class CommentRequest(BaseModel):
    """Request to add a comment."""
    comment: str = Field(..., min_length=1, max_length=1000)


class PrivacySettingsRequest(BaseModel):
    """Request to update privacy settings."""
    default_privacy: str = Field(default="public", description="public, followers, private")
    project_activities: Optional[str] = None
    payment_activities: Optional[str] = None
    profile_activities: Optional[str] = None
    social_activities: Optional[str] = None


# ============== Feed Endpoints ==============

@router.get("/feed")
async def get_my_feed(
    include_own: bool = Query(True, description="Include own activities"),
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_active_user),
    
):
    """
    Get personalized activity feed.
    
    Shows activities from users you follow plus your own (optional).
    Activities are aggregated and sorted by recency.
    """
    result = await activity_feed_service.get_feed(
        user_id=str(current_user.get("id")),
        include_own=include_own,
        limit=limit
    )
    return result


@router.get("/activities")
async def get_my_activities(
    activity_types: Optional[str] = Query(None, description="Comma-separated types"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_active_user),
    
):
    """Get current user's own activities."""
    types_list = activity_types.split(",") if activity_types else None
    
    result = await activity_feed_service.get_user_activities(
        user_id=str(current_user.get("id")),
        viewer_id=str(current_user.get("id")),
        activity_types=types_list,
        limit=limit,
        offset=offset
    )
    return result


@router.get("/users/{user_id}/activities")
async def get_user_activities(
    user_id: str,
    activity_types: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_active_user),
    
):
    """
    Get another user's activities.
    
    Respects privacy settings - only shows public activities
    or follower-visible activities if following.
    """
    types_list = activity_types.split(",") if activity_types else None
    
    result = await activity_feed_service.get_user_activities(
        user_id=user_id,
        viewer_id=str(current_user.get("id")),
        activity_types=types_list,
        limit=limit,
        offset=offset
    )
    return result


@router.post("/activities")
async def create_activity(
    request: CreateActivityRequest,
    current_user = Depends(get_current_active_user),
    
):
    """
    Create a new activity.
    
    Activity types include:
    - project_created, project_completed, project_milestone
    - proposal_submitted, proposal_accepted, proposal_won
    - review_received, review_given
    - badge_earned, level_up, milestone_achieved
    - skill_added, portfolio_updated, profile_verified
    """
    try:
        result = await activity_feed_service.create_activity(
            user_id=str(current_user.get("id")),
            activity_type=request.activity_type,
            data=request.data,
            privacy=request.privacy,
            target_user_id=request.target_user_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/activities/{activity_id}")
async def delete_activity(
    activity_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Delete own activity."""
    try:
        result = await activity_feed_service.delete_activity(
            user_id=str(current_user.get("id")),
            activity_id=activity_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== Social Endpoints ==============

@router.post("/follow/{user_id}")
async def follow_user(
    user_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Follow a user to see their activities in your feed."""
    try:
        result = await activity_feed_service.follow_user(
            follower_id=str(current_user.get("id")),
            target_id=user_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/follow/{user_id}")
async def unfollow_user(
    user_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Unfollow a user."""
    result = await activity_feed_service.unfollow_user(
        follower_id=str(current_user.get("id")),
        target_id=user_id
    )
    return result


@router.get("/followers")
async def get_my_followers(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_active_user),
    
):
    """Get list of users following you."""
    result = await activity_feed_service.get_followers(
        user_id=str(current_user.get("id")),
        limit=limit,
        offset=offset
    )
    return result


@router.get("/following")
async def get_my_following(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_active_user),
    
):
    """Get list of users you're following."""
    result = await activity_feed_service.get_following(
        user_id=str(current_user.get("id")),
        limit=limit,
        offset=offset
    )
    return result


@router.get("/users/{user_id}/followers")
async def get_user_followers(
    user_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_active_user),
    
):
    """Get followers of a specific user."""
    result = await activity_feed_service.get_followers(
        user_id=user_id,
        limit=limit,
        offset=offset
    )
    return result


@router.get("/users/{user_id}/following")
async def get_user_following(
    user_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_active_user),
    
):
    """Get users that a specific user follows."""
    result = await activity_feed_service.get_following(
        user_id=user_id,
        limit=limit,
        offset=offset
    )
    return result


# ============== Engagement Endpoints ==============

@router.post("/activities/{activity_id}/like")
async def like_activity(
    activity_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Like an activity."""
    try:
        result = await activity_feed_service.like_activity(
            user_id=str(current_user.get("id")),
            activity_id=activity_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/activities/{activity_id}/like")
async def unlike_activity(
    activity_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Unlike an activity."""
    try:
        result = await activity_feed_service.unlike_activity(
            user_id=str(current_user.get("id")),
            activity_id=activity_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/activities/{activity_id}/comments")
async def comment_on_activity(
    activity_id: str,
    request: CommentRequest,
    current_user = Depends(get_current_active_user),
    
):
    """Add a comment to an activity."""
    try:
        result = await activity_feed_service.comment_on_activity(
            user_id=str(current_user.get("id")),
            activity_id=activity_id,
            comment=sanitize_text(request.comment, 1000)
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== Privacy Endpoints ==============

@router.get("/privacy")
async def get_privacy_settings(
    current_user = Depends(get_current_active_user),
    
):
    """Get current privacy settings."""
    result = await activity_feed_service.get_privacy_settings(
        user_id=str(current_user.get("id"))
    )
    return result


@router.put("/privacy")
async def update_privacy_settings(
    request: PrivacySettingsRequest,
    current_user = Depends(get_current_active_user),
    
):
    """
    Update activity privacy settings.
    
    Set default visibility and per-category overrides:
    - **public**: Anyone can see
    - **followers**: Only followers can see
    - **private**: Only you can see
    """
    try:
        settings = request.dict(exclude_unset=True)
        result = await activity_feed_service.update_privacy_settings(
            user_id=str(current_user.get("id")),
            settings=settings
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============== Analytics Endpoints ==============

@router.get("/stats")
async def get_activity_stats(
    current_user = Depends(get_current_active_user),
    
):
    """Get activity statistics for current user."""
    result = await activity_feed_service.get_activity_stats(
        user_id=str(current_user.get("id"))
    )
    return result


@router.get("/users/{user_id}/stats")
async def get_user_activity_stats(
    user_id: str,
    current_user = Depends(get_current_active_user),
    
):
    """Get activity statistics for a specific user."""
    result = await activity_feed_service.get_activity_stats(
        user_id=user_id
    )
    return result


@router.get("/trending")
async def get_trending_activities(
    hours: int = Query(24, ge=1, le=168, description="Time range in hours"),
    limit: int = Query(20, ge=1, le=50),
    current_user = Depends(get_current_active_user),
    
):
    """
    Get trending activities across the platform.
    
    Ranked by engagement (likes and comments).
    """
    result = await activity_feed_service.get_trending_activities(
        time_range_hours=hours,
        limit=limit
    )
    return result


# ============== Activity Types ==============

@router.get("/types")
async def get_activity_types(
    current_user = Depends(get_current_active_user),
    
):
    """Get all available activity types."""
    return {
        "activity_types": activity_feed_service.ACTIVITY_TYPES,
        "privacy_levels": activity_feed_service.PRIVACY_LEVELS
    }
