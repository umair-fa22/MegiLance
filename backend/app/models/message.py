# @AI-HINT: Message model for direct messages within conversations
"""Message models for MegiLance platform"""
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
    from .conversation import Conversation
    from .project import Project

class MessageType(enum.Enum):
    """Message type enumeration"""
    TEXT = "text"
    FILE = "file"
    SYSTEM = "system"
    CONTRACT = "contract"
    MILESTONE = "milestone"

class Message(Base):
    """
    Messages table for conversation messaging
    """
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    content: Mapped[str] = mapped_column(Text)
    message_type: Mapped[str] = mapped_column(String(20), default=MessageType.TEXT.value)
    attachments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string (portable format)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    parent_message_id: Mapped[int] = mapped_column(ForeignKey("messages.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])
    receiver: Mapped["User"] = relationship("User", foreign_keys=[receiver_id])
    project: Mapped[Optional["Project"]] = relationship("Project")
    parent_message: Mapped[Optional["Message"]] = relationship("Message", remote_side=[id])
