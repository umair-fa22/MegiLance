# @AI-HINT: AI Skill Analyzer public API - skill gap analysis and career recommendations
"""
Skill Analyzer API - AI-powered skill market analysis.
No authentication required. Analyzes freelancer skills against 2025 market demand.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import skill_analyzer_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Skill Analyzer"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class SkillAnalysisRequest(BaseModel):
    skills: List[str] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="List of skill keys or labels"
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
    target_role: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Target role the freelancer is aiming for"
    )


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/skills")
async def get_available_skills():
    """
    Get all analyzable skills grouped by category.

    **No authentication required** - public endpoint.
    Returns skill keys, labels, demand scores, and trends.
    """
    return skill_analyzer_engine.get_available_skills()


@router.post("/analyze")
async def analyze_skills(request: SkillAnalysisRequest):
    """
    Analyze freelancer skills against 2025 market demand.

    **No authentication required** - standalone public tool.
    Returns per-skill scores, synergies, skill gaps, recommendations,
    rate estimate, and regional competitiveness.
    """
    try:
        result = skill_analyzer_engine.analyze_skills(
            user_skills=request.skills,
            experience_level=request.experience_level,
            country_code=request.country_code.upper() if request.country_code else None,
            target_role=request.target_role,
        )
        return result
    except Exception:
        logger.error("Skill analysis failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred analyzing skills. Please try again."
        )
