# @AI-HINT: Gig model for Fiverr-style service packages - freelancers create fixed-price offerings with Basic/Standard/Premium tiers
"""Gig model for service marketplace functionality."""

from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User
    from .category import Category
    from .gig_order import GigOrder
    from .gig_review import GigReview
    from .gig_faq import GigFAQ


class GigStatus(enum.Enum):
    """Gig status enumeration"""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    PAUSED = "paused"
    DENIED = "denied"
    DELETED = "deleted"


class GigPackageTier(enum.Enum):
    """Gig package tier levels"""
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"


class Gig(Base):
    """
    Gig model representing a freelancer's service offering.
    Similar to Fiverr's gig system where freelancers create packages for clients to purchase.
    """
    __tablename__ = "gigs"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Basic Info
    title: Mapped[str] = mapped_column(String(80), nullable=False)  # Max 80 chars like Fiverr
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)  # URL-friendly slug
    description: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[str] = mapped_column(String(200), nullable=True)  # For cards/previews
    
    # Category & Tags
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=True)
    subcategory: Mapped[str] = mapped_column(String(100), nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of tags
    search_tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Additional search keywords
    
    # Seller
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    # Pricing Packages (Basic, Standard, Premium)
    # Basic Package
    basic_title: Mapped[str] = mapped_column(String(100), default="Basic")
    basic_description: Mapped[str] = mapped_column(Text, nullable=True)
    basic_price: Mapped[float] = mapped_column(Float, default=5.0)
    basic_delivery_days: Mapped[int] = mapped_column(Integer, default=7)
    basic_revisions: Mapped[int] = mapped_column(Integer, default=1)
    basic_features: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    
    # Standard Package
    standard_title: Mapped[str] = mapped_column(String(100), default="Standard")
    standard_description: Mapped[str] = mapped_column(Text, nullable=True)
    standard_price: Mapped[float] = mapped_column(Float, default=25.0)
    standard_delivery_days: Mapped[int] = mapped_column(Integer, default=5)
    standard_revisions: Mapped[int] = mapped_column(Integer, default=3)
    standard_features: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    
    # Premium Package
    premium_title: Mapped[str] = mapped_column(String(100), default="Premium")
    premium_description: Mapped[str] = mapped_column(Text, nullable=True)
    premium_price: Mapped[float] = mapped_column(Float, default=75.0)
    premium_delivery_days: Mapped[int] = mapped_column(Integer, default=3)
    premium_revisions: Mapped[int] = mapped_column(Integer, default=5)
    premium_features: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array
    
    # Custom Extras (Add-ons)
    extras: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of extra services
    
    # Media
    images: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of image URLs
    video_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Requirements
    requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of required info from buyer
    
    # Stats
    views: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    orders_count: Mapped[int] = mapped_column(Integer, default=0)
    completed_orders: Mapped[int] = mapped_column(Integer, default=0)
    cancelled_orders: Mapped[int] = mapped_column(Integer, default=0)
    
    # Ratings
    average_rating: Mapped[float] = mapped_column(Float, default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    rating_breakdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON: {"5": 10, "4": 5, ...}
    
    # Status & Visibility
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_promoted: Mapped[bool] = mapped_column(Boolean, default=False)
    promotion_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Response & Delivery Metrics
    average_response_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # In hours
    on_time_delivery_rate: Mapped[float] = mapped_column(Float, default=100.0)
    
    # SEO
    meta_title: Mapped[Optional[str]] = mapped_column(String(70), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_order_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    seller: Mapped["User"] = relationship("User", back_populates="gigs")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="gigs")
    orders: Mapped[List["GigOrder"]] = relationship("GigOrder", back_populates="gig", cascade="all, delete-orphan")
    reviews: Mapped[List["GigReview"]] = relationship("GigReview", back_populates="gig", cascade="all, delete-orphan")
    faqs: Mapped[List["GigFAQ"]] = relationship("GigFAQ", back_populates="gig", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Gig {self.id}: {self.title}>"

    @property
    def completion_rate(self) -> float:
        """Calculate order completion rate."""
        if self.orders_count == 0:
            return 100.0
        return (self.completed_orders / self.orders_count) * 100

    @property
    def is_top_rated(self) -> bool:
        """Check if gig qualifies as top-rated."""
        return self.average_rating >= 4.7 and self.total_reviews >= 10

    def get_package(self, tier: str) -> dict:
        """Get package details by tier."""
        tier_map = {
            "basic": {
                "title": self.basic_title,
                "description": self.basic_description,
                "price": self.basic_price,
                "delivery_days": self.basic_delivery_days,
                "revisions": self.basic_revisions,
                "features": self.basic_features
            },
            "standard": {
                "title": self.standard_title,
                "description": self.standard_description,
                "price": self.standard_price,
                "delivery_days": self.standard_delivery_days,
                "revisions": self.standard_revisions,
                "features": self.standard_features
            },
            "premium": {
                "title": self.premium_title,
                "description": self.premium_description,
                "price": self.premium_price,
                "delivery_days": self.premium_delivery_days,
                "revisions": self.premium_revisions,
                "features": self.premium_features
            }
        }
        return tier_map.get(tier.lower(), tier_map["basic"])
