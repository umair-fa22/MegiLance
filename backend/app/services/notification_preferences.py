# @AI-HINT: Notification preferences service for granular notification control
"""Notification Preferences Service - User notification settings management."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel


class NotificationChannel(str, Enum):
    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"
    SMS = "sms"
    SLACK = "slack"
    WEBHOOK = "webhook"


class NotificationCategory(str, Enum):
    # Project related
    PROJECT_POSTED = "project_posted"
    PROJECT_UPDATED = "project_updated"
    PROJECT_COMPLETED = "project_completed"
    
    # Proposal related
    PROPOSAL_RECEIVED = "proposal_received"
    PROPOSAL_ACCEPTED = "proposal_accepted"
    PROPOSAL_REJECTED = "proposal_rejected"
    
    # Contract related
    CONTRACT_CREATED = "contract_created"
    CONTRACT_UPDATED = "contract_updated"
    CONTRACT_COMPLETED = "contract_completed"
    
    # Payment related
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_SENT = "payment_sent"
    PAYMENT_FAILED = "payment_failed"
    ESCROW_RELEASED = "escrow_released"
    
    # Messages
    NEW_MESSAGE = "new_message"
    MESSAGE_MENTION = "message_mention"
    
    # Milestones
    MILESTONE_DUE = "milestone_due"
    MILESTONE_COMPLETED = "milestone_completed"
    MILESTONE_APPROVED = "milestone_approved"
    
    # Reviews
    REVIEW_RECEIVED = "review_received"
    REVIEW_REMINDER = "review_reminder"
    
    # System
    SECURITY_ALERT = "security_alert"
    ACCOUNT_UPDATE = "account_update"
    MARKETING = "marketing"
    
    # Calendar
    MEETING_REMINDER = "meeting_reminder"
    MEETING_SCHEDULED = "meeting_scheduled"
    MEETING_CANCELLED = "meeting_cancelled"


class DigestFrequency(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"


class NotificationPreference(BaseModel):
    """Individual notification preference."""
    category: NotificationCategory
    channels: List[NotificationChannel]
    enabled: bool = True


class QuietHours(BaseModel):
    """Quiet hours settings."""
    enabled: bool = False
    start_time: str = "22:00"
    end_time: str = "07:00"
    timezone: str = "UTC"
    days: List[int] = [0, 1, 2, 3, 4, 5, 6]  # All days


class DigestSettings(BaseModel):
    """Email digest settings."""
    enabled: bool = True
    frequency: DigestFrequency = DigestFrequency.DAILY
    send_at: str = "09:00"
    timezone: str = "UTC"
    include_categories: List[NotificationCategory] = []


class UserNotificationSettings(BaseModel):
    """Complete user notification settings."""
    user_id: Any
    global_enabled: bool = True
    preferences: Dict[str, NotificationPreference]
    quiet_hours: QuietHours
    digest: DigestSettings
    email_verified: bool = False
    push_enabled: bool = False
    push_token: Optional[str] = None
    updated_at: datetime


# Default preferences - all notifications enabled
DEFAULT_PREFERENCES: Dict[str, Dict[str, Any]] = {
    NotificationCategory.PROJECT_POSTED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.PROJECT_UPDATED.value: {
        "channels": [NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.PROJECT_COMPLETED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.PROPOSAL_RECEIVED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        "enabled": True
    },
    NotificationCategory.PROPOSAL_ACCEPTED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        "enabled": True
    },
    NotificationCategory.PROPOSAL_REJECTED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.CONTRACT_CREATED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.CONTRACT_UPDATED.value: {
        "channels": [NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.CONTRACT_COMPLETED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.PAYMENT_RECEIVED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        "enabled": True
    },
    NotificationCategory.PAYMENT_SENT.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.PAYMENT_FAILED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        "enabled": True
    },
    NotificationCategory.ESCROW_RELEASED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.NEW_MESSAGE.value: {
        "channels": [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        "enabled": True
    },
    NotificationCategory.MESSAGE_MENTION.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        "enabled": True
    },
    NotificationCategory.MILESTONE_DUE.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.MILESTONE_COMPLETED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.MILESTONE_APPROVED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.REVIEW_RECEIVED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.REVIEW_REMINDER.value: {
        "channels": [NotificationChannel.EMAIL],
        "enabled": True
    },
    NotificationCategory.SECURITY_ALERT.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        "enabled": True
    },
    NotificationCategory.ACCOUNT_UPDATE.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.MARKETING.value: {
        "channels": [NotificationChannel.EMAIL],
        "enabled": False
    },
    NotificationCategory.MEETING_REMINDER.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        "enabled": True
    },
    NotificationCategory.MEETING_SCHEDULED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    },
    NotificationCategory.MEETING_CANCELLED.value: {
        "channels": [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        "enabled": True
    }
}


class NotificationPreferencesService:
    """Service for managing notification preferences."""
    
    def __init__(self):
        self._user_settings: Dict[str, UserNotificationSettings] = {}
    
    def _get_default_settings(self, user_id: str) -> UserNotificationSettings:
        """Get default notification settings."""
        preferences = {}
        for category, config in DEFAULT_PREFERENCES.items():
            preferences[category] = NotificationPreference(
                category=NotificationCategory(category),
                channels=[NotificationChannel(c) for c in config["channels"]],
                enabled=config["enabled"]
            )
        
        return UserNotificationSettings(
            user_id=user_id,
            global_enabled=True,
            preferences=preferences,
            quiet_hours=QuietHours(),
            digest=DigestSettings(),
            updated_at=datetime.now(timezone.utc)
        )
    
    async def get_settings(self, user_id: str) -> UserNotificationSettings:
        """Get user's notification settings."""
        if user_id not in self._user_settings:
            self._user_settings[user_id] = self._get_default_settings(user_id)
        return self._user_settings[user_id]
    
    async def update_settings(
        self,
        user_id: str,
        updates: Dict[str, Any]
    ) -> UserNotificationSettings:
        """Update user's notification settings."""
        settings = await self.get_settings(user_id)
        
        if "global_enabled" in updates:
            settings.global_enabled = updates["global_enabled"]
        
        if "quiet_hours" in updates:
            settings.quiet_hours = QuietHours(**updates["quiet_hours"])
        
        if "digest" in updates:
            settings.digest = DigestSettings(**updates["digest"])
        
        if "push_enabled" in updates:
            settings.push_enabled = updates["push_enabled"]
        
        if "push_token" in updates:
            settings.push_token = updates["push_token"]
        
        settings.updated_at = datetime.now(timezone.utc)
        self._user_settings[user_id] = settings
        
        return settings
    
    async def update_category_preference(
        self,
        user_id: str,
        category: NotificationCategory,
        channels: Optional[List[NotificationChannel]] = None,
        enabled: Optional[bool] = None
    ) -> NotificationPreference:
        """Update preference for a specific category."""
        settings = await self.get_settings(user_id)
        
        if category.value not in settings.preferences:
            # Create with defaults
            default = DEFAULT_PREFERENCES.get(category.value, {
                "channels": [NotificationChannel.IN_APP],
                "enabled": True
            })
            settings.preferences[category.value] = NotificationPreference(
                category=category,
                channels=[NotificationChannel(c) for c in default["channels"]],
                enabled=default["enabled"]
            )
        
        pref = settings.preferences[category.value]
        
        if channels is not None:
            pref.channels = channels
        
        if enabled is not None:
            pref.enabled = enabled
        
        settings.updated_at = datetime.now(timezone.utc)
        
        return pref
    
    async def update_bulk_preferences(
        self,
        user_id: str,
        preferences: Dict[str, Dict[str, Any]]
    ) -> UserNotificationSettings:
        """Bulk update multiple category preferences."""
        settings = await self.get_settings(user_id)
        
        for category_str, config in preferences.items():
            try:
                category = NotificationCategory(category_str)
                channels = [NotificationChannel(c) for c in config.get("channels", [])]
                enabled = config.get("enabled", True)
                
                settings.preferences[category_str] = NotificationPreference(
                    category=category,
                    channels=channels,
                    enabled=enabled
                )
            except (ValueError, KeyError):
                continue
        
        settings.updated_at = datetime.now(timezone.utc)
        self._user_settings[user_id] = settings
        
        return settings
    
    async def should_notify(
        self,
        user_id: str,
        category: NotificationCategory,
        channel: NotificationChannel
    ) -> bool:
        """Check if a notification should be sent."""
        settings = await self.get_settings(user_id)
        
        # Global disable
        if not settings.global_enabled:
            # Always allow security alerts
            if category != NotificationCategory.SECURITY_ALERT:
                return False
        
        # Check category preference
        pref = settings.preferences.get(category.value)
        if not pref or not pref.enabled:
            return False
        
        # Check channel
        if channel not in pref.channels:
            return False
        
        # Check quiet hours
        if settings.quiet_hours.enabled:
            if self._is_quiet_hour(settings.quiet_hours):
                # During quiet hours, only allow critical notifications
                critical_categories = [
                    NotificationCategory.SECURITY_ALERT,
                    NotificationCategory.PAYMENT_FAILED
                ]
                if category not in critical_categories:
                    return False
        
        return True
    
    def _is_quiet_hour(self, quiet_hours: QuietHours) -> bool:
        """Check if current time is within quiet hours."""
        now = datetime.now(timezone.utc).time()
        start = datetime.strptime(quiet_hours.start_time, "%H:%M").time()
        end = datetime.strptime(quiet_hours.end_time, "%H:%M").time()
        
        # Check day
        if datetime.now(timezone.utc).weekday() not in quiet_hours.days:
            return False
        
        # Handle overnight quiet hours (e.g., 22:00 to 07:00)
        if start > end:
            return now >= start or now <= end
        else:
            return start <= now <= end
    
    async def get_channels_for_notification(
        self,
        user_id: str,
        category: NotificationCategory
    ) -> List[NotificationChannel]:
        """Get all channels that should receive a notification."""
        settings = await self.get_settings(user_id)
        
        if not settings.global_enabled:
            if category != NotificationCategory.SECURITY_ALERT:
                return []
        
        pref = settings.preferences.get(category.value)
        if not pref or not pref.enabled:
            return []
        
        # Filter by quiet hours
        active_channels = []
        for channel in pref.channels:
            if await self.should_notify(user_id, category, channel):
                active_channels.append(channel)
        
        return active_channels
    
    async def register_push_token(
        self,
        user_id: str,
        token: str,
        platform: str = "web"
    ) -> bool:
        """Register a push notification token."""
        settings = await self.get_settings(user_id)
        settings.push_token = token
        settings.push_enabled = True
        settings.updated_at = datetime.now(timezone.utc)
        return True
    
    async def unregister_push_token(self, user_id: str) -> bool:
        """Unregister push notification token."""
        settings = await self.get_settings(user_id)
        settings.push_token = None
        settings.push_enabled = False
        settings.updated_at = datetime.now(timezone.utc)
        return True
    
    async def get_digest_eligible_users(
        self,
        frequency: DigestFrequency
    ) -> List[str]:
        """Get users who should receive a digest at given frequency."""
        eligible = []
        for user_id, settings in self._user_settings.items():
            if (settings.digest.enabled and 
                settings.digest.frequency == frequency and
                settings.global_enabled):
                eligible.append(user_id)
        return eligible
    
    async def get_available_categories(self) -> List[Dict[str, Any]]:
        """Get all available notification categories with descriptions."""
        categories = []
        descriptions = {
            NotificationCategory.PROJECT_POSTED: "New projects matching your skills",
            NotificationCategory.PROJECT_UPDATED: "Updates to projects you're involved with",
            NotificationCategory.PROJECT_COMPLETED: "Project completion notifications",
            NotificationCategory.PROPOSAL_RECEIVED: "New proposals on your projects",
            NotificationCategory.PROPOSAL_ACCEPTED: "When your proposals are accepted",
            NotificationCategory.PROPOSAL_REJECTED: "When your proposals are declined",
            NotificationCategory.CONTRACT_CREATED: "New contract agreements",
            NotificationCategory.CONTRACT_UPDATED: "Contract changes and updates",
            NotificationCategory.CONTRACT_COMPLETED: "Contract completion notifications",
            NotificationCategory.PAYMENT_RECEIVED: "Incoming payments",
            NotificationCategory.PAYMENT_SENT: "Outgoing payment confirmations",
            NotificationCategory.PAYMENT_FAILED: "Payment failure alerts",
            NotificationCategory.ESCROW_RELEASED: "Escrow release notifications",
            NotificationCategory.NEW_MESSAGE: "New chat messages",
            NotificationCategory.MESSAGE_MENTION: "When someone mentions you",
            NotificationCategory.MILESTONE_DUE: "Upcoming milestone deadlines",
            NotificationCategory.MILESTONE_COMPLETED: "Milestone completion",
            NotificationCategory.MILESTONE_APPROVED: "Milestone approval",
            NotificationCategory.REVIEW_RECEIVED: "New reviews on your profile",
            NotificationCategory.REVIEW_REMINDER: "Reminders to leave reviews",
            NotificationCategory.SECURITY_ALERT: "Security-related alerts",
            NotificationCategory.ACCOUNT_UPDATE: "Account changes and updates",
            NotificationCategory.MARKETING: "Promotional content and offers",
            NotificationCategory.MEETING_REMINDER: "Upcoming meeting reminders",
            NotificationCategory.MEETING_SCHEDULED: "New meeting scheduled",
            NotificationCategory.MEETING_CANCELLED: "Meeting cancellations"
        }
        
        for cat in NotificationCategory:
            categories.append({
                "category": cat.value,
                "description": descriptions.get(cat, ""),
                "default_channels": [c.value for c in DEFAULT_PREFERENCES.get(cat.value, {}).get("channels", [])]
            })
        
        return categories


_singleton_notification_preferences_service = None

def get_notification_preferences_service() -> NotificationPreferencesService:
    """Get notification preferences service instance."""
    global _singleton_notification_preferences_service
    if _singleton_notification_preferences_service is None:
        _singleton_notification_preferences_service = NotificationPreferencesService()
    return _singleton_notification_preferences_service
