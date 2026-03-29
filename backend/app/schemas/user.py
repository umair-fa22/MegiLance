# @AI-HINT: Pydantic schemas for User API - registration, profile update, and response models
from datetime import datetime
from typing import Optional, List
import logging
import json
logger = logging.getLogger(__name__)

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class PortfolioItemSchema(BaseModel):
    title: str
    description: str
    url: Optional[str] = None
    imageUrl: Optional[str] = None
    tags: List[str] = []


class ProfileCompleteUpdate(BaseModel):
    """Schema for completing user profile during onboarding"""
    # Basic Info
    firstName: str
    lastName: str
    title: str
    bio: str
    location: Optional[str] = None
    timezone: str = "Asia/Karachi"
    
    # Professional Info
    skills: List[str]
    hourlyRate: str
    experienceLevel: str
    availability: str
    languages: List[str] = ["English"]
    
    # Portfolio
    portfolioItems: List[PortfolioItemSchema] = []
    
    # Verification
    phoneNumber: Optional[str] = None
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    websiteUrl: Optional[str] = None


class UserBase(BaseModel):
    is_active: bool = True
    name: Optional[str] = None
    user_type: Optional[str] = Field(default=None, description="Freelancer, Client, Admin")
    bio: Optional[str] = None
    skills: Optional[List[str] | str] = None  # Can be list or JSON string

    @field_validator('skills', mode='before')
    @classmethod
    def normalize_skills(cls, v):
        """Accept list or comma/JSON string, always return List[str] or None"""
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if v.startswith('['):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(s) for s in parsed]
                except (json.JSONDecodeError, ValueError):
                    pass
            return [s.strip() for s in v.split(',') if s.strip()]
        return v
    hourly_rate: Optional[float] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None
    title: Optional[str] = None
    portfolio_url: Optional[str] = None


class UserCreate(UserBase):
    email: EmailStr
    password: str
    role: Optional[str] = None  # Alias for user_type from frontend
    tos_accepted: bool = Field(default=False, description="User must accept Terms of Service")
    
    @model_validator(mode='before')
    @classmethod
    def map_role_to_user_type(cls, data):
        """Handle frontend 'role' field mapping to 'user_type'"""
        if isinstance(data, dict) and 'role' in data and 'user_type' not in data:
            data['user_type'] = data.pop('role')
        return data


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8)
    is_active: Optional[bool] = None
    name: Optional[str] = None
    user_type: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str] | str] = None
    hourly_rate: Optional[float] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None
    title: Optional[str] = None
    portfolio_url: Optional[str] = None
    full_name: Optional[str] = None # Alias for name
    availability_status: Optional[str] = Field(default=None, description="available, busy, or away")
    # Enhanced profile fields
    tagline: Optional[str] = Field(default=None, max_length=200)
    headline: Optional[str] = Field(default=None, max_length=300)
    experience_level: Optional[str] = None
    years_of_experience: Optional[int] = Field(default=None, ge=0, le=50)
    languages: Optional[List[str] | str] = None
    timezone: Optional[str] = None
    education: Optional[List[dict]] = None  # [{degree, institution, year, field}]
    certifications: Optional[List[dict]] = None  # [{name, issuer, year, url}]
    work_history: Optional[List[dict]] = None  # [{company, role, duration, description}]
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    twitter_url: Optional[str] = None
    dribbble_url: Optional[str] = None
    behance_url: Optional[str] = None
    stackoverflow_url: Optional[str] = None
    phone_number: Optional[str] = None
    video_intro_url: Optional[str] = None
    resume_url: Optional[str] = None
    availability_hours: Optional[str] = None  # full_time, part_time, contract
    preferred_project_size: Optional[str] = None  # small, medium, large, enterprise
    industry_focus: Optional[List[str]] = None
    tools_and_technologies: Optional[List[str]] = None
    achievements: Optional[List[dict]] = None  # [{title, description, year}]
    testimonials_enabled: Optional[bool] = None
    profile_visibility: Optional[str] = None  # public, private, unlisted

    @field_validator('skills', mode='before')
    @classmethod
    def normalize_skills(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if v.startswith('['):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return [str(s) for s in parsed]
                except (json.JSONDecodeError, ValueError):
                    pass
            return [s.strip() for s in v.split(',') if s.strip()]
        return v

    @field_validator('availability_status')
    @classmethod
    def validate_availability(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ('available', 'busy', 'away'):
            raise ValueError("availability_status must be 'available', 'busy', or 'away'")
        return v

    @field_validator('experience_level')
    @classmethod
    def validate_experience_level(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ('entry', 'intermediate', 'expert', 'junior', 'mid', 'senior'):
            raise ValueError("experience_level must be entry, intermediate, expert, junior, mid, or senior")
        return v

    @field_validator('availability_hours')
    @classmethod
    def validate_availability_hours(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ('full_time', 'part_time', 'contract', 'hourly', 'not_available'):
            raise ValueError("availability_hours must be full_time, part_time, contract, hourly, or not_available")
        return v

    @field_validator('preferred_project_size')
    @classmethod
    def validate_project_size(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ('small', 'medium', 'large', 'enterprise'):
            raise ValueError("preferred_project_size must be small, medium, large, or enterprise")
        return v

    @field_validator('profile_visibility')
    @classmethod
    def validate_profile_visibility(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ('public', 'private', 'unlisted'):
            raise ValueError("profile_visibility must be public, private, or unlisted")
        return v


class UserRead(UserBase):
    id: int
    email: EmailStr
    role: Optional[str] = None
    joined_at: Optional[datetime] = None
    full_name: Optional[str] = None # Alias for name
    availability_status: Optional[str] = None
    # Enhanced profile fields
    tagline: Optional[str] = None
    headline: Optional[str] = None
    experience_level: Optional[str] = None
    years_of_experience: Optional[int] = None
    languages: Optional[List[str] | str] = None
    timezone: Optional[str] = None
    education: Optional[List[dict]] = None
    certifications: Optional[List[dict]] = None
    work_history: Optional[List[dict]] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    website_url: Optional[str] = None
    twitter_url: Optional[str] = None
    dribbble_url: Optional[str] = None
    behance_url: Optional[str] = None
    stackoverflow_url: Optional[str] = None
    phone_number: Optional[str] = None
    video_intro_url: Optional[str] = None
    resume_url: Optional[str] = None
    availability_hours: Optional[str] = None
    preferred_project_size: Optional[str] = None
    industry_focus: Optional[List[str]] = None
    tools_and_technologies: Optional[List[str]] = None
    achievements: Optional[List[dict]] = None
    testimonials_enabled: Optional[bool] = None
    profile_slug: Optional[str] = None
    profile_visibility: Optional[str] = None
    profile_views: Optional[int] = None
    seller_level: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
