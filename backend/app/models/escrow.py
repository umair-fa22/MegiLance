# @AI-HINT: Escrow model for secure payment holding between client and freelancer
"""
Escrow model for secure payment holding
"""
from sqlalchemy import String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from decimal import Decimal

if TYPE_CHECKING:
    from .contract import Contract
    from .user import User


class Escrow(Base):
    """
    Escrow table for holding funds securely during contract execution
    """
    __tablename__ = "escrow"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"), index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))  # Total amount in escrow
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)  # pending, active, released, refunded, expired
    released_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))  # Amount released so far
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    contract: Mapped["Contract"] = relationship("Contract", back_populates="escrow_records")
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id])
