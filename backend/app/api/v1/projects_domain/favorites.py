# @AI-HINT: Favorites API endpoints - delegates to favorites_service
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Literal, Optional

from app.core.security import get_current_user_from_token
from app.services import favorites_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    favorite: dict,
    current_user = Depends(get_current_user)
):
    """
    Add item to favorites
    - Users can favorite projects or freelancers
    - Prevents duplicate favorites
    """
    user_id = current_user.get("user_id")
    target_type = favorite.get("target_type")
    target_id = favorite.get("target_id")

    if favorites_service.check_favorite_exists(user_id, target_type, target_id):
        raise HTTPException(status_code=400, detail="Already in favorites")

    if target_type == "project":
        if not favorites_service.verify_target_exists("project", target_id):
            raise HTTPException(status_code=404, detail="Project not found")
    elif target_type == "freelancer":
        if not favorites_service.verify_target_exists("freelancer", target_id):
            raise HTTPException(status_code=404, detail="Freelancer not found")

    try:
        return favorites_service.create_favorite(user_id, target_type, target_id)
    except RuntimeError:
        raise HTTPException(status_code=500, detail="Failed to create favorite")


@router.get("/", response_model=List[dict])
async def list_favorites(
    target_type: Optional[Literal["project", "freelancer"]] = Query(None, description="Filter by type"),
    current_user = Depends(get_current_user)
):
    """
    List user's favorites
    - Returns user's bookmarked items
    - Can filter by type (project/freelancer)
    """
    user_id = current_user.get("user_id")
    return favorites_service.list_favorites(user_id, target_type)


@router.delete("/{favorite_id}", response_model=dict)
async def delete_favorite(
    favorite_id: int,
    current_user = Depends(get_current_user)
):
    """Remove item from favorites"""
    user_id = current_user.get("user_id")

    favorite = favorites_service.get_favorite_by_id(favorite_id)
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    if favorite.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    target_type = favorite.get("target_type")
    target_id = favorite.get("target_id")

    favorites_service.delete_favorite_by_id(favorite_id)

    return {
        "message": "Removed from favorites",
        "target_type": target_type,
        "target_id": target_id
    }


@router.delete("/remove/{target_type}/{target_id}", response_model=dict)
async def remove_favorite_by_target(
    target_type: Literal["project", "freelancer"],
    target_id: int,
    current_user = Depends(get_current_user)
):
    """Remove item from favorites by type and ID"""
    user_id = current_user.get("user_id")

    if not favorites_service.find_favorite_by_target(user_id, target_type, target_id):
        raise HTTPException(status_code=404, detail="Not in favorites")

    favorites_service.delete_favorite_by_target(user_id, target_type, target_id)

    return {
        "message": "Removed from favorites",
        "target_type": target_type,
        "target_id": target_id
    }


@router.get("/check/{target_type}/{target_id}")
async def check_favorite(
    target_type: Literal["project", "freelancer"],
    target_id: int,
    current_user = Depends(get_current_user)
):
    """Check if item is favorited"""
    user_id = current_user.get("user_id")
    return favorites_service.check_is_favorited(user_id, target_type, target_id)
