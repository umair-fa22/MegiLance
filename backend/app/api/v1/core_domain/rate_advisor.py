# @AI-HINT: AI Rate Advisor public API - personalized freelancer rate recommendations
"""
Rate Advisor API - AI-powered rate recommendations for freelancers.
No authentication required. Suggests competitive rates based on skills, location, experience.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import rate_advisor_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Rate Advisor"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class RateAdviceRequest(BaseModel):
    service_type: str = Field(
        ...,
        max_length=100,
        description="Primary service type (e.g. web_application, ai_ml_solution)"
    )
    experience_level: str = Field(
        default="mid",
        description="junior | mid | senior | expert"
    )
    country_code: Optional[str] = Field(
        default=None,
        max_length=3,
        description="ISO country code (e.g. PK, US, IN)"
    )
    city: Optional[str] = Field(
        default=None,
        max_length=100,
        description="City name for city-level rate data"
    )
    portfolio_strength: str = Field(
        default="basic",
        description="none | basic | strong | exceptional"
    )
    target_platform: str = Field(
        default="upwork",
        description="upwork | fiverr | toptal | direct | freelancer"
    )
    weekly_hours: int = Field(
        default=40,
        ge=5,
        le=80,
        description="Hours per week available for freelance work"
    )
    skills: Optional[List[str]] = Field(
        default=None,
        max_length=15,
        description="Specific skills for rate refinement"
    )


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/options")
async def get_rate_options():
    """
    Get all rate advisor form options.

    **No authentication required** - public endpoint.
    Returns experience levels, platforms, service types, countries.
    """
    return rate_advisor_engine.get_rate_options()


@router.post("/advise")
async def advise_rate(request: RateAdviceRequest):
    """
    Generate personalized rate recommendation.

    **No authentication required** - standalone public tool.
    Returns recommended rates, income projections, platform comparison,
    market benchmarks, and negotiation tips.
    """
    try:
        result = rate_advisor_engine.advise_rate(
            service_type=request.service_type,
            experience_level=request.experience_level,
            country_code=request.country_code.upper() if request.country_code else None,
            city=request.city,
            portfolio_strength=request.portfolio_strength,
            target_platform=request.target_platform,
            weekly_hours=request.weekly_hours,
            skills=request.skills,
        )
        return result
    except Exception:
        logger.error("Rate advice failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred generating rate advice. Please try again."
        )
