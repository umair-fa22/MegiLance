# @AI-HINT: Proposal model - freelancer bids on projects with pricing and cover letter
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .project import Project

class Proposal(Base):
    __tablename__ = "proposals"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    freelancer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cover_letter: Mapped[str] = mapped_column(Text)
    bid_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)  # Total bid amount for the project
    estimated_hours: Mapped[int] = mapped_column(Integer)
    hourly_rate: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    availability: Mapped[str] = mapped_column(String(20))  # immediate, 1-2_weeks, 1_month, flexible
    attachments: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of attachment URLs
    status: Mapped[str] = mapped_column(String(20), default="submitted")  # submitted, accepted, rejected, withdrawn, draft
    is_draft: Mapped[bool] = mapped_column(Boolean, default=False)  # True if proposal is a draft
    draft_data: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string for additional draft data
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="proposals")
    freelancer: Mapped["User"] = relationship("User", foreign_keys=[freelancer_id])