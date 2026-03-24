# @AI-HINT: Pydantic schemas for Project API - creation, update, search, and response models
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from datetime import datetime
import logging
import json
logger = logging.getLogger(__name__)

class ProjectBase(BaseModel):
    title: str
    description: str
    category: str
    budget_type: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    experience_level: str
    estimated_duration: str
    skills: List[str]
    status: Optional[str] = "open"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    budget_type: Optional[str] = None
    experience_level: Optional[str] = None
    estimated_duration: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[str] = None

class ProjectRead(ProjectBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: datetime
    proposal_count: Optional[int] = 0

    @field_validator('skills', mode='before')
    @classmethod
    def parse_skills(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                # If it's a comma-separated string
                return [s.strip() for s in v.split(',') if s.strip()]
        return v

    model_config = ConfigDict(from_attributes=True)