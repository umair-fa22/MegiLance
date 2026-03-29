# @AI-HINT: Support ticket model for customer service with priority and assignment tracking
"""
Support ticket model for customer service
"""
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from .user import User


class SupportTicket(Base):
    """
    Support tickets table for help desk system
    """
    __tablename__ = "support_tickets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    subject: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)  # billing, technical, account, other
    priority: Mapped[str] = mapped_column(String(20), default="medium", index=True)  # low, medium, high, urgent
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)  # open, in_progress, resolved, closed
    assigned_to: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    attachments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of file URLs
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    assigned_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to])
