# @AI-HINT: Referral model for tracking user referral codes, invites, and reward bonuses
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
import logging
import enum
logger = logging.getLogger(__name__)

class ReferralStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    COMPLETED = "completed"  # When the referred user completes a job or spends money
    EXPIRED = "expired"

class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(primary_key=True)
    referrer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    referred_email: Mapped[str] = mapped_column(String(255), index=True)
    referred_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    referral_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    reward_amount: Mapped[float] = mapped_column(Float, default=0.0)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    referrer: Mapped["User"] = relationship("User", foreign_keys=[referrer_id], backref="referrals_sent")
    referred_user: Mapped["User"] = relationship("User", foreign_keys=[referred_user_id], backref="referral_received")
