# @AI-HINT: Pydantic schemas for Category API validation and responses
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from typing import Optional, List
import logging
import re
logger = logging.getLogger(__name__)

class CategoryBase(BaseModel):
    """Base category schema with common fields"""
    name: str = Field(..., min_length=2, max_length=100, description="Category name")
    description: Optional[str] = Field(None, max_length=500, description="Category description")
    icon: Optional[str] = Field(None, max_length=50, description="Icon identifier")
    parent_id: Optional[int] = Field(None, description="Parent category ID for hierarchy")
    sort_order: int = Field(0, description="Display order")

class CategoryCreate(CategoryBase):
    """Schema for creating a new category"""
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        """Validate category name"""
        if not re.match(r'^[a-zA-Z0-9\s\-&]+$', v):
            raise ValueError("Category name can only contain letters, numbers, spaces, hyphens, and ampersands")
        return v.strip()

class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=50)
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class CategoryRead(CategoryBase):
    """Schema for reading a category (response)"""
    id: int
    slug: str
    is_active: bool
    project_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CategoryTree(CategoryRead):
    """Schema for category with children (hierarchical)"""
    children: List["CategoryTree"] = []

# Enable forward references
CategoryTree.model_rebuild()
