# @AI-HINT: Pydantic schemas for Tag API validation and responses
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional, Literal
import logging
import re
logger = logging.getLogger(__name__)

class TagBase(BaseModel):
    """Base tag schema with common fields"""
    name: str = Field(..., min_length=2, max_length=50, description="Tag name")
    type: Literal["skill", "priority", "location", "budget", "general"] = Field("general", description="Tag category")

class TagCreate(TagBase):
    """Schema for creating a new tag"""
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        """Validate tag name (alphanumeric, spaces, hyphens)"""
        if not re.match(r'^[a-zA-Z0-9\s\-+#.]+$', v):
            raise ValueError("Tag name can only contain letters, numbers, spaces, hyphens, and common symbols")
        return v.strip().lower()

class TagUpdate(BaseModel):
    """Schema for updating a tag"""
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    type: Optional[Literal["skill", "priority", "location", "budget", "general"]] = None

class TagRead(TagBase):
    """Schema for reading a tag (response)"""
    id: int
    slug: str
    usage_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TagWithProjects(TagRead):
    """Schema for tag with associated project count"""
    project_count: int
