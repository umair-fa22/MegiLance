# @AI-HINT: Seller Level/Tier model for automatic progression based on performance (Bronze → Platinum)
"""Seller Level model for reputation tiers."""

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
import logging
import enum
logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .user import User


class SellerLevel(enum.Enum):
    """Seller level tiers - automatically calculated based on performance."""
    NEW_SELLER = "new_seller"  # Just starting out
    BRONZE = "bronze"  # Basic seller
    SILVER = "silver"  # Rising talent
    GOLD = "gold"  # Top rated
    PLATINUM = "platinum"  # Expert/Pro


# Thresholds for each level
LEVEL_REQUIREMENTS = {
    SellerLevel.NEW_SELLER: {
        "min_orders": 0,
        "min_earnings": 0,
        "min_rating": 0,
        "min_completion_rate": 0,
        "min_response_rate": 0,
        "min_on_time_rate": 0,
        "min_months_active": 0
    },
    SellerLevel.BRONZE: {
        "min_orders": 5,
        "min_earnings": 100,
        "min_rating": 4.0,
        "min_completion_rate": 80,
        "min_response_rate": 70,
        "min_on_time_rate": 80,
        "min_months_active": 1
    },
    SellerLevel.SILVER: {
        "min_orders": 20,
        "min_earnings": 500,
        "min_rating": 4.3,
        "min_completion_rate": 85,
        "min_response_rate": 80,
        "min_on_time_rate": 85,
        "min_months_active": 3
    },
    SellerLevel.GOLD: {
        "min_orders": 50,
        "min_earnings": 2000,
        "min_rating": 4.6,
        "min_completion_rate": 90,
        "min_response_rate": 90,
        "min_on_time_rate": 90,
        "min_months_active": 6
    },
    SellerLevel.PLATINUM: {
        "min_orders": 100,
        "min_earnings": 10000,
        "min_rating": 4.8,
        "min_completion_rate": 95,
        "min_response_rate": 95,
        "min_on_time_rate": 95,
        "min_months_active": 12
    }
}

# Benefits per level
LEVEL_BENEFITS = {
    SellerLevel.NEW_SELLER: {
        "max_active_gigs": 3,
        "featured_gigs": 0,
        "custom_offers": True,
        "priority_support": False,
        "reduced_fees": 0,
        "badge": None
    },
    SellerLevel.BRONZE: {
        "max_active_gigs": 7,
        "featured_gigs": 0,
        "custom_offers": True,
        "priority_support": False,
        "reduced_fees": 0,
        "badge": "bronze"
    },
    SellerLevel.SILVER: {
        "max_active_gigs": 10,
        "featured_gigs": 1,
        "custom_offers": True,
        "priority_support": False,
        "reduced_fees": 1,  # 1% reduction
        "badge": "silver"
    },
    SellerLevel.GOLD: {
        "max_active_gigs": 15,
        "featured_gigs": 2,
        "custom_offers": True,
        "priority_support": True,
        "reduced_fees": 2,  # 2% reduction
        "badge": "gold"
    },
    SellerLevel.PLATINUM: {
        "max_active_gigs": 20,
        "featured_gigs": 5,
        "custom_offers": True,
        "priority_support": True,
        "reduced_fees": 3,  # 3% reduction
        "badge": "platinum"
    }
}


