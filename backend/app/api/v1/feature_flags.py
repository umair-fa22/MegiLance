# @AI-HINT: Feature flags API for A/B testing and gradual feature rollouts
"""
Feature Flags API - Endpoints for feature flag management.

Features:
- Get flag status for current user
- Admin flag management
- A/B testing variant assignment
- Experiment analytics
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone

from app.db.session import get_db
from app.core.security import get_current_active_user, require_admin
from app.models.user import User
from app.core.feature_flags import (
    get_feature_flags,
    FeatureFlags,
    FeatureFlag,
    RolloutType
)

router = APIRouter(prefix="/feature-flags", tags=["feature-flags"])


# Request/Response Models
class FlagCheckRequest(BaseModel):
    """Request to check multiple flags."""
    flag_names: List[str]
    context: Optional[Dict[str, Any]] = None


class FlagCheckResponse(BaseModel):
    """Response for flag check."""
    flag_name: str
    is_enabled: bool
    variant: str


class CreateFlagRequest(BaseModel):
    """Request to create a new flag."""
    name: str
    description: Optional[str] = None
    rollout_percentage: int = 0
    rollout_type: str = "percentage"
    variants: List[str] = []
    default_variant: str = "control"


class UpdateFlagRequest(BaseModel):
    """Request to update a flag."""
    description: Optional[str] = None
    is_active: Optional[bool] = None
    rollout_percentage: Optional[int] = None
    rollout_type: Optional[str] = None
    variants: Optional[List[str]] = None
    default_variant: Optional[str] = None
    allowed_user_ids: Optional[List[int]] = None


class TrackExposureRequest(BaseModel):
    """Request to track flag exposure."""
    flag_name: str
    variant: str
    context: Optional[Dict[str, Any]] = None


# User Endpoints
@router.get("/flags")
async def get_all_flags(
    current_user=Depends(get_current_active_user)
):
    """Get all available feature flags with their status for the current user."""
    flags = get_feature_flags()
    all_flags = await flags.get_all_flags()
    user_flags = []
    for name, flag in all_flags.items():
        is_enabled = await flags.is_enabled(name, user_id=current_user.id)
        user_flags.append({
            "name": name,
            "description": getattr(flag, 'description', ''),
            "is_enabled": is_enabled,
        })
    return {"flags": user_flags}


@router.get("/check/{flag_name}")
async def check_flag(
    flag_name: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """Check if a feature flag is enabled for the current user."""
    flags = get_feature_flags()
    
    is_enabled = await flags.is_enabled(flag_name, user_id=current_user.id)
    variant = await flags.get_variant(flag_name, user_id=current_user.id)
    
    # Track exposure for analytics
    if is_enabled:
        await flags.track_exposure(flag_name, current_user.id, variant)
    
    return {
        "flag_name": flag_name,
        "is_enabled": is_enabled,
        "variant": variant,
        "user_id": current_user.id
    }


@router.post("/check-multiple")
async def check_multiple_flags(
    request: FlagCheckRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """Check multiple feature flags at once."""
    flags = get_feature_flags()
    results = []
    
    for flag_name in request.flag_names:
        is_enabled = await flags.is_enabled(
            flag_name,
            user_id=current_user.id,
            user_attributes=request.context
        )
        variant = await flags.get_variant(flag_name, user_id=current_user.id)
        
        results.append({
            "flag_name": flag_name,
            "is_enabled": is_enabled,
            "variant": variant
        })
    
    return {"flags": results}


@router.get("/my-flags")
async def get_my_flags(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """Get all feature flags and their status for the current user."""
    flags = get_feature_flags()
    all_flags = await flags.get_all_flags()
    
    user_flags = []
    for name, flag in all_flags.items():
        is_enabled = await flags.is_enabled(name, user_id=current_user.id)
        variant = await flags.get_variant(name, user_id=current_user.id)
        
        user_flags.append({
            "flag_name": name,
            "description": flag.description,
            "is_enabled": is_enabled,
            "variant": variant
        })
    
    return {"flags": user_flags}


@router.post("/track-exposure")
async def track_exposure(
    request: TrackExposureRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    """Track when a user is exposed to a feature variant (for analytics)."""
    flags = get_feature_flags()
    
    await flags.track_exposure(
        request.flag_name,
        current_user.id,
        request.variant,
        request.context
    )
    
    return {"success": True, "tracked_at": datetime.now(timezone.utc).isoformat()}


# Admin Endpoints
@router.get("/admin/all")
async def admin_get_all_flags(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all feature flags (admin only)."""
    
    flags = get_feature_flags()
    all_flags = await flags.get_all_flags()
    
    return {
        "flags": [
            {
                "name": name,
                "description": flag.description,
                "is_active": flag.is_active,
                "rollout_percentage": flag.rollout_percentage,
                "rollout_type": flag.rollout_type.value,
                "variants": flag.variants,
                "default_variant": flag.default_variant,
                "allowed_user_ids": flag.allowed_user_ids,
                "created_at": flag.created_at.isoformat(),
                "updated_at": flag.updated_at.isoformat()
            }
            for name, flag in all_flags.items()
        ],
        "total": len(all_flags)
    }


