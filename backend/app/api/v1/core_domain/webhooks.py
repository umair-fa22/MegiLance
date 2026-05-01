# @AI-HINT: Webhook API endpoints for third-party integrations
"""
Webhook API - Webhook management endpoints.

Features:
- Register/manage webhooks
- View delivery logs
- Test webhooks
- Rotate secrets
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.webhooks import get_webhook_service, WebhookEvent

router = APIRouter()


# Request/Response schemas
class WebhookCreateRequest(BaseModel):
    """Create webhook request."""
    url: str
    events: List[str]
    description: Optional[str] = None


class WebhookUpdateRequest(BaseModel):
    """Update webhook request."""
    url: Optional[str] = None
    events: Optional[List[str]] = None
    active: Optional[bool] = None
    description: Optional[str] = None


# API Endpoints
@router.get("/events")
async def get_available_events(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available webhook events."""
    service = get_webhook_service()
    
    events = service.get_available_events()
    
    # Group by category
    categories = {}
    for event in events:
        cat = event["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(event)
    
    return {
        "events": events,
        "categories": categories,
        "total": len(events)
    }


@router.post("")
async def create_webhook(
    request: WebhookCreateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Register a new webhook."""
    service = get_webhook_service()
    
    # Validate events
    try:
        events = [WebhookEvent(e) for e in request.events]
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail="Internal server error"
        )
    
    if not events:
        raise HTTPException(
            status_code=400,
            detail="At least one event is required"
        )
    
    webhook = await service.register_webhook(
        user_id=current_user.id,
        url=request.url,
        events=events,
        description=request.description
    )
    
    return webhook


@router.get("")
async def list_webhooks(
    current_user: User = Depends(get_current_active_user)
):
    """List user's webhooks."""
    service = get_webhook_service()
    
    webhooks = await service.list_webhooks(current_user.id)
    
    return {
        "webhooks": webhooks,
        "count": len(webhooks)
    }


@router.get("/{webhook_id}")
async def get_webhook(
    webhook_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get webhook details."""
    service = get_webhook_service()
    
    webhook = await service.get_webhook(webhook_id, current_user.id)
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    return webhook


@router.patch("/{webhook_id}")
async def update_webhook(
    webhook_id: str,
    request: WebhookUpdateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update webhook configuration."""
    service = get_webhook_service()
    
    # Validate events if provided
    events = None
    if request.events:
        try:
            events = [WebhookEvent(e) for e in request.events]
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail="Internal server error"
            )
    
    webhook = await service.update_webhook(
        webhook_id=webhook_id,
        user_id=current_user.id,
        url=request.url,
        events=events,
        active=request.active,
        description=request.description
    )
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    return webhook


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a webhook."""
    service = get_webhook_service()
    
    success = await service.delete_webhook(webhook_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    return {"status": "deleted", "webhook_id": webhook_id}


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Send a test event to webhook."""
    service = get_webhook_service()
    
    result = await service.test_webhook(webhook_id, current_user.id)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.post("/{webhook_id}/rotate-secret")
async def rotate_webhook_secret(
    webhook_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Rotate webhook secret."""
    service = get_webhook_service()
    
    result = await service.rotate_secret(webhook_id, current_user.id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    return result


@router.get("/{webhook_id}/deliveries")
async def get_delivery_logs(
    webhook_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
):
    """Get delivery logs for a webhook."""
    service = get_webhook_service()
    
    logs = await service.get_delivery_logs(
        webhook_id=webhook_id,
        user_id=current_user.id,
        limit=limit
    )
    
    return {
        "webhook_id": webhook_id,
        "deliveries": logs,
        "count": len(logs)
    }


@router.post("/{webhook_id}/deliveries/{delivery_id}/retry")
async def retry_delivery(
    webhook_id: str,
    delivery_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Retry a failed delivery."""
    service = get_webhook_service()
    
    result = await service.retry_delivery(delivery_id, current_user.id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    return result
