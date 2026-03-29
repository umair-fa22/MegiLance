# @AI-HINT: Pydantic schemas for external project listings - request/response models
# Used by the external projects API endpoints for serialization and validation

from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
import logging
import json
logger = logging.getLogger(__name__)


class ExternalProjectBase(BaseModel):
    """Base schema for external project data"""
    title: str
    company: str
    company_logo: Optional[str] = None
    description: str
    description_plain: Optional[str] = None
    category: str = "Other"
    tags: List[str] = []
    project_type: str = "remote"
    experience_level: str = "any"
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: str = "USD"
    budget_period: str = "fixed"
    location: str = "Remote"
    geo: Optional[str] = None
    source: str
    source_url: str
    apply_url: str


class ExternalProjectRead(ExternalProjectBase):
    """Response schema for reading an external project"""
    id: int
    source_id: str
    trust_score: float = 0.5
    is_verified: bool = False
    is_flagged: bool = False
    posted_at: Optional[datetime] = None
    scraped_at: datetime
    views_count: int = 0
    clicks_count: int = 0
    saves_count: int = 0

    @classmethod
    def parse_tags(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [s.strip() for s in v.split(',') if s.strip()]
        return v if v else []

    model_config = ConfigDict(from_attributes=True)


class ExternalProjectList(BaseModel):
    """Paginated list of external projects"""
    projects: List[ExternalProjectRead]
    total: int
    page: int
    page_size: int
    has_more: bool
    sources: List[str] = []
    last_scraped: Optional[datetime] = None


class ExternalProjectSearchParams(BaseModel):
    """Search/filter parameters for external projects"""
    query: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    project_type: Optional[str] = None  # remote, hybrid, onsite
    experience_level: Optional[str] = None
    min_budget: Optional[float] = None
    max_budget: Optional[float] = None
    location: Optional[str] = None
    source: Optional[str] = None  # remoteok, jobicy, arbeitnow
    sort_by: str = "posted_at"  # posted_at, budget_max, trust_score
    sort_order: str = "desc"
    page: int = 1
    page_size: int = 20


class ScrapeStatusResponse(BaseModel):
    """Response for scrape status endpoint"""
    status: str  # running, completed, failed
    projects_scraped: int = 0
    projects_added: int = 0
    projects_updated: int = 0
    projects_flagged: int = 0
    sources_scraped: List[str] = []
    errors: List[str] = []
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ExternalProjectStats(BaseModel):
    """Statistics about external project listings"""
    total_projects: int = 0
    verified_projects: int = 0
    flagged_projects: int = 0
    by_source: dict = {}
    by_category: dict = {}
    avg_trust_score: float = 0.0
    last_scrape_time: Optional[datetime] = None