class SellerStats(Base):
    """
    Seller statistics model for tracking performance metrics.
    Used to calculate seller level and Job Success Score (JSS).
    """
    __tablename__ = "seller_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    
    # Current Level
    level: Mapped[str] = mapped_column(String(20), default="new_seller")
    level_achieved_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Order Statistics
    total_orders: Mapped[int] = mapped_column(Integer, default=0)
    completed_orders: Mapped[int] = mapped_column(Integer, default=0)
    cancelled_orders: Mapped[int] = mapped_column(Integer, default=0)
    cancelled_by_seller: Mapped[int] = mapped_column(Integer, default=0)
    cancelled_by_buyer: Mapped[int] = mapped_column(Integer, default=0)
    orders_delivered_late: Mapped[int] = mapped_column(Integer, default=0)
    
    # Active Work
    active_orders: Mapped[int] = mapped_column(Integer, default=0)
    pending_orders: Mapped[int] = mapped_column(Integer, default=0)
    
    # Earnings
    total_earnings: Mapped[float] = mapped_column(Float, default=0.0)
    earnings_this_month: Mapped[float] = mapped_column(Float, default=0.0)
    earnings_last_month: Mapped[float] = mapped_column(Float, default=0.0)
    average_order_value: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Ratings
    average_rating: Mapped[float] = mapped_column(Float, default=0.0)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0)
    five_star_reviews: Mapped[int] = mapped_column(Integer, default=0)
    one_star_reviews: Mapped[int] = mapped_column(Integer, default=0)
    
    # Rating Breakdown
    communication_rating: Mapped[float] = mapped_column(Float, default=0.0)
    service_rating: Mapped[float] = mapped_column(Float, default=0.0)
    delivery_rating: Mapped[float] = mapped_column(Float, default=0.0)
    recommendation_rating: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Response Metrics
    response_rate: Mapped[float] = mapped_column(Float, default=100.0)  # Percentage
    average_response_time_hours: Mapped[float] = mapped_column(Float, default=0.0)
    messages_received: Mapped[int] = mapped_column(Integer, default=0)
    messages_responded: Mapped[int] = mapped_column(Integer, default=0)
    
    # Delivery Metrics
    on_time_delivery_rate: Mapped[float] = mapped_column(Float, default=100.0)  # Percentage
    
    # Job Success Score (JSS) - Upwork-style composite score
    job_success_score: Mapped[float] = mapped_column(Float, default=0.0)
    jss_last_calculated: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Repeat Clients
    repeat_clients: Mapped[int] = mapped_column(Integer, default=0)
    repeat_client_rate: Mapped[float] = mapped_column(Float, default=0.0)
    unique_clients: Mapped[int] = mapped_column(Integer, default=0)
    
    # Disputes
    disputes_opened: Mapped[int] = mapped_column(Integer, default=0)
    disputes_won: Mapped[int] = mapped_column(Integer, default=0)
    disputes_lost: Mapped[int] = mapped_column(Integer, default=0)
    
    # Gig Stats
    total_gigs: Mapped[int] = mapped_column(Integer, default=0)
    active_gigs: Mapped[int] = mapped_column(Integer, default=0)
    gig_impressions: Mapped[int] = mapped_column(Integer, default=0)
    gig_clicks: Mapped[int] = mapped_column(Integer, default=0)
    
    # Account Age
    member_since: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    months_active: Mapped[int] = mapped_column(Integer, default=0)
    
    # Verification & Trust
    identity_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    payment_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    skills_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Warnings & Restrictions
    warnings_count: Mapped[int] = mapped_column(Integer, default=0)
    is_restricted: Mapped[bool] = mapped_column(Boolean, default=False)
    restriction_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="seller_stats")

    def __repr__(self):
        return f"<SellerStats for User {self.user_id}: Level {self.level}>"

    @property
    def completion_rate(self) -> float:
        """Calculate order completion rate."""
        if self.total_orders == 0:
            return 100.0
        return (self.completed_orders / self.total_orders) * 100

    @property
    def seller_level_enum(self) -> SellerLevel:
        """Get seller level as enum."""
        return SellerLevel(self.level)

    def calculate_jss(self) -> float:
        """
        Calculate Job Success Score (JSS) similar to Upwork.
        Composite score based on:
        - Completion rate (30%)
        - Client ratings (30%)
        - On-time delivery (20%)
        - Repeat clients (10%)
        - Dispute outcomes (10%)
        """
        if self.total_orders == 0:
            return 0.0
        
        # Completion rate component (30%)
        completion_score = (self.completion_rate / 100) * 30
        
        # Rating component (30%)
        rating_score = (self.average_rating / 5) * 30
        
        # On-time delivery component (20%)
        on_time_score = (self.on_time_delivery_rate / 100) * 20
        
        # Repeat client component (10%)
        repeat_score = min((self.repeat_client_rate / 100), 1.0) * 10
        
        # Dispute component (10%) - penalties for lost disputes
        if self.disputes_opened > 0:
            dispute_win_rate = self.disputes_won / self.disputes_opened
        else:
            dispute_win_rate = 1.0
        dispute_score = dispute_win_rate * 10
        
        # Calculate total
        total_jss = completion_score + rating_score + on_time_score + repeat_score + dispute_score
        
        return round(min(total_jss, 100), 1)

    def calculate_level(self) -> SellerLevel:
        """
        Calculate the seller's level based on performance metrics.
        Returns the highest level that meets all requirements.
        """
        # Check from highest to lowest level
        for level in [SellerLevel.PLATINUM, SellerLevel.GOLD, SellerLevel.SILVER, SellerLevel.BRONZE]:
            req = LEVEL_REQUIREMENTS[level]
            if (
                self.completed_orders >= req["min_orders"] and
                self.total_earnings >= req["min_earnings"] and
                self.average_rating >= req["min_rating"] and
                self.completion_rate >= req["min_completion_rate"] and
                self.response_rate >= req["min_response_rate"] and
                self.on_time_delivery_rate >= req["min_on_time_rate"] and
                self.months_active >= req["min_months_active"]
            ):
                return level
        
        return SellerLevel.NEW_SELLER

    def get_benefits(self) -> dict:
        """Get benefits for current level."""
        return LEVEL_BENEFITS.get(SellerLevel(self.level), LEVEL_BENEFITS[SellerLevel.NEW_SELLER])

    def get_progress_to_next_level(self) -> dict:
        """Get progress towards next level."""
        current_level = SellerLevel(self.level)
        
        # Define level order
        level_order = [SellerLevel.NEW_SELLER, SellerLevel.BRONZE, SellerLevel.SILVER, SellerLevel.GOLD, SellerLevel.PLATINUM]
        current_index = level_order.index(current_level)
        
        if current_index >= len(level_order) - 1:
            return {"next_level": None, "progress": {}}
        
        next_level = level_order[current_index + 1]
        req = LEVEL_REQUIREMENTS[next_level]
        
        progress = {
            "next_level": next_level.value,
            "requirements": {
                "orders": {
                    "current": self.completed_orders,
                    "required": req["min_orders"],
                    "progress": min(100, (self.completed_orders / req["min_orders"]) * 100) if req["min_orders"] > 0 else 100
                },
                "earnings": {
                    "current": self.total_earnings,
                    "required": req["min_earnings"],
                    "progress": min(100, (self.total_earnings / req["min_earnings"]) * 100) if req["min_earnings"] > 0 else 100
                },
                "rating": {
                    "current": self.average_rating,
                    "required": req["min_rating"],
                    "progress": min(100, (self.average_rating / req["min_rating"]) * 100) if req["min_rating"] > 0 else 100
                },
                "completion_rate": {
                    "current": self.completion_rate,
                    "required": req["min_completion_rate"],
                    "progress": min(100, (self.completion_rate / req["min_completion_rate"]) * 100) if req["min_completion_rate"] > 0 else 100
                },
                "response_rate": {
                    "current": self.response_rate,
                    "required": req["min_response_rate"],
                    "progress": min(100, (self.response_rate / req["min_response_rate"]) * 100) if req["min_response_rate"] > 0 else 100
                },
                "on_time_rate": {
                    "current": self.on_time_delivery_rate,
                    "required": req["min_on_time_rate"],
                    "progress": min(100, (self.on_time_delivery_rate / req["min_on_time_rate"]) * 100) if req["min_on_time_rate"] > 0 else 100
                },
                "months_active": {
                    "current": self.months_active,
                    "required": req["min_months_active"],
                    "progress": min(100, (self.months_active / req["min_months_active"]) * 100) if req["min_months_active"] > 0 else 100
                }
            }
        }
        
        return progress
