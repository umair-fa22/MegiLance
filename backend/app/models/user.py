# @AI-HINT: User model - core user entity with roles (Client/Freelancer/Admin), profile, and auth fields
from sqlalchemy import String, Boolean, Integer, Float, DateTime, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import logging
import enum
logger = logging.getLogger(__name__)

class UserType(enum.Enum):
    """User type enumeration"""
    FREELANCER = "freelancer"
    CLIENT = "client"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(100), nullable=True)  # Optional granular name — see also: name field
    last_name: Mapped[str] = mapped_column(String(100), nullable=True)  # Optional granular name — see also: name field
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=True)  # Display name — may duplicate first_name+last_name; kept for frontend compat
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="client")  # Canonical auth field — use get_user_role() for access
    
    # Password reset fields
    password_reset_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_reset_expires: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_password_changed: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    user_type: Mapped[str] = mapped_column(String(20), nullable=True, index=True)  # Legacy display field — auth uses 'role'; synced via schema validator
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    skills: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string of skills
    hourly_rate: Mapped[float] = mapped_column(Float, nullable=True)
    profile_image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    profile_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Stored as JSON string for portability
    notification_preferences: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string for notification settings
    account_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    # created_by: removed — self-referencing FK never populated or used by any endpoint
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Seller-specific fields
    seller_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # new_seller, bronze, silver, gold, platinum
    tagline: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # Short professional tagline
    languages: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of languages spoken
    timezone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    availability_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # available, busy, away
    last_active_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Enhanced profile fields
    profile_slug: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)  # Shareable URL slug
    headline: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)  # Extended professional headline
    experience_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # entry, intermediate, expert
    years_of_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    education: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of education entries
    certifications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of certifications
    work_history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of work experience
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    twitter_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    dribbble_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    behance_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    stackoverflow_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    video_intro_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Video intro/pitch URL
    resume_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Resume/CV file URL
    availability_hours: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # full_time, part_time, contract
    preferred_project_size: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # small, medium, large, enterprise
    industry_focus: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of industries
    tools_and_technologies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of tools
    achievements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of achievements/awards
    testimonials_enabled: Mapped[Optional[bool]] = mapped_column(Boolean, default=True, nullable=True)
    contact_preferences: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON for contact method preferences
    profile_views: Mapped[Optional[int]] = mapped_column(Integer, default=0, nullable=True)
    profile_visibility: Mapped[Optional[str]] = mapped_column(String(20), default='public', nullable=True)  # public, private, unlisted
    
    # Relationships
    user_skills: Mapped[List["UserSkill"]] = relationship("UserSkill", foreign_keys="UserSkill.user_id", back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
    received_reviews: Mapped[List["Review"]] = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    sessions: Mapped[List["UserSession"]] = relationship("UserSession", back_populates="user")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")
    escrow_records: Mapped[List["Escrow"]] = relationship("Escrow", foreign_keys="Escrow.client_id", back_populates="client")
    time_entries: Mapped[List["TimeEntry"]] = relationship("TimeEntry", back_populates="user")
    invoices_sent: Mapped[List["Invoice"]] = relationship("Invoice", foreign_keys="Invoice.from_user_id", back_populates="from_user")
    invoices_received: Mapped[List["Invoice"]] = relationship("Invoice", foreign_keys="Invoice.to_user_id", back_populates="to_user")
    favorites: Mapped[List["Favorite"]] = relationship("Favorite", back_populates="user")
    support_tickets: Mapped[List["SupportTicket"]] = relationship("SupportTicket", foreign_keys="SupportTicket.user_id", back_populates="user")
    assigned_tickets: Mapped[List["SupportTicket"]] = relationship("SupportTicket", foreign_keys="SupportTicket.assigned_to", back_populates="assigned_user")
    refunds_requested: Mapped[List["Refund"]] = relationship("Refund", foreign_keys="Refund.requested_by", back_populates="requester")
    refunds_approved: Mapped[List["Refund"]] = relationship("Refund", foreign_keys="Refund.approved_by", back_populates="approver")
    
    # Gig marketplace relationships
    gigs: Mapped[List["Gig"]] = relationship("Gig", back_populates="seller")
    gig_orders_as_buyer: Mapped[List["GigOrder"]] = relationship("GigOrder", foreign_keys="GigOrder.buyer_id", back_populates="buyer")
    gig_orders_as_seller: Mapped[List["GigOrder"]] = relationship("GigOrder", foreign_keys="GigOrder.seller_id", back_populates="seller")
    gig_reviews_given: Mapped[List["GigReview"]] = relationship("GigReview", foreign_keys="GigReview.reviewer_id", back_populates="reviewer")
    gig_reviews_received: Mapped[List["GigReview"]] = relationship("GigReview", foreign_keys="GigReview.seller_id", back_populates="seller")
    seller_stats: Mapped[Optional["SellerStats"]] = relationship("SellerStats", back_populates="user", uselist=False)
    
    # Talent invitation relationships
    invitations_sent: Mapped[List["TalentInvitation"]] = relationship("TalentInvitation", foreign_keys="TalentInvitation.client_id", back_populates="client")
    invitations_received: Mapped[List["TalentInvitation"]] = relationship("TalentInvitation", foreign_keys="TalentInvitation.freelancer_id", back_populates="freelancer")