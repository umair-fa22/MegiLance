# @AI-HINT: Pydantic schemas for Portfolio API - item creation, update, and response models
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from datetime import datetime
import logging
import re
logger = logging.getLogger(__name__)

class PortfolioItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    image_url: Optional[str] = Field(None, max_length=500)
    project_url: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = Field(default_factory=list, max_length=20)

    @field_validator("project_url")
    @classmethod
    def validate_url(cls, v):
        if v and not re.match(r'^https?://', v):
            raise ValueError("project_url must start with http:// or https://")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v):
        if v:
            return [t[:50] for t in v[:20]]
        return v

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=5000)
    image_url: Optional[str] = Field(None, max_length=500)
    project_url: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = Field(None, max_length=20)

    @field_validator("project_url")
    @classmethod
    def validate_url(cls, v):
        if v and not re.match(r'^https?://', v):
            raise ValueError("project_url must start with http:// or https://")
        return v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v):
        if v:
            return [t[:50] for t in v[:20]]
        return v

class PortfolioItemRead(PortfolioItemBase):
    id: int
    freelancer_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)