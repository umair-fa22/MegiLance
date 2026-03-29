# @AI-HINT: Scope change request model for contract modification proposals
from sqlalchemy import String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .contract import Contract
    from .user import User

class ScopeChangeRequest(Base):
    __tablename__ = "scope_change_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    contract_id: Mapped[int] = mapped_column(ForeignKey("contracts.id"))
    requested_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    reason: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending") # pending, approved, rejected, cancelled
    old_amount: Mapped[float] = mapped_column(Float, nullable=True)
    new_amount: Mapped[float] = mapped_column(Float, nullable=True)
    old_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    new_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    contract: Mapped["Contract"] = relationship("Contract")
    requester: Mapped["User"] = relationship("User")
