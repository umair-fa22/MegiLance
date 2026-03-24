# @AI-HINT: Talent Invitation model for clients to invite specific freelancers to submit proposals
"""Talent Invitation model for project invitations."""

from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User
    from .project import Project


class InvitationStatus(enum.Enum):
    """Invitation status enumeration"""
    PENDING = "pending"
    ACCEPTED = "accepted"  # Freelancer submitted proposal
    DECLINED = "declined"  # Freelancer declined
    EXPIRED = "expired"  # Invitation expired (e.g., after 7 days)
    CANCELLED = "cancelled"  # Client cancelled


class TalentInvitation(Base):
    """
    Talent invitation model for clients to invite specific freelancers
    to submit proposals on their projects.
    """
    __tablename__ = "talent_invitations"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Core References
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)  # Who sent the invitation
    freelancer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)  # Who received it
    
    # Invitation Details
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Personal message from client
    suggested_rate: Mapped[Optional[float]] = mapped_column(nullable=True)  # Optional suggested rate
    
    # Status
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    
    # Freelancer Response
    response_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # If accepted, link to the resulting proposal
    proposal_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Tracking
    viewed: Mapped[bool] = mapped_column(Boolean, default=False)
    viewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Expiry
    expires_at: Mapped[datetime] = mapped_column(DateTime)  # Default 7 days
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="invitations")
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id], back_populates="invitations_sent")
    freelancer: Mapped["User"] = relationship("User", foreign_keys=[freelancer_id], back_populates="invitations_received")

    def __repr__(self):
        return f"<TalentInvitation {self.id}: Project {self.project_id} -> User {self.freelancer_id}>"

    @property
    def is_expired(self) -> bool:
        """Check if invitation has expired."""
        return datetime.now(timezone.utc) > self.expires_at and self.status == "pending"
