# @AI-HINT: Project Scope & Budget Planner public API - project planning without auth
"""
Scope Planner API - AI-assisted project scope & budget planning.
No authentication required. Generates milestone breakdowns, timelines,
resource plans, risk assessments, and budget estimates.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import scope_planner_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Scope Planner"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class TeamMemberRequest(BaseModel):
    role: str = Field(..., max_length=100)
    rate: Optional[float] = Field(default=None, ge=0, le=999999)
    hours_per_week: float = Field(default=40, ge=1, le=100)


class PhaseRequest(BaseModel):
    name: str = Field(..., max_length=200)
    percent: float = Field(..., ge=1, le=100)
    description: str = Field(default="", max_length=500)


class ScopePlanRequest(BaseModel):
    project_name: str = Field(default="Untitled Project", max_length=200)
    category: str = Field(default="web_app")
    description: str = Field(default="", max_length=5000)
    complexity: str = Field(default="moderate")
    # Timeline
    total_weeks: int = Field(default=12, ge=1, le=104)
    start_date: str = Field(default="")
    # Budget
    total_budget: Optional[float] = Field(default=None, ge=0, le=99999999)
    currency: str = Field(default="USD", max_length=10)
    hourly_rate: float = Field(default=75, ge=0, le=999999)
    # Team
    team_members: List[TeamMemberRequest] = Field(default_factory=list, max_length=20)
    # Custom phases
    custom_phases: Optional[List[PhaseRequest]] = Field(default=None, max_length=15)
    # Risk
    risk_buffer_percent: float = Field(default=15, ge=0, le=50)
    # Features & deliverables
    features: List[str] = Field(default_factory=list, max_length=30)
    deliverables: List[str] = Field(default_factory=list, max_length=20)


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/options")
async def get_planner_options():
    """
    Get all available scope planner options.

    **No authentication required** - public endpoint.
    Returns project categories, complexity levels, team roles, risk categories.
    """
    return scope_planner_engine.get_options()


@router.post("/plan")
async def plan_project(request: ScopePlanRequest):
    """
    Generate a comprehensive project scope & budget plan.

    **No authentication required** - standalone public tool.
    Provides phased timeline, budget estimates, resource allocation,
    risk assessment, feature mapping, and recommendations.
    """
    try:
        team = [
            {"role": m.role, "rate": m.rate, "hours_per_week": m.hours_per_week}
            for m in request.team_members
        ]

        phases = None
        if request.custom_phases:
            phases = [
                {"name": p.name, "percent": p.percent, "description": p.description}
                for p in request.custom_phases
            ]

        result = scope_planner_engine.plan_project(
            project_name=request.project_name,
            category=request.category,
            description=request.description,
            complexity=request.complexity,
            total_weeks=request.total_weeks,
            start_date=request.start_date,
            total_budget=request.total_budget,
            currency=request.currency,
            hourly_rate=request.hourly_rate,
            team_members=team,
            custom_phases=phases,
            risk_buffer_percent=request.risk_buffer_percent,
            features=request.features,
            deliverables=request.deliverables,
        )
        return result

    except Exception:
        logger.error("Scope planning failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred planning your project. Please try again."
        )
