# @AI-HINT: Payment model for tracking all financial transactions on the platform
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING, List
from decimal import Decimal
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User
    from .contract import Contract
    from .milestone import Milestone
    from .refund import Refund
    from .invoice import Invoice

class PaymentType(enum.Enum):
    """Payment type enumeration"""
    MILESTONE = "milestone"
    PROJECT = "project"
    REFUND = "refund"
    WITHDRAWAL = "withdrawal"
    DEPOSIT = "deposit"

class PaymentStatus(enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class PaymentMethod(enum.Enum):
    """Payment method enumeration"""
    PLATFORM = "platform"  # Default: Stripe / platform payment
    USDC = "usdc"
    BTC = "btc"
    ETH = "eth"
    USDT = "usdt"

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), nullable=True, index=True)
    milestone_id: Mapped[int] = mapped_column(ForeignKey("milestones.id"), nullable=True, index=True)
    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    payment_type: Mapped[str] = mapped_column(String(20), default=PaymentType.PROJECT.value, index=True)
    payment_method: Mapped[str] = mapped_column(String(20), default=PaymentMethod.PLATFORM.value)
    status: Mapped[str] = mapped_column(String(20), default=PaymentStatus.PENDING.value, index=True)
    transaction_id: Mapped[str] = mapped_column(String(200), nullable=True, unique=True)
    blockchain_tx_hash: Mapped[str] = mapped_column(String(200), nullable=True)  # Blockchain transaction hash
    payment_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Stored as JSON string (DB-neutral)
    platform_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    freelancer_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))  # Amount after platform fee
    description: Mapped[str] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    contract: Mapped[Optional["Contract"]] = relationship("Contract", back_populates="payments")
    milestone: Mapped[Optional["Milestone"]] = relationship("Milestone")
    from_user: Mapped["User"] = relationship("User", foreign_keys=[from_user_id])
    to_user: Mapped["User"] = relationship("User", foreign_keys=[to_user_id])
    refunds: Mapped[List["Refund"]] = relationship("Refund", back_populates="payment")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="payment")