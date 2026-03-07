# @AI-HINT: Multi-channel notification delivery (push, email, in-app)
"""Notification delivery service with channel routing and rate limiting."""

import logging
import secrets
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
from collections import defaultdict

from app.services.notification_preferences import NotificationChannel

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    """Types of notifications."""
    # Project related
    NEW_PROJECT_MATCH = "new_project_match"
    PROJECT_INVITATION = "project_invitation"
    PROJECT_UPDATE = "project_update"
    PROJECT_COMPLETED = "project_completed"
    
    # Proposal related
    NEW_PROPOSAL = "new_proposal"
    PROPOSAL_ACCEPTED = "proposal_accepted"
    PROPOSAL_REJECTED = "proposal_rejected"
    PROPOSAL_WITHDRAWN = "proposal_withdrawn"
    
    # Contract related
    CONTRACT_STARTED = "contract_started"
    CONTRACT_MILESTONE = "contract_milestone"
    CONTRACT_COMPLETED = "contract_completed"
    CONTRACT_DISPUTED = "contract_disputed"
    
    # Payment related
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_SENT = "payment_sent"
    ESCROW_FUNDED = "escrow_funded"
    ESCROW_RELEASED = "escrow_released"
    WITHDRAWAL_COMPLETED = "withdrawal_completed"
    
    # Message related
    NEW_MESSAGE = "new_message"
    MESSAGE_READ = "message_read"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    
    # Review related
    NEW_REVIEW = "new_review"
    REVIEW_RESPONSE = "review_response"
    
    # Account related
    ACCOUNT_VERIFIED = "account_verified"
    PROFILE_VIEWED = "profile_viewed"
    PASSWORD_CHANGED = "password_changed"
    LOGIN_ALERT = "login_alert"
    
    # System
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    MAINTENANCE_ALERT = "maintenance_alert"
    FEATURE_UPDATE = "feature_update"


