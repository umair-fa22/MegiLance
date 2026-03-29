# @AI-HINT: Subscription and billing API endpoints for premium plans and features
"""
Subscription & Billing API

Endpoints for managing subscriptions, billing, payments,
and feature access control.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from pydantic import BaseModel

from app.core.security import get_current_active_user, require_admin
from app.services.db_utils import sanitize_text
from app.services.subscription_billing import (
    get_subscription_billing_service,
    PlanTier,
    BillingCycle,
    SubscriptionStatus
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


# Request/Response Models
class CreateSubscriptionRequest(BaseModel):
    tier: PlanTier
    billing_cycle: BillingCycle
    payment_method_id: Optional[str] = None
    trial_days: int = 0


class UpgradeRequest(BaseModel):
    new_tier: PlanTier
    prorate: bool = True


class DowngradeRequest(BaseModel):
    new_tier: PlanTier
    effective_at_period_end: bool = True


class CancelRequest(BaseModel):
    reason: Optional[str] = None
    immediate: bool = False


class TrackUsageRequest(BaseModel):
    usage_type: str
    amount: int = 1


# Plan Endpoints
@router.get("/plans")
async def get_available_plans():
    """Get all available subscription plans."""
    service = get_subscription_billing_service()
    plans = await service.get_available_plans()
    return {"plans": plans}


@router.get("/plans/{tier}")
async def get_plan_details(
    tier: PlanTier
):
    """Get detailed information about a specific plan."""
    service = get_subscription_billing_service()
    plan = await service.get_plan_details(tier)
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"plan": plan}


@router.get("/plans/compare")
async def compare_plans(
    tier1: PlanTier = Query(..., description="First plan to compare"),
    tier2: PlanTier = Query(..., description="Second plan to compare")
):
    """Compare two subscription plans."""
    service = get_subscription_billing_service()
    comparison = await service.compare_plans(tier1, tier2)
    return comparison


# Subscription Management Endpoints
@router.get("/my-subscription")
async def get_my_subscription(
    current_user = Depends(get_current_active_user)
):
    """Get current user's subscription."""
    service = get_subscription_billing_service()
    subscription = await service.get_user_subscription(current_user["id"])
    return {"subscription": subscription}


@router.post("/subscribe")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new subscription."""
    service = get_subscription_billing_service()
    result = await service.create_subscription(
        current_user["id"],
        request.tier,
        request.billing_cycle,
        request.payment_method_id,
        request.trial_days
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {"subscription": result}


@router.post("/upgrade")
async def upgrade_subscription(
    request: UpgradeRequest,
    current_user = Depends(get_current_active_user)
):
    """Upgrade to a higher tier plan."""
    service = get_subscription_billing_service()
    result = await service.upgrade_subscription(
        current_user["id"],
        request.new_tier,
        request.prorate
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/downgrade")
async def downgrade_subscription(
    request: DowngradeRequest,
    current_user = Depends(get_current_active_user)
):
    """Downgrade to a lower tier plan."""
    service = get_subscription_billing_service()
    result = await service.downgrade_subscription(
        current_user["id"],
        request.new_tier,
        request.effective_at_period_end
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/cancel")
async def cancel_subscription(
    request: CancelRequest,
    current_user = Depends(get_current_active_user)
):
    """Cancel subscription."""
    service = get_subscription_billing_service()
    result = await service.cancel_subscription(
        current_user["id"],
        sanitize_text(request.reason, 1000) if request.reason else None,
        request.immediate
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/reactivate")
async def reactivate_subscription(
    current_user = Depends(get_current_active_user)
):
    """Reactivate a cancelled subscription."""
    service = get_subscription_billing_service()
    result = await service.reactivate_subscription(current_user["id"])
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


# Feature Access Endpoints
@router.get("/features/{feature}/access")
async def check_feature_access(
    feature: str,
    current_user = Depends(get_current_active_user)
):
    """Check if user has access to a specific feature."""
    service = get_subscription_billing_service()
    result = await service.check_feature_access(current_user["id"], feature)
    return result


@router.get("/features/limits")
async def get_feature_limits(
    current_user = Depends(get_current_active_user)
):
    """Get all feature limits for user's subscription."""
    service = get_subscription_billing_service()
    limits = await service.get_feature_limits(current_user["id"])
    return limits


# Billing Endpoints
@router.get("/billing/history")
async def get_billing_history(
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_active_user)
):
    """Get billing/invoice history."""
    service = get_subscription_billing_service()
    history = await service.get_billing_history(current_user["id"], limit)
    return history


@router.get("/billing/upcoming")
async def get_upcoming_invoice(
    current_user = Depends(get_current_active_user)
):
    """Preview the next invoice."""
    service = get_subscription_billing_service()
    invoice = await service.get_upcoming_invoice(current_user["id"])
    return {"invoice": invoice}


# Usage Tracking Endpoints
@router.post("/usage/track")
async def track_usage(
    request: TrackUsageRequest,
    current_user = Depends(get_current_active_user)
):
    """Track feature usage against limits."""
    service = get_subscription_billing_service()
    result = await service.track_usage(
        current_user["id"],
        request.usage_type,
        request.amount
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/usage/summary")
async def get_usage_summary(
    current_user = Depends(get_current_active_user)
):
    """Get usage summary for current billing period."""
    service = get_subscription_billing_service()
    summary = await service.get_usage_summary(current_user["id"])
    return summary


# Admin Endpoints
@router.get("/admin/subscriptions")
async def admin_get_all_subscriptions(
    status_filter: Optional[SubscriptionStatus] = None,
    tier_filter: Optional[PlanTier] = None,
    limit: int = Query(50, le=200),
    current_user = Depends(require_admin)
):
    """Admin: Get all subscriptions with filters."""
    service = get_subscription_billing_service()
    return await service.get_all_subscriptions(
        status_filter=status_filter.value if status_filter else None,
        tier_filter=tier_filter.value if tier_filter else None,
        limit=limit
    )


@router.get("/admin/revenue")
async def admin_get_revenue_stats(
    period_days: int = Query(30, ge=1, le=365),
    current_user = Depends(require_admin)
):
    """Admin: Get revenue statistics."""
    service = get_subscription_billing_service()
    return await service.get_revenue_stats(period_days)


@router.put("/admin/subscriptions/{user_id}")
async def admin_update_subscription(
    user_id: int,
    tier: PlanTier,
    current_user = Depends(require_admin)
):
    """Admin: Manually update a user's subscription."""
    service = get_subscription_billing_service()
    result = await service.create_subscription(
        user_id,
        tier,
        BillingCycle.MONTHLY
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {"message": f"Subscription updated for user {user_id}", "subscription": result}
