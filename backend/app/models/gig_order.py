# @AI-HINT: Gig Order model for tracking purchases of gig packages with revision tracking and delivery management
"""Gig Order model for service marketplace orders."""

from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timedelta, timezone
from typing import List, Optional, TYPE_CHECKING
from decimal import Decimal
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User
    from .gig import Gig
    from .gig_review import GigReview
    from .gig_revision import GigRevision
    from .gig_delivery import GigDelivery


class GigOrderStatus(enum.Enum):
    """Order status enumeration"""
    PENDING = "pending"  # Awaiting payment
    REQUIREMENTS = "requirements"  # Awaiting buyer requirements
    IN_PROGRESS = "in_progress"  # Seller working on order
    DELIVERED = "delivered"  # Seller delivered, awaiting acceptance
    REVISION_REQUESTED = "revision_requested"  # Buyer requested changes
    COMPLETED = "completed"  # Order completed and accepted
    CANCELLED = "cancelled"  # Order cancelled
    DISPUTED = "disputed"  # Order in dispute
    LATE = "late"  # Order is overdue


class GigOrder(Base):
    """
    Gig order model representing a purchase of a gig package.
    Tracks the entire lifecycle from purchase to completion with revision tracking.
    """
    __tablename__ = "gig_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)  # e.g., "FO-2024-001234"
    
    # Core References
    gig_id: Mapped[int] = mapped_column(ForeignKey("gigs.id"), index=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Package Details (snapshot at time of order)
    package_tier: Mapped[str] = mapped_column(String(20))  # basic, standard, premium
    package_title: Mapped[str] = mapped_column(String(100))
    package_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Pricing
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    extras_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    service_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))  # Platform fee
    seller_earnings: Mapped[Decimal] = mapped_column(Numeric(12, 2))  # After platform fee
    tip_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    
    # Extras/Add-ons selected
    selected_extras: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    
    # Custom Order Details (for custom offers)
    custom_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    custom_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_custom_order: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Delivery Timeline
    delivery_days: Mapped[int] = mapped_column(Integer)
    expected_delivery_at: Mapped[datetime] = mapped_column(DateTime)
    actual_delivery_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    was_late: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Revisions
    revisions_included: Mapped[int] = mapped_column(Integer, default=1)
    revisions_used: Mapped[int] = mapped_column(Integer, default=0)
    extra_revisions_purchased: Mapped[int] = mapped_column(Integer, default=0)
    
    # Requirements
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON: buyer's answers to gig requirements
    requirements_submitted: Mapped[bool] = mapped_column(Boolean, default=False)
    requirements_submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    substatus: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Additional status info
    
    # Completion
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    auto_completed: Mapped[bool] = mapped_column(Boolean, default=False)  # Auto-accepted after 3 days
    
    # Cancellation
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Dispute
    dispute_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    disputed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Communication
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    conversation_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Files
    delivery_files: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of file URLs
    source_files_included: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # When seller started working
    
    # Payment Status
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, paid, refunded
    escrow_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Relationships
    gig: Mapped["Gig"] = relationship("Gig", back_populates="orders")
    buyer: Mapped["User"] = relationship("User", foreign_keys=[buyer_id], back_populates="gig_orders_as_buyer")
    seller: Mapped["User"] = relationship("User", foreign_keys=[seller_id], back_populates="gig_orders_as_seller")
    canceller: Mapped[Optional["User"]] = relationship("User", foreign_keys=[cancelled_by])
    review: Mapped[Optional["GigReview"]] = relationship("GigReview", back_populates="order", uselist=False)
    revisions: Mapped[List["GigRevision"]] = relationship("GigRevision", back_populates="order", cascade="all, delete-orphan")
    deliveries: Mapped[List["GigDelivery"]] = relationship("GigDelivery", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<GigOrder {self.order_number}>"

    @property
    def is_overdue(self) -> bool:
        """Check if order is past expected delivery date."""
        if self.status in ["completed", "cancelled", "delivered"]:
            return False
        return datetime.now(timezone.utc) > self.expected_delivery_at

    @property
    def time_remaining(self) -> timedelta:
        """Get time remaining until deadline."""
        return self.expected_delivery_at - datetime.now(timezone.utc)

    @property
    def revisions_remaining(self) -> int:
        """Get number of revisions remaining."""
        total = self.revisions_included + self.extra_revisions_purchased
        return max(0, total - self.revisions_used)

    @property
    def can_request_revision(self) -> bool:
        """Check if buyer can request revision."""
        return self.revisions_remaining > 0 and self.status == "delivered"

    def calculate_deadline(self, extra_days: int = 0) -> datetime:
        """Calculate delivery deadline based on order start."""
        start = self.started_at or self.requirements_submitted_at or self.created_at
        return start + timedelta(days=self.delivery_days + extra_days)
