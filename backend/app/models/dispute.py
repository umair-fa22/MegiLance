# @AI-HINT: Dispute model for contract disagreements with admin arbitration workflow
"""Dispute models for MegiLance platform"""
from sqlalchemy import String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User
    from .contract import Contract

class DisputeType(enum.Enum):
    """Dispute type enumeration"""
    PAYMENT = "payment"
    QUALITY = "quality"
    COMMUNICATION = "communication"
    DEADLINE = "deadline"
    SCOPE_CHANGE = "scope_change"
    CANCELLATION = "cancellation"
    OTHER = "other"

class DisputeStatus(enum.Enum):
    """Dispute status enumeration"""
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"

class Dispute(Base):
    """
    Disputes table for contract disputes
    """
    __tablename__ = "disputes"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    raised_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    dispute_type: Mapped[str] = mapped_column(String(50), index=True)
    description: Mapped[str] = mapped_column(Text)
    evidence: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of evidence URLs
    status: Mapped[str] = mapped_column(String(20), default=DisputeStatus.OPEN.value, index=True)
    assigned_to: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)  # Admin/mediator
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    resolution: Mapped[str] = mapped_column(Text, nullable=True)
    resolution_amount: Mapped[float] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    contract: Mapped["Contract"] = relationship("Contract", back_populates="disputes")
    raised_by_user: Mapped["User"] = relationship("User", foreign_keys=[raised_by])
    assigned_admin: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to])
