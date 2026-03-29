# @AI-HINT: Embedding model for storing AI/ML vector embeddings for skill matching
from sqlalchemy import DateTime, ForeignKey, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .project import Project
    from .user import User

class ProjectEmbedding(Base):
    __tablename__ = "project_embeddings"

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), primary_key=True)
    embedding_vector: Mapped[bytes] = mapped_column(LargeBinary, nullable=True) # BLOB
    model_version: Mapped[str] = mapped_column(String(50), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project: Mapped["Project"] = relationship("Project")

class UserEmbedding(Base):
    __tablename__ = "user_embeddings"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    embedding_vector: Mapped[bytes] = mapped_column(LargeBinary, nullable=True) # BLOB
    model_version: Mapped[str] = mapped_column(String(50), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User")
