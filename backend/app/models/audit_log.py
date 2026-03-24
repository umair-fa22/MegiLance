# @AI-HINT: Audit log model for compliance logging of user actions and security events
"""Audit log models for MegiLance platform"""
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User

class AuditAction(enum.Enum):
    """Audit action enumeration"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    PASSWORD_CHANGE = "password_change"
    EMAIL_CHANGE = "email_change"
    PROFILE_UPDATE = "profile_update"
    PAYMENT_SENT = "payment_sent"
    PAYMENT_RECEIVED = "payment_received"
    CONTRACT_CREATED = "contract_created"
    CONTRACT_UPDATED = "contract_updated"
    DISPUTE_RAISED = "dispute_raised"
    DISPUTE_RESOLVED = "dispute_resolved"

class AuditLog(Base):
    """
    Audit logs table for tracking all system actions
    """
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    entity_type: Mapped[str] = mapped_column(String(50), index=True)  # User, Project, Contract, etc.
    entity_id: Mapped[int] = mapped_column(Integer, nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(50), index=True)
    old_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string (previous state)
    new_values: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string (current state)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
