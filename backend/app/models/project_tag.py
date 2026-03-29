# @AI-HINT: ProjectTag association model for many-to-many project-tag relationships
"""
ProjectTag model for project-tag association
"""
from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .project import Project
    from .tag import Tag


class ProjectTag(Base):
    """
    Junction table for many-to-many relationship between projects and tags
    """
    __tablename__ = "project_tags"
    __table_args__ = (
        UniqueConstraint('project_id', 'tag_id', name='uq_project_tag'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="project_tags")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="project_tags")
