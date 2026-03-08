# @AI-HINT: Notification preferences API endpoints
"""
Notification Preferences API - User notification settings endpoints.

Features:
- Get/update notification settings
- Category preferences
- Quiet hours
- Digest settings
- Push token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.notification_preferences import (
    get_notification_preferences_service,
    NotificationChannel,
    NotificationCategory,
    DigestFrequency
)

router = APIRouter(prefix="/notification-preferences", tags=["notification-preferences"])


# Request/Response Models
class QuietHoursRequest(BaseModel):
    enabled: bool = False
    start_time: str = "22:00"
    end_time: str = "07:00"
    timezone: str = "UTC"
    days: List[int] = [0, 1, 2, 3, 4, 5, 6]


class DigestSettingsRequest(BaseModel):
    enabled: bool = True
    frequency: DigestFrequency = DigestFrequency.DAILY
    send_at: str = "09:00"
    timezone: str = "UTC"


class UpdateSettingsRequest(BaseModel):
    global_enabled: Optional[bool] = None
    quiet_hours: Optional[QuietHoursRequest] = None
    digest: Optional[DigestSettingsRequest] = None
    push_enabled: Optional[bool] = None


class CategoryPreferenceRequest(BaseModel):
    category: NotificationCategory
    channels: List[NotificationChannel]
    enabled: bool = True


class BulkPreferencesRequest(BaseModel):
    preferences: Dict[str, Dict[str, Any]]


class RegisterPushTokenRequest(BaseModel):
    token: str
    platform: str = "web"


# Endpoints
@router.get("")
async def get_notification_settings(
    current_user = Depends(get_current_active_user)
):
    """Get current user's notification settings."""
    service = get_notification_preferences_service()
    settings = await service.get_settings(current_user["id"])
    return {"settings": settings}


@router.put("")
async def update_notification_settings(
    request: UpdateSettingsRequest,
    current_user = Depends(get_current_active_user)
):
    """Update notification settings."""
    service = get_notification_preferences_service()
    
    updates = {}
    if request.global_enabled is not None:
        updates["global_enabled"] = request.global_enabled
    if request.quiet_hours:
        updates["quiet_hours"] = request.quiet_hours.dict()
    if request.digest:
        updates["digest"] = request.digest.dict()
    if request.push_enabled is not None:
        updates["push_enabled"] = request.push_enabled
    
    settings = await service.update_settings(current_user["id"], updates)
    return {"settings": settings, "message": "Settings updated successfully"}


@router.get("/categories")
async def get_notification_categories(
    current_user = Depends(get_current_active_user)
):
    """Get all available notification categories."""
    service = get_notification_preferences_service()
    categories = await service.get_available_categories()
    return {"categories": categories}


@router.get("/channels")
async def get_notification_channels(
    current_user = Depends(get_current_active_user)
):
    """Get all available notification channels."""
    channels = [
        {"channel": c.value, "name": c.name.replace("_", " ").title()}
        for c in NotificationChannel
    ]
    return {"channels": channels}


@router.put("/category/{category}")
async def update_category_preference(
    category: NotificationCategory,
    request: CategoryPreferenceRequest,
    current_user = Depends(get_current_active_user)
):
    """Update preference for a specific notification category."""
    service = get_notification_preferences_service()
    
    pref = await service.update_category_preference(
        user_id=current_user["id"],
        category=category,
        channels=request.channels,
        enabled=request.enabled
    )
    
    return {"preference": pref, "message": "Preference updated"}


@router.put("/categories/bulk")
async def update_bulk_preferences(
    request: BulkPreferencesRequest,
    current_user = Depends(get_current_active_user)
):
    """Bulk update multiple category preferences."""
    service = get_notification_preferences_service()
    
    settings = await service.update_bulk_preferences(
        user_id=current_user["id"],
        preferences=request.preferences
    )
    
    return {"settings": settings, "message": "Preferences updated"}


@router.post("/push/register")
async def register_push_token(
    request: RegisterPushTokenRequest,
    current_user = Depends(get_current_active_user)
):
    """Register a push notification token."""
    service = get_notification_preferences_service()
    
    success = await service.register_push_token(
        user_id=current_user["id"],
        token=request.token,
        platform=request.platform
    )
    
    return {"success": success, "message": "Push token registered"}


@router.delete("/push")
async def unregister_push_token(
    current_user = Depends(get_current_active_user)
):
    """Unregister push notification token."""
    service = get_notification_preferences_service()
    
    success = await service.unregister_push_token(current_user["id"])
    
    return {"success": success, "message": "Push token unregistered"}


@router.get("/test/{category}")
async def test_notification_delivery(
    category: NotificationCategory,
    channel: NotificationChannel,
    current_user = Depends(get_current_active_user)
):
    """Test if a notification would be delivered."""
    service = get_notification_preferences_service()
    
    would_notify = await service.should_notify(
        user_id=current_user["id"],
        category=category,
        channel=channel
    )
    
    all_channels = await service.get_channels_for_notification(
        user_id=current_user["id"],
        category=category
    )
    
    return {
        "would_notify": would_notify,
        "category": category.value,
        "requested_channel": channel.value,
        "active_channels": [c.value for c in all_channels]
    }


@router.post("/disable-all")
async def disable_all_notifications(
    current_user = Depends(get_current_active_user)
):
    """Disable all notifications (except security alerts)."""
    service = get_notification_preferences_service()
    
    settings = await service.update_settings(
        user_id=current_user["id"],
        updates={"global_enabled": False}
    )
    
    return {"settings": settings, "message": "All notifications disabled (except security alerts)"}


@router.post("/enable-all")
async def enable_all_notifications(
    current_user = Depends(get_current_active_user)
):
    """Enable all notifications with defaults."""
    service = get_notification_preferences_service()
    
    settings = await service.update_settings(
        user_id=current_user["id"],
        updates={"global_enabled": True}
    )
    
    return {"settings": settings, "message": "All notifications enabled"}


@router.get("/quiet-hours/status")
async def get_quiet_hours_status(
    current_user = Depends(get_current_active_user)
):
    """Check if currently in quiet hours."""
    service = get_notification_preferences_service()
    settings = await service.get_settings(current_user["id"])
    
    is_quiet = False
    if settings.quiet_hours.enabled:
        is_quiet = service._is_quiet_hour(settings.quiet_hours)
    
    return {
        "in_quiet_hours": is_quiet,
        "quiet_hours_enabled": settings.quiet_hours.enabled,
        "quiet_hours": settings.quiet_hours.dict()
    }
