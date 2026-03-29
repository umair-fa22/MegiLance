# @AI-HINT: Conversation model for messaging threads between users
"""Conversation models for MegiLance platform"""
from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .message import Message

class ConversationStatus(enum.Enum):
    """Conversation status enumeration"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    CLOSED = "closed"

class Conversation(Base):
    """
    Conversations table for managing message threads
    """
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    freelancer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=ConversationStatus.ACTIVE.value, index=True)
    last_message_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    project: Mapped[Optional["Project"]] = relationship("Project")
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id])
    freelancer: Mapped["User"] = relationship("User", foreign_keys=[freelancer_id])
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation", order_by="Message.sent_at")
