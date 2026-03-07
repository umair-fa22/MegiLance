# @AI-HINT: Rate Limiting Pro API endpoints
"""
Rate Limiting Pro API - Advanced rate limiting endpoints.

Features:
- Check rate limit status
- View tier limits
- Admin controls for blocking/unblocking
- Analytics and abuse reports
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.rate_limiting_pro import (
    get_rate_limit_service, 
    RateLimitTier,
    TIER_LIMITS
)

router = APIRouter()


# Request/Response schemas
class BlockRequest(BaseModel):
    """Block identifier request."""
    identifier: str
    duration_minutes: int = 60
    reason: str = "Manual block"


class BypassTokenRequest(BaseModel):
    """Create bypass token request."""
    valid_hours: int = 24


# API Endpoints
@router.get("/status")
async def get_rate_limit_status(
    request: Request,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Get current rate limit status for user."""
    service = get_rate_limit_service()
    
    # Determine tier based on user (simplified)
    tier = RateLimitTier.BASIC
    if hasattr(current_user, 'role') and current_user.role == 'admin':
        tier = RateLimitTier.ADMIN
    
    identifier = str(current_user.id)
    status = await service.get_rate_limit_status(identifier, tier)
    
    return status


@router.get("/tiers")
async def get_all_tiers(
    
):
    """Get all available rate limit tiers."""
    return {
        "tiers": [
            {
                "name": tier.value,
                "limits": TIER_LIMITS[tier]
            }
            for tier in RateLimitTier
        ]
    }


@router.get("/tiers/{tier}")
async def get_tier_limits(
    tier: str,
    
):
    """Get limits for a specific tier."""
    try:
        rate_tier = RateLimitTier(tier)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tier. Available: {[t.value for t in RateLimitTier]}"
        )
    
    service = get_rate_limit_service()
    
    return await service.get_tier_limits(rate_tier)


@router.post("/check")
async def check_rate_limit(
    request: Request,
    endpoint: str = "/api/v1/",
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Check rate limit for a specific endpoint."""
    service = get_rate_limit_service()
    
    tier = RateLimitTier.BASIC
    if hasattr(current_user, 'role') and current_user.role == 'admin':
        tier = RateLimitTier.ADMIN
    
    result = await service.check_rate_limit(
        identifier=str(current_user.id),
        endpoint=endpoint,
        tier=tier
    )
    
    return result


@router.post("/reset")
async def reset_rate_limits(
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Reset own rate limits (admin only)."""
    # Check admin
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    result = await service.reset_limits(str(current_user.id))
    
    return result


# Admin endpoints
@router.post("/admin/block")
async def block_identifier(
    request: BlockRequest,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Block an identifier (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    result = await service.block_identifier(
        identifier=request.identifier,
        duration_minutes=request.duration_minutes,
        reason=request.reason
    )
    
    return result


@router.post("/admin/unblock/{identifier}")
async def unblock_identifier(
    identifier: str,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Unblock an identifier (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    success = await service.unblock_identifier(identifier)
    
    if not success:
        raise HTTPException(status_code=404, detail="Identifier not found in block list")
    
    return {"identifier": identifier, "status": "unblocked"}


@router.get("/admin/blocked")
async def get_blocked_list(
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Get list of blocked identifiers (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    blocked = await service.get_blocked_list()
    
    return {"blocked": blocked, "count": len(blocked)}


@router.post("/admin/bypass-token")
async def create_bypass_token(
    request: BypassTokenRequest,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Create a rate limit bypass token (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    valid_until = datetime.now(timezone.utc) + timedelta(hours=request.valid_hours)
    token = await service.create_bypass_token(valid_until)
    
    return {
        "token": token,
        "valid_until": valid_until.isoformat(),
        "valid_hours": request.valid_hours
    }


@router.delete("/admin/bypass-token/{token}")
async def revoke_bypass_token(
    token: str,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Revoke a bypass token (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    success = await service.revoke_bypass_token(token)
    
    if not success:
        raise HTTPException(status_code=404, detail="Token not found")
    
    return {"status": "revoked"}


@router.get("/admin/analytics")
async def get_analytics(
    identifier: Optional[str] = None,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Get rate limit analytics (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    analytics = await service.get_analytics(identifier)
    
    return analytics


@router.get("/admin/abuse-report")
async def get_abuse_report(
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Get abuse detection report (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    report = await service.get_abuse_report()
    
    return report


@router.post("/admin/reset/{identifier}")
async def admin_reset_limits(
    identifier: str,
    ,
    current_user: User = Depends(get_current_active_user)
):
    """Reset rate limits for any identifier (admin only)."""
    if not hasattr(current_user, 'role') or current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = get_rate_limit_service()
    
    result = await service.reset_limits(identifier)
    
    return result
