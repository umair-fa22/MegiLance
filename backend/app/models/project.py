# @AI-HINT: Project model - client job postings with budget, timeline, and status management
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User
    from .proposal import Proposal
    from .project_tag import ProjectTag
    from .talent_invitation import TalentInvitation

class ProjectCategory(enum.Enum):
    """Project category enumeration"""
    WEB_DEVELOPMENT = "Web Development"
    MOBILE_DEVELOPMENT = "Mobile Development"
    DATA_SCIENCE = "Data Science & Analytics"
    DESIGN = "Design & Creative"
    WRITING = "Writing & Content"
    MARKETING = "Marketing & Sales"
    VIDEO_EDITING = "Video & Animation"
    OTHER = "Other"

class ProjectStatus(enum.Enum):
    """Project status enumeration"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100))
    budget_type: Mapped[str] = mapped_column(String(20))  # Fixed or Hourly
    budget_min: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=True)
    budget_max: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=True)
    experience_level: Mapped[str] = mapped_column(String(20))  # Entry, Intermediate, Expert
    estimated_duration: Mapped[str] = mapped_column(String(50))  # Less than 1 week, 1-4 weeks, etc.
    skills: Mapped[str] = mapped_column(Text)  # JSON string of skills
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20), default="open")  # open, in_progress, completed, cancelled
    
    # Enhanced fields for competitive parity
    visibility: Mapped[str] = mapped_column(String(20), default="public")  # public, invite_only, private
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    attachments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of file URLs
    screening_questions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of questions
    preferred_qualifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    max_proposals: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Limit proposals
    proposals_count: Mapped[int] = mapped_column(Integer, default=0)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id])
    proposals: Mapped[List["Proposal"]] = relationship("Proposal", back_populates="project")
    project_tags: Mapped[List["ProjectTag"]] = relationship("ProjectTag", back_populates="project")
    invitations: Mapped[List["TalentInvitation"]] = relationship("TalentInvitation", back_populates="project", cascade="all, delete-orphan")