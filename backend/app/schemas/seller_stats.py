# @AI-HINT: Pydantic schemas for Seller Stats and Tier system
"""Seller stats and tier system schemas."""

from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict
from datetime import datetime
from enum import Enum


class SellerLevelEnum(str, Enum):
    NEW_SELLER = "new_seller"
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class LevelRequirementProgress(BaseModel):
    """Progress towards a single level requirement."""
    current: float
    required: float
    progress: float  # 0-100 percentage


class LevelProgress(BaseModel):
    """Progress towards next seller level."""
    next_level: Optional[str]
    requirements: Optional[Dict[str, LevelRequirementProgress]]


class LevelBenefits(BaseModel):
    """Benefits for a seller level."""
    max_active_gigs: int
    featured_gigs: int
    custom_offers: bool
    priority_support: bool
    reduced_fees: int  # Percentage reduction
    badge: Optional[str]


class SellerStatsResponse(BaseModel):
    """Full seller stats response."""
    user_id: int
    
    # Current Level
    level: str
    level_achieved_at: datetime
    
    # Order Stats
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    active_orders: int
    pending_orders: int
    
    # Earnings
    total_earnings: float
    earnings_this_month: float
    earnings_last_month: float
    average_order_value: float
    
    # Ratings
    average_rating: float
    total_reviews: int
    five_star_reviews: int
    
    # Rating Breakdown
    communication_rating: float
    service_rating: float
    delivery_rating: float
    recommendation_rating: float
    
    # Response Metrics
    response_rate: float
    average_response_time_hours: float
    
    # Delivery Metrics
    on_time_delivery_rate: float
    completion_rate: float
    
    # Job Success Score
    job_success_score: float
    
    # Clients
    repeat_clients: int
    repeat_client_rate: float
    unique_clients: int
    
    # Gig Stats
    total_gigs: int
    active_gigs: int
    gig_impressions: int
    gig_clicks: int
    
    # Account
    member_since: datetime
    months_active: int
    
    # Verification
    identity_verified: bool
    payment_verified: bool
    skills_verified: bool
    
    # Level Progress
    level_benefits: LevelBenefits
    progress_to_next: LevelProgress

    model_config = ConfigDict(from_attributes=True)


class SellerStatsSummary(BaseModel):
    """Compact seller stats for profiles/cards."""
    level: str
    level_badge: Optional[str]
    average_rating: float
    total_reviews: int
    completed_orders: int
    on_time_delivery_rate: float
    response_rate: float
    job_success_score: float
    member_since: datetime
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)


class SellerLevelInfo(BaseModel):
    """Information about a seller level."""
    level: str
    display_name: str
    description: str
    requirements: Dict[str, float]
    benefits: LevelBenefits
    badge_color: str


class AllSellerLevelsResponse(BaseModel):
    """Response containing all level information."""
    levels: list[SellerLevelInfo]


class SellerLeaderboardEntry(BaseModel):
    """Entry in seller leaderboard."""
    rank: int
    user_id: int
    name: str
    profile_image_url: Optional[str]
    level: str
    average_rating: float
    total_reviews: int
    completed_orders: int
    job_success_score: float
    earnings_this_month: float
    top_category: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class SellerLeaderboardResponse(BaseModel):
    """Seller leaderboard response."""
    period: str  # "all_time", "monthly", "weekly"
    category: Optional[str]
    entries: list[SellerLeaderboardEntry]
    total: int
