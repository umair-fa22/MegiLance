# @AI-HINT: AI Proposal Writer public API - generates winning freelancer proposals
"""
Proposal Writer API - AI-powered proposal generator for freelancers.
No authentication required. Generates customized proposals with market-data-backed pricing.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import proposal_writer_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Proposal Writer"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class ProposalRequest(BaseModel):
    project_title: str = Field(
        ...,
        max_length=300,
        description="Title of the project to write a proposal for"
    )
    project_description: str = Field(
        ...,
        max_length=5000,
        description="Full project description from the client"
    )
    freelancer_skills: List[str] = Field(
        ...,
        min_length=1,
        max_length=15,
        description="Freelancer's relevant skills"
    )
    experience_level: str = Field(
        default="mid",
        description="junior | mid | senior | expert"
    )
    tone: str = Field(
        default="professional",
        description="professional | friendly | confident | formal"
    )
    length: str = Field(
        default="standard",
        description="concise | standard | detailed"
    )
    freelancer_name: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Freelancer's name for proposal signature"
    )
    years_experience: Optional[int] = Field(
        default=None,
        ge=0,
        le=50,
        description="Years of professional experience"
    )
    highlight_points: Optional[List[str]] = Field(
        default=None,
        max_length=5,
        description="Key achievements or selling points to highlight"
    )
    proposed_rate: Optional[float] = Field(
        default=None,
        ge=1,
        le=999999,
        description="Proposed hourly rate in USD"
    )
    proposed_timeline: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Proposed timeline (e.g. '2-4 weeks')"
    )
    country_code: Optional[str] = Field(
        default=None,
        max_length=3,
        description="ISO country code for rate localization"
    )


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/options")
async def get_proposal_options():
    """
    Get proposal writer form options.

    **No authentication required** - public endpoint.
    Returns available tones, lengths, and configuration limits.
    """
    return proposal_writer_engine.get_proposal_options()


@router.post("/generate")
async def generate_proposal(request: ProposalRequest):
    """
    Generate a winning proposal for a project.

    **No authentication required** - standalone public tool.
    Returns full proposal text, skill match analysis, suggested rate,
    proposal score, and improvement tips.
    """
    try:
        result = await proposal_writer_engine.generate_proposal(
            project_title=request.project_title,
            project_description=request.project_description,
            freelancer_skills=request.freelancer_skills,
            experience_level=request.experience_level,
            tone=request.tone,
            length=request.length,
            freelancer_name=request.freelancer_name,
            years_experience=request.years_experience,
            highlight_points=request.highlight_points,
            proposed_rate=request.proposed_rate,
            proposed_timeline=request.proposed_timeline,
            country_code=request.country_code.upper() if request.country_code else None,
        )
        return result
    except Exception:
        logger.error("Proposal generation failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred generating your proposal. Please try again."
        )
