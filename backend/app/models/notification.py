# @AI-HINT: Notification model for in-app alerts, email triggers, and push notifications
"""Notification models for MegiLance platform"""
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User

class NotificationType(enum.Enum):
    """Notification type enumeration"""
    PROJECT_UPDATE = "project_update"
    NEW_PROPOSAL = "new_proposal"
    PROPOSAL_ACCEPTED = "proposal_accepted"
    PROPOSAL_REJECTED = "proposal_rejected"
    MESSAGE_RECEIVED = "message_received"
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_SENT = "payment_sent"
    CONTRACT_CREATED = "contract_created"
    CONTRACT_COMPLETED = "contract_completed"
    MILESTONE_COMPLETED = "milestone_completed"
    REVIEW_RECEIVED = "review_received"
    DISPUTE_CREATED = "dispute_created"
    DISPUTE_RESOLVED = "dispute_resolved"
    SYSTEM = "system"

class NotificationPriority(enum.Enum):
    """Notification priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Notification(Base):
    """
    Notifications table for user notifications
    """
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    notification_type: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Additional notification data (stored as JSON string)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default=NotificationPriority.MEDIUM.value)
    action_url: Mapped[str] = mapped_column(String(500), nullable=True)  # Link to relevant page

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