@router.get("/admin/{flag_name}")
async def admin_get_flag(
    flag_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get a specific flag details (admin only)."""
    
    flags = get_feature_flags()
    flag = await flags.get_flag(flag_name)
    
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    return {
        "name": flag.name,
        "description": flag.description,
        "is_active": flag.is_active,
        "rollout_percentage": flag.rollout_percentage,
        "rollout_type": flag.rollout_type.value,
        "variants": flag.variants,
        "default_variant": flag.default_variant,
        "allowed_user_ids": flag.allowed_user_ids,
        "required_attributes": flag.required_attributes,
        "created_at": flag.created_at.isoformat(),
        "updated_at": flag.updated_at.isoformat()
    }


@router.post("/admin/create")
async def admin_create_flag(
    request: CreateFlagRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new feature flag (admin only)."""
    
    flags = get_feature_flags()
    existing = await flags.get_flag(request.name)
    
    if existing:
        raise HTTPException(status_code=400, detail="Flag already exists")
    
    try:
        rollout_type = RolloutType(request.rollout_type)
    except ValueError:
        rollout_type = RolloutType.PERCENTAGE
    
    new_flag = FeatureFlag(
        name=request.name,
        description=request.description,
        rollout_percentage=request.rollout_percentage,
        rollout_type=rollout_type,
        variants=request.variants or [],
        default_variant=request.default_variant
    )
    
    flags._flags[request.name] = new_flag
    
    return {
        "success": True,
        "flag": {
            "name": new_flag.name,
            "description": new_flag.description,
            "rollout_percentage": new_flag.rollout_percentage
        }
    }


@router.put("/admin/{flag_name}")
async def admin_update_flag(
    flag_name: str,
    request: UpdateFlagRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a feature flag (admin only)."""
    
    flags = get_feature_flags()
    flag = await flags.get_flag(flag_name)
    
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    # Update fields
    if request.description is not None:
        flag.description = request.description
    if request.is_active is not None:
        flag.is_active = request.is_active
    if request.rollout_percentage is not None:
        flag.rollout_percentage = max(0, min(100, request.rollout_percentage))
    if request.rollout_type is not None:
        try:
            flag.rollout_type = RolloutType(request.rollout_type)
        except ValueError:
            pass
    if request.variants is not None:
        flag.variants = request.variants
    if request.default_variant is not None:
        flag.default_variant = request.default_variant
    if request.allowed_user_ids is not None:
        flag.allowed_user_ids = request.allowed_user_ids
    
    flag.updated_at = datetime.now(timezone.utc)
    flags._flags[flag_name] = flag
    
    return {
        "success": True,
        "flag": {
            "name": flag.name,
            "is_active": flag.is_active,
            "rollout_percentage": flag.rollout_percentage,
            "updated_at": flag.updated_at.isoformat()
        }
    }


@router.delete("/admin/{flag_name}")
async def admin_delete_flag(
    flag_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a feature flag (admin only)."""
    
    flags = get_feature_flags()
    flag = await flags.get_flag(flag_name)
    
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    del flags._flags[flag_name]
    
    return {"success": True, "deleted": flag_name}


@router.post("/admin/{flag_name}/rollout")
async def admin_update_rollout(
    flag_name: str,
    percentage: int = Query(..., ge=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Quick update of rollout percentage (admin only)."""
    
    flags = get_feature_flags()
    flag = await flags.get_flag(flag_name)
    
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    flag.rollout_percentage = percentage
    flag.updated_at = datetime.now(timezone.utc)
    flags._flags[flag_name] = flag
    
    return {
        "success": True,
        "flag_name": flag_name,
        "new_rollout_percentage": percentage
    }


@router.get("/admin/{flag_name}/analytics")
async def admin_get_flag_analytics(
    flag_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get analytics for a specific flag (admin only)."""
    
    flags = get_feature_flags()
    analytics = await flags.get_analytics(flag_name)
    
    # Aggregate by variant
    variant_counts: Dict[str, int] = {}
    unique_users: set = set()
    
    for entry in analytics:
        variant = entry.get("variant", "unknown")
        variant_counts[variant] = variant_counts.get(variant, 0) + 1
        unique_users.add(entry.get("user_id"))
    
    return {
        "flag_name": flag_name,
        "total_exposures": len(analytics),
        "unique_users": len(unique_users),
        "variant_distribution": variant_counts,
        "recent_exposures": analytics[-10:]  # Last 10 exposures
    }


@router.get("/admin/analytics/summary")
async def admin_get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get analytics summary for all flags (admin only)."""
    
    flags = get_feature_flags()
    all_analytics = await flags.get_analytics()
    all_flags = await flags.get_all_flags()
    
    # Aggregate stats
    flag_stats = {}
    for entry in all_analytics:
        flag_name = entry.get("flag_name")
        if flag_name not in flag_stats:
            flag_stats[flag_name] = {"exposures": 0, "users": set()}
        flag_stats[flag_name]["exposures"] += 1
        flag_stats[flag_name]["users"].add(entry.get("user_id"))
    
    summary = []
    for name, flag in all_flags.items():
        stats = flag_stats.get(name, {"exposures": 0, "users": set()})
        summary.append({
            "name": name,
            "is_active": flag.is_active,
            "rollout_percentage": flag.rollout_percentage,
            "total_exposures": stats["exposures"],
            "unique_users": len(stats["users"])
        })
    
    return {
        "total_flags": len(all_flags),
        "active_flags": sum(1 for f in all_flags.values() if f.is_active),
        "total_exposures": len(all_analytics),
        "flags": summary
    }
