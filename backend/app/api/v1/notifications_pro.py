# @AI-HINT: API endpoints for notification center - push, email, in-app notifications
"""
Notification Center API - Multi-channel notification management.

Endpoints for:
- Sending notifications
- Getting user notifications
- Marking as read
- Managing preferences
- Push subscription management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.security import get_current_active_user, require_admin
from app.models.user import User
from app.services.notification_center import (
    get_notification_service, 
    NotificationType, 
    NotificationChannel,
    NotificationPriority
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


# Request/Response Models
class SendNotificationRequest(BaseModel):
    user_id: int
    notification_type: str
    data: dict
    channels: Optional[List[str]] = None
    priority: str = "normal"


class NotificationPreferencesRequest(BaseModel):
    channels: Optional[dict] = None
    types: Optional[dict] = None
    quiet_hours: Optional[dict] = None
    email_digest: Optional[dict] = None


class PushSubscriptionRequest(BaseModel):
    subscription: dict
    device_info: Optional[dict] = None


class MarkReadRequest(BaseModel):
    notification_ids: Optional[List[str]] = None


# Endpoints
@router.get("")
async def get_notifications(
    unread_only: bool = False,
    notification_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get notifications for the current user."""
    service = get_notification_service()
    
    type_enum = None
    if notification_type:
        try:
            type_enum = NotificationType(notification_type)
        except ValueError:
            pass
    
    result = await service.get_user_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        notification_type=type_enum,
        limit=limit,
        offset=offset
    )
    
    return result


@router.post("/mark-read")
async def mark_notifications_read(
    request: MarkReadRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Mark notifications as read."""
    service = get_notification_service()
    
    result = await service.mark_as_read(
        user_id=current_user.id,
        notification_ids=request.notification_ids
    )
    
    return result


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Delete a notification."""
    service = get_notification_service()
    
    success = await service.delete_notification(
        user_id=current_user.id,
        notification_id=notification_id
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"status": "deleted"}


@router.get("/preferences")
async def get_preferences(
    current_user: User = Depends(get_current_active_user),
    
):
    """Get notification preferences."""
    service = get_notification_service()
    
    preferences = await service.get_user_preferences(current_user.id)
    
    return preferences


@router.put("/preferences")
async def update_preferences(
    request: NotificationPreferencesRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Update notification preferences."""
    service = get_notification_service()
    
    preferences = await service.update_user_preferences(
        user_id=current_user.id,
        preferences=request.model_dump(exclude_none=True)
    )
    
    return preferences


@router.post("/push/subscribe")
async def subscribe_push(
    request: PushSubscriptionRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Subscribe to push notifications."""
    service = get_notification_service()
    
    result = await service.register_push_subscription(
        user_id=current_user.id,
        subscription=request.subscription,
        device_info=request.device_info
    )
    
    return result


@router.delete("/push/{subscription_id}")
async def unsubscribe_push(
    subscription_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Unsubscribe from push notifications."""
    service = get_notification_service()
    
    await service.unregister_push_subscription(
        user_id=current_user.id,
        subscription_id=subscription_id
    )
    
    return {"status": "unsubscribed"}


# Admin endpoint
@router.post("/send")
async def send_notification(
    request: SendNotificationRequest,
    current_user: User = Depends(get_current_active_user),
    _admin = Depends(require_admin),
    
):
    """Send a notification (admin only)."""
    
    service = get_notification_service()
    
    try:
        notification_type = NotificationType(request.notification_type)
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid notification type: {request.notification_type}"
        )
    
    channels = None
    if request.channels:
        channels = [NotificationChannel(c) for c in request.channels]
    
    try:
        priority = NotificationPriority(request.priority)
    except ValueError:
        priority = NotificationPriority.NORMAL
    
    result = await service.send_notification(
        user_id=request.user_id,
        notification_type=notification_type,
        data=request.data,
        channels=channels,
        priority=priority
    )
    
    return result