class NotificationPriority(str, Enum):
    """Notification priority levels."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationCenterService:
    """
    Multi-channel notification delivery and management system.
    
    Handles push, email, in-app, and SMS notifications with
    user preferences and rate limiting.
    """
    
    # Default notification templates
    TEMPLATES = {
        NotificationType.NEW_PROPOSAL: {
            "title": "New Proposal Received",
            "body": "{freelancer_name} submitted a proposal for '{project_title}'",
            "email_subject": "New Proposal: {project_title}",
            "icon": "📝",
            "action_url": "/projects/{project_id}/proposals"
        },
        NotificationType.PROPOSAL_ACCEPTED: {
            "title": "Proposal Accepted! 🎉",
            "body": "Your proposal for '{project_title}' has been accepted",
            "email_subject": "Great news! Your proposal was accepted",
            "icon": "✅",
            "action_url": "/contracts/{contract_id}"
        },
        NotificationType.PAYMENT_RECEIVED: {
            "title": "Payment Received",
            "body": "You received ${amount} for '{project_title}'",
            "email_subject": "Payment received: ${amount}",
            "icon": "💰",
            "action_url": "/payments"
        },
        NotificationType.NEW_MESSAGE: {
            "title": "New Message",
            "body": "{sender_name}: {message_preview}",
            "email_subject": "New message from {sender_name}",
            "icon": "💬",
            "action_url": "/messages/{conversation_id}"
        },
        NotificationType.NEW_PROJECT_MATCH: {
            "title": "New Project Match",
            "body": "'{project_title}' matches your skills - {match_score}% match",
            "email_subject": "New project matching your skills",
            "icon": "🎯",
            "action_url": "/projects/{project_id}"
        },
        NotificationType.INTERVIEW_SCHEDULED: {
            "title": "Interview Scheduled",
            "body": "Interview with {other_party} scheduled for {date_time}",
            "email_subject": "Interview scheduled: {project_title}",
            "icon": "📅",
            "action_url": "/interviews/{interview_id}"
        },
        NotificationType.NEW_REVIEW: {
            "title": "New Review Received",
            "body": "{reviewer_name} left you a {rating}★ review",
            "email_subject": "You received a new review",
            "icon": "⭐",
            "action_url": "/reviews"
        },
        NotificationType.ESCROW_FUNDED: {
            "title": "Escrow Funded",
            "body": "${amount} has been deposited to escrow for '{project_title}'",
            "email_subject": "Escrow funded: {project_title}",
            "icon": "🔒",
            "action_url": "/escrow/{escrow_id}"
        },
        NotificationType.CONTRACT_MILESTONE: {
            "title": "Milestone Update",
            "body": "Milestone '{milestone_title}' has been {status}",
            "email_subject": "Milestone update: {project_title}",
            "icon": "📊",
            "action_url": "/contracts/{contract_id}"
        }
    }
    
    # Rate limits per channel (notifications per hour)
    RATE_LIMITS = {
        NotificationChannel.PUSH: 20,
        NotificationChannel.EMAIL: 10,
        NotificationChannel.IN_APP: 100,
        NotificationChannel.SMS: 5
    }
    
    def __init__(self):
        pass
        
        # In-memory stores
        self._notifications: Dict[str, Dict] = {}
        self._user_notifications: Dict[int, List[str]] = defaultdict(list)
        self._user_preferences: Dict[int, Dict] = {}
        self._rate_tracking: Dict[str, List[datetime]] = defaultdict(list)
        self._push_subscriptions: Dict[int, List[Dict]] = defaultdict(list)
    
    async def send_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        data: Dict[str, Any],
        channels: Optional[List[NotificationChannel]] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        schedule_for: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Send a notification to a user.
        
        Args:
            user_id: Recipient user ID
            notification_type: Type of notification
            data: Template variables and metadata
            channels: Delivery channels (defaults to user preferences)
            priority: Notification priority
            schedule_for: Schedule for later delivery
            
        Returns:
            Notification result with delivery status per channel
        """
        try:
            # Get user preferences
            preferences = await self.get_user_preferences(user_id)
            
            # Determine channels
            if channels is None:
                channels = self._get_enabled_channels(preferences, notification_type)
            
            # Check if notification type is enabled
            if not preferences.get("types", {}).get(notification_type.value, True):
                return {
                    "status": "skipped",
                    "reason": "Notification type disabled by user"
                }
            
            # Get template
            template = self.TEMPLATES.get(notification_type, {
                "title": notification_type.value.replace("_", " ").title(),
                "body": str(data),
                "icon": "🔔"
            })
            
            # Render notification
            notification = self._render_notification(template, data)
            notification_id = f"notif_{secrets.token_hex(12)}"
            
            # Create notification record
            notification_record = {
                "id": notification_id,
                "user_id": user_id,
                "type": notification_type.value,
                "title": notification["title"],
                "body": notification["body"],
                "icon": notification["icon"],
                "action_url": notification.get("action_url"),
                "data": data,
                "priority": priority.value,
                "channels": [c.value for c in channels],
                "delivery_status": {},
                "read": False,
                "read_at": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "scheduled_for": schedule_for.isoformat() if schedule_for else None
            }
            
            # If scheduled for later, store and return
            if schedule_for and schedule_for > datetime.now(timezone.utc):
                notification_record["status"] = "scheduled"
                self._notifications[notification_id] = notification_record
                self._user_notifications[user_id].append(notification_id)
                return {
                    "notification_id": notification_id,
                    "status": "scheduled",
                    "scheduled_for": schedule_for.isoformat()
                }
            
            # Deliver to each channel
            delivery_results = {}
            for channel in channels:
                # Check rate limit
                if not self._check_rate_limit(user_id, channel):
                    delivery_results[channel.value] = {
                        "status": "rate_limited",
                        "message": "Too many notifications"
                    }
                    continue
                
                # Deliver
                result = await self._deliver_to_channel(
                    channel, user_id, notification, priority
                )
                delivery_results[channel.value] = result
                
                # Track for rate limiting
                self._track_delivery(user_id, channel)
            
            notification_record["delivery_status"] = delivery_results
            notification_record["status"] = "delivered"
            
            # Store notification
            self._notifications[notification_id] = notification_record
            self._user_notifications[user_id].append(notification_id)
            
            logger.info(f"Notification sent: {notification_id} to user {user_id}")
            
            return {
                "notification_id": notification_id,
                "status": "delivered",
                "channels": delivery_results
            }
            
        except Exception as e:
            logger.error(f"Send notification error: {str(e)}")
            raise
    
    async def send_bulk_notification(
        self,
        user_ids: List[int],
        notification_type: NotificationType,
        data: Dict[str, Any],
        channels: Optional[List[NotificationChannel]] = None
    ) -> Dict[str, Any]:
        """Send notification to multiple users."""
        results = {
            "total": len(user_ids),
            "success": 0,
            "failed": 0,
            "skipped": 0
        }
        
        for user_id in user_ids:
            try:
                result = await self.send_notification(
                    user_id=user_id,
                    notification_type=notification_type,
                    data=data,
                    channels=channels
                )
                
                if result["status"] == "delivered":
                    results["success"] += 1
                elif result["status"] == "skipped":
                    results["skipped"] += 1
                else:
                    results["failed"] += 1
                    
            except Exception as e:
                logger.error(f"Bulk notification error for user {user_id}: {str(e)}")
                results["failed"] += 1
        
        return results
    
    async def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        notification_type: Optional[NotificationType] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get notifications for a user."""
        notification_ids = self._user_notifications.get(user_id, [])
        
        notifications = []
        for nid in reversed(notification_ids):  # Most recent first
            notif = self._notifications.get(nid)
            if not notif:
                continue
            
            # Apply filters
            if unread_only and notif.get("read"):
                continue
            if notification_type and notif["type"] != notification_type.value:
                continue
            
            notifications.append(notif)
        
        total = len(notifications)
        notifications = notifications[offset:offset + limit]
        
        # Count unread
        unread_count = sum(
            1 for nid in notification_ids 
            if not self._notifications.get(nid, {}).get("read")
        )
        
        return {
            "notifications": notifications,
            "total": total,
            "unread_count": unread_count,
            "limit": limit,
            "offset": offset
        }
    
    async def mark_as_read(
        self,
        user_id: int,
        notification_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Mark notifications as read."""
        if notification_ids is None:
            # Mark all as read
            notification_ids = self._user_notifications.get(user_id, [])
        
        marked_count = 0
        for nid in notification_ids:
            notif = self._notifications.get(nid)
            if notif and notif["user_id"] == user_id and not notif.get("read"):
                notif["read"] = True
                notif["read_at"] = datetime.now(timezone.utc).isoformat()
                marked_count += 1
        
        return {
            "marked_count": marked_count,
            "status": "success"
        }
    
    async def delete_notification(
        self,
        user_id: int,
        notification_id: str
    ) -> bool:
        """Delete a notification."""
        notif = self._notifications.get(notification_id)
        if not notif or notif["user_id"] != user_id:
            return False
        
        del self._notifications[notification_id]
        if notification_id in self._user_notifications[user_id]:
            self._user_notifications[user_id].remove(notification_id)
        
        return True
    
    async def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """Get notification preferences for a user."""
        if user_id in self._user_preferences:
            return self._user_preferences[user_id]
        
        # Default preferences
        default = {
            "channels": {
                NotificationChannel.PUSH.value: True,
                NotificationChannel.EMAIL.value: True,
                NotificationChannel.IN_APP.value: True,
                NotificationChannel.SMS.value: False
            },
            "types": {
                # Enable all by default
                t.value: True for t in NotificationType
            },
            "quiet_hours": {
                "enabled": False,
                "start": "22:00",
                "end": "08:00",
                "timezone": "UTC"
            },
            "email_digest": {
                "enabled": True,
                "frequency": "daily"  # daily, weekly, never
            }
        }
        
        return default
    
    async def update_user_preferences(
        self,
        user_id: int,
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update notification preferences."""
        current = await self.get_user_preferences(user_id)
        
        # Merge preferences
        if "channels" in preferences:
            current["channels"].update(preferences["channels"])
        if "types" in preferences:
            current["types"].update(preferences["types"])
        if "quiet_hours" in preferences:
            current["quiet_hours"].update(preferences["quiet_hours"])
        if "email_digest" in preferences:
            current["email_digest"].update(preferences["email_digest"])
        
        self._user_preferences[user_id] = current
        
        return current
    
    async def register_push_subscription(
        self,
        user_id: int,
        subscription: Dict[str, Any],
        device_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Register a push notification subscription."""
        subscription_record = {
            "id": f"sub_{secrets.token_hex(8)}",
            "endpoint": subscription.get("endpoint"),
            "keys": subscription.get("keys", {}),
            "device_info": device_info or {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        self._push_subscriptions[user_id].append(subscription_record)
        
        return {
            "status": "registered",
            "subscription_id": subscription_record["id"]
        }
    
    async def unregister_push_subscription(
        self,
        user_id: int,
        subscription_id: str
    ) -> bool:
        """Unregister a push subscription."""
        subs = self._push_subscriptions.get(user_id, [])
        self._push_subscriptions[user_id] = [
            s for s in subs if s["id"] != subscription_id
        ]
        return True
    
    def _render_notification(
        self,
        template: Dict[str, str],
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Render notification from template with data."""
        rendered = {}
        
        for key, value in template.items():
            if isinstance(value, str):
                try:
                    rendered[key] = value.format(**data)
                except KeyError:
                    rendered[key] = value
            else:
                rendered[key] = value
        
        return rendered
    
    def _get_enabled_channels(
        self,
        preferences: Dict[str, Any],
        notification_type: NotificationType
    ) -> List[NotificationChannel]:
        """Get enabled channels based on preferences."""
        channels = []
        channel_prefs = preferences.get("channels", {})
        
        for channel in NotificationChannel:
            if channel_prefs.get(channel.value, True):
                channels.append(channel)
        
        # Always include in-app unless explicitly disabled
        if NotificationChannel.IN_APP not in channels:
            if channel_prefs.get(NotificationChannel.IN_APP.value, True):
                channels.append(NotificationChannel.IN_APP)
        
        return channels
    
    def _check_rate_limit(
        self,
        user_id: int,
        channel: NotificationChannel
    ) -> bool:
        """Check if notification is within rate limits."""
        key = f"{user_id}:{channel.value}"
        limit = self.RATE_LIMITS.get(channel, 50)
        
        # Clean old entries
        cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
        self._rate_tracking[key] = [
            t for t in self._rate_tracking[key] if t > cutoff
        ]
        
        return len(self._rate_tracking[key]) < limit
    
    def _track_delivery(
        self,
        user_id: int,
        channel: NotificationChannel
    ) -> None:
        """Track notification delivery for rate limiting."""
        key = f"{user_id}:{channel.value}"
        self._rate_tracking[key].append(datetime.now(timezone.utc))
    
    async def _deliver_to_channel(
        self,
        channel: NotificationChannel,
        user_id: int,
        notification: Dict[str, Any],
        priority: NotificationPriority
    ) -> Dict[str, Any]:
        """Deliver notification to specific channel."""
        if channel == NotificationChannel.PUSH:
            return await self._send_push(user_id, notification, priority)
        elif channel == NotificationChannel.EMAIL:
            return await self._send_email(user_id, notification, priority)
        elif channel == NotificationChannel.IN_APP:
            return {"status": "delivered", "channel": "in_app"}
        elif channel == NotificationChannel.SMS:
            return await self._send_sms(user_id, notification, priority)
        
        return {"status": "unsupported_channel"}
    
    async def _send_push(
        self,
        user_id: int,
        notification: Dict[str, Any],
        priority: NotificationPriority
    ) -> Dict[str, Any]:
        """Send web push notification."""
        subscriptions = self._push_subscriptions.get(user_id, [])
        
        if not subscriptions:
            return {"status": "no_subscription"}
        
        # Would integrate with web-push library in production
        return {
            "status": "delivered",
            "channel": "push",
            "subscriptions_notified": len(subscriptions)
        }
    
    async def _send_email(
        self,
        user_id: int,
        notification: Dict[str, Any],
        priority: NotificationPriority
    ) -> Dict[str, Any]:
        """Send email notification."""
        # Would integrate with SendGrid, Mailgun, etc. in production
        return {
            "status": "delivered",
            "channel": "email"
        }
    
    async def _send_sms(
        self,
        user_id: int,
        notification: Dict[str, Any],
        priority: NotificationPriority
    ) -> Dict[str, Any]:
        """Send SMS notification."""
        # Would integrate with Twilio in production
        return {
            "status": "delivered",
            "channel": "sms"
        }


# Singleton instance
_notification_service: Optional[NotificationCenterService] = None


def get_notification_service() -> NotificationCenterService:
    """Get or create notification service instance."""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationCenterService()
    return _notification_service
