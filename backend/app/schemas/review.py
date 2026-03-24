# @AI-HINT: Pydantic schemas for Review API - rating submission and response models
"""Review schemas for MegiLance platform"""
import logging
import re
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
logger = logging.getLogger(__name__)

# XSS sanitization pattern — matches script tags, javascript: URIs, and event handlers
SCRIPT_PATTERN = re.compile(r'(<script[^>]*>.*?</script>|javascript:\s*|on\w+\s*=)', re.IGNORECASE | re.DOTALL)


class ReviewBase(BaseModel):
    """Base review schema"""
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: Optional[str] = None
    rating_breakdown: Optional[Dict[str, float]] = None
    is_public: bool = True

    @field_validator('rating')
    @classmethod
    def validate_rating(cls, v):
        if v < 1.0 or v > 5.0:
            raise ValueError('Rating must be between 1.0 and 5.0')
        return round(v, 1)


class ReviewCreate(ReviewBase):
    """Schema for creating a review"""
    contract_id: int
    reviewee_id: int


class ReviewUpdate(BaseModel):
    """Schema for updating a review"""
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    comment: Optional[str] = None
    rating_breakdown: Optional[Dict[str, float]] = None
    is_public: Optional[bool] = None


class Review(ReviewBase):
    """Schema for review response"""
    id: int
    contract_id: int
    reviewer_id: int
    reviewee_id: int
    created_at: datetime
    updated_at: datetime
    response_to: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewStats(BaseModel):
    """Schema for review statistics"""
    average_rating: float
    total_reviews: int
    rating_distribution: Dict[str, int]  # {5: 10, 4: 5, 3: 2, 2: 1, 1: 0}


# --- API-facing schemas (match endpoint field names) ---

class ReviewCreateRequest(BaseModel):
    """API request schema for creating a review (uses endpoint field names)"""
    contract_id: int
    reviewed_user_id: int
    rating: float = Field(default=5.0, ge=1.0, le=5.0)
    review_text: Optional[str] = Field(None, min_length=20, max_length=2000)
    communication_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    quality_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    professionalism_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    deadline_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    is_public: bool = True

    @field_validator('review_text')
    @classmethod
    def sanitize_review_text(cls, v):
        if v is not None:
            v = SCRIPT_PATTERN.sub('', v).strip()
        return v


class ReviewUpdateRequest(BaseModel):
    """API request schema for updating a review"""
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    review_text: Optional[str] = Field(None, min_length=20, max_length=2000)
    communication_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    quality_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    professionalism_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    deadline_rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    is_public: Optional[bool] = None

    @field_validator('review_text')
    @classmethod
    def sanitize_review_text(cls, v):
        if v is not None:
            v = SCRIPT_PATTERN.sub('', v).strip()
        return v
