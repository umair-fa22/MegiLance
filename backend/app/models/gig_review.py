# @AI-HINT: Gig Review model for reviews specific to gig orders with multi-category ratings
"""Gig Review model for service marketplace reviews."""

from sqlalchemy import Integer, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .gig import Gig
    from .gig_order import GigOrder


class GigReview(Base):
    """
    Gig review model for rating completed orders.
    Includes multi-category ratings similar to Fiverr.
    """
    __tablename__ = "gig_reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    # References
    gig_id: Mapped[int] = mapped_column(ForeignKey("gigs.id"), index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("gig_orders.id"), unique=True, index=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)  # Buyer
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Multi-Category Ratings (1-5 stars)
    communication_rating: Mapped[float] = mapped_column(Float)  # Seller communication
    service_rating: Mapped[float] = mapped_column(Float)  # Service as described
    delivery_rating: Mapped[float] = mapped_column(Float)  # On-time delivery
    recommendation_rating: Mapped[float] = mapped_column(Float)  # Would recommend
    overall_rating: Mapped[float] = mapped_column(Float)  # Calculated average
    
    # Review Content
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Seller Response
    seller_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    seller_responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Private Feedback (only visible to platform)
    private_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    private_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Status
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)  # Verified purchase
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False)  # Hidden by admin
    
    # Helpful votes
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)
    not_helpful_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Media
    images: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of image URLs
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    gig: Mapped["Gig"] = relationship("Gig", back_populates="reviews")
    order: Mapped["GigOrder"] = relationship("GigOrder", back_populates="review")
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewer_id], back_populates="gig_reviews_given")
    seller: Mapped["User"] = relationship("User", foreign_keys=[seller_id], back_populates="gig_reviews_received")

    def __repr__(self):
        return f"<GigReview {self.id}: {self.overall_rating} stars>"

    @classmethod
    def calculate_overall(cls, communication: float, service: float, delivery: float, recommendation: float) -> float:
        """Calculate overall rating from category ratings."""
        return round((communication + service + delivery + recommendation) / 4, 1)
