# @AI-HINT: Invoice model for billing and payment tracking with line items
"""
Invoice model for billing and payment tracking
"""
from sqlalchemy import String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from .contract import Contract
    from .user import User
    from .payment import Payment


class Invoice(Base):
    """
    Invoices table for billing documents
    """
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)  # Freelancer
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)  # Client
    subtotal: Mapped[float] = mapped_column(Float)
    tax: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    paid_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending, paid, overdue, cancelled
    items: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of line items
    payment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("payments.id"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    contract: Mapped["Contract"] = relationship("Contract", back_populates="invoices")
    from_user: Mapped["User"] = relationship("User", foreign_keys=[from_user_id])
    to_user: Mapped["User"] = relationship("User", foreign_keys=[to_user_id])
    payment: Mapped[Optional["Payment"]] = relationship("Payment", foreign_keys=[payment_id])
