# @AI-HINT: Contract model - agreements between clients and freelancers with status tracking
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Enum, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from decimal import Decimal
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User
    from .project import Project
    from .review import Review
    from .dispute import Dispute
    from .milestone import Milestone
    from .payment import Payment
    from .escrow import Escrow
    from .time_entry import TimeEntry
    from .invoice import Invoice

class ContractStatus(enum.Enum):
    """Contract status enumeration"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"
    TERMINATED = "terminated"
    REFUNDED = "refunded"

class ContractType(enum.Enum):
    """Contract type enumeration"""
    FIXED = "fixed"
    HOURLY = "hourly"
    RETAINER = "retainer"

class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_address: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)  # Blockchain contract address
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    freelancer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    winning_bid_id: Mapped[int] = mapped_column(ForeignKey("proposals.id"), nullable=True)
    
    # Financials
    contract_type: Mapped[str] = mapped_column(String(20), default=ContractType.FIXED.value, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)  # Canonical: total contract value
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    hourly_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    retainer_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    retainer_frequency: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) # weekly, monthly
    
    contract_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))  # Legacy alias for amount — kept in sync, prefer `amount`
    platform_fee: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    status: Mapped[str] = mapped_column(String(20), default=ContractStatus.PENDING.value, index=True)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    milestones: Mapped[str] = mapped_column(Text, nullable=True)  # Legacy JSON blob — structured data now in milestone_items relationship
    terms: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of terms
    blockchain_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project: Mapped["Project"] = relationship("Project")
    freelancer: Mapped["User"] = relationship("User", foreign_keys=[freelancer_id])
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id])
    escrow_records: Mapped[List["Escrow"]] = relationship("Escrow", back_populates="contract")
    time_entries: Mapped[List["TimeEntry"]] = relationship("TimeEntry", back_populates="contract")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="contract")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="contract")
    disputes: Mapped[List["Dispute"]] = relationship("Dispute", back_populates="contract")
    milestone_items: Mapped[List["Milestone"]] = relationship("Milestone", back_populates="contract")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="contract")