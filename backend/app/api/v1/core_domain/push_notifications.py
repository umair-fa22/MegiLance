# @AI-HINT: Mobile push notification API endpoints
"""
Push Notifications API - Mobile push notification management.

Features:
- Device registration
- Send notifications
- Notification templates
- Topic subscriptions
- Analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user, require_admin
from app.services.db_utils import sanitize_text
from app.services.push_notifications import (
    get_push_notification_service, 
    DevicePlatform, 
    NotificationPriority
)

router = APIRouter(prefix="/push-notifications", tags=["push-notifications"])


# Request/Response Models
class RegisterDeviceRequest(BaseModel):
    device_token: str
    platform: DevicePlatform
    device_info: Optional[Dict[str, Any]] = None


class UpdateTokenRequest(BaseModel):
    old_token: str
    new_token: str


class SendNotificationRequest(BaseModel):
    title: str = Field(..., max_length=200)
    body: str = Field(..., max_length=2000)
    data: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    priority: NotificationPriority = NotificationPriority.HIGH
    badge_count: Optional[int] = None
    sound: str = "default"


class SendToDeviceRequest(BaseModel):
    device_token: str
    platform: DevicePlatform
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None


class SendBatchRequest(BaseModel):
    user_ids: List[int]
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None


class SilentPushRequest(BaseModel):
    data: Dict[str, Any]


class SendFromTemplateRequest(BaseModel):
    template_id: str
    variables: Dict[str, Any]


class TopicSubscriptionRequest(BaseModel):
    device_token: str
    topic: str


class SendToTopicRequest(BaseModel):
    topic: str
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None


# Endpoints
@router.post("/devices")
async def register_device(
    request: RegisterDeviceRequest,
    current_user = Depends(get_current_active_user)
):
    """Register a device for push notifications."""
    service = get_push_notification_service()
    
    device = await service.register_device(
        user_id=current_user["id"],
        device_token=request.device_token,
        platform=request.platform,
        device_info=request.device_info
    )
    
    return {"device": device, "message": "Device registered successfully"}


@router.delete("/devices/{device_token}")
async def unregister_device(
    device_token: str,
    current_user = Depends(get_current_active_user)
):
    """Unregister a device from push notifications."""
    service = get_push_notification_service()
    
    success = await service.unregister_device(
        user_id=current_user["id"],
        device_token=device_token
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return {"message": "Device unregistered successfully"}


@router.get("/devices")
async def get_user_devices(
    current_user = Depends(get_current_active_user)
):
    """Get all registered devices for the current user."""
    service = get_push_notification_service()
    devices = await service.get_user_devices(current_user["id"])
    return {"devices": devices}


@router.put("/devices/token")
async def update_device_token(
    request: UpdateTokenRequest,
    current_user = Depends(get_current_active_user)
):
    """Update a device token (token refresh)."""
    service = get_push_notification_service()
    
    success = await service.update_device_token(
        user_id=current_user["id"],
        old_token=request.old_token,
        new_token=request.new_token
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    return {"message": "Device token updated successfully"}


@router.post("/send")
async def send_notification(
    request: SendNotificationRequest,
    current_user = Depends(get_current_active_user)
):
    """Send push notification to all current user's devices."""
    service = get_push_notification_service()
    
    notification = await service.send_notification(
        user_id=current_user["id"],
        title=sanitize_text(request.title, 200),
        body=sanitize_text(request.body, 2000),
        data=request.data,
        image_url=request.image_url,
        priority=request.priority,
        badge_count=request.badge_count,
        sound=request.sound
    )
    
    return notification


@router.post("/send/device")
async def send_to_device(
    request: SendToDeviceRequest,
    current_user = Depends(require_admin)
):
    """Send push notification to a specific device (admin only)."""
    service = get_push_notification_service()
    
    result = await service.send_to_device(
        device_token=request.device_token,
        platform=request.platform,
        title=request.title,
        body=request.body,
        data=request.data
    )
    
    return result


@router.post("/send/batch")
async def send_batch_notifications(
    request: SendBatchRequest,
    current_user = Depends(require_admin)
):
    """Send push notification to multiple users (admin only)."""
    service = get_push_notification_service()
    
    result = await service.send_batch(
        user_ids=request.user_ids,
        title=request.title,
        body=request.body,
        data=request.data
    )
    
    return result


@router.post("/send/silent")
async def send_silent_push(
    request: SilentPushRequest,
    current_user = Depends(get_current_active_user)
):
    """Send silent push for background data sync."""
    service = get_push_notification_service()
    
    result = await service.send_silent_push(
        user_id=current_user["id"],
        data=request.data
    )
    
    return result


@router.get("/templates")
async def get_notification_templates(
    current_user = Depends(get_current_active_user)
):
    """Get predefined notification templates."""
    service = get_push_notification_service()
    templates = await service.get_notification_templates()
    return {"templates": templates}


@router.post("/send/template")
async def send_from_template(
    request: SendFromTemplateRequest,
    current_user = Depends(get_current_active_user)
):
    """Send notification using a template."""
    service = get_push_notification_service()
    
    result = await service.send_from_template(
        user_id=current_user["id"],
        template_id=request.template_id,
        variables=request.variables
    )
    
    if not result.get("success", True) is False:
        return result
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=result.get("error", "Failed to send notification")
    )


@router.get("/stats")
async def get_notification_stats(
    days: int = 30,
    current_user = Depends(get_current_active_user)
):
    """Get push notification statistics."""
    service = get_push_notification_service()
    stats = await service.get_notification_stats(
        user_id=current_user["id"],
        days=days
    )
    return stats


@router.post("/opened/{notification_id}")
async def mark_notification_opened(
    notification_id: str,
    device_id: str,
    current_user = Depends(get_current_active_user)
):
    """Mark a notification as opened for analytics."""
    service = get_push_notification_service()
    
    success = await service.mark_notification_opened(
        notification_id=notification_id,
        device_id=device_id
    )
    
    return {"success": success}


@router.post("/topics/subscribe")
async def subscribe_to_topic(
    request: TopicSubscriptionRequest,
    current_user = Depends(get_current_active_user)
):
    """Subscribe device to a topic."""
    service = get_push_notification_service()
    
    success = await service.subscribe_to_topic(
        device_token=request.device_token,
        topic=request.topic
    )
    
    return {"success": success, "message": f"Subscribed to topic: {request.topic}"}


@router.post("/topics/unsubscribe")
async def unsubscribe_from_topic(
    request: TopicSubscriptionRequest,
    current_user = Depends(get_current_active_user)
):
    """Unsubscribe device from a topic."""
    service = get_push_notification_service()
    
    success = await service.unsubscribe_from_topic(
        device_token=request.device_token,
        topic=request.topic
    )
    
    return {"success": success, "message": f"Unsubscribed from topic: {request.topic}"}


@router.post("/topics/send")
async def send_to_topic(
    request: SendToTopicRequest,
    current_user = Depends(require_admin)
):
    """Send notification to all devices subscribed to a topic (admin only)."""
    service = get_push_notification_service()
    
    result = await service.send_to_topic(
        topic=request.topic,
        title=request.title,
        body=request.body,
        data=request.data
    )
    
    return result
