# @AI-HINT: Verification model for KYC/identity verification documents and status tracking
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User

class UserVerification(Base):
    __tablename__ = "user_verifications"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    kyc_status: Mapped[str] = mapped_column(String(20), default="pending")
    identity_doc_url: Mapped[str] = mapped_column(String(500), nullable=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=True)
    company_reg_number: Mapped[str] = mapped_column(String(100), nullable=True)
    tax_id: Mapped[str] = mapped_column(String(100), nullable=True)
    verified_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User")
