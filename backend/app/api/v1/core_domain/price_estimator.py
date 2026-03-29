# @AI-HINT: General-purpose AI Price Estimator API - public endpoints for any user, any industry
"""
AI Price Estimator API - General-purpose pricing intelligence.
Public endpoints (no auth required) so any user can estimate costs.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import price_estimator_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Price Estimator"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class PriceEstimateRequest(BaseModel):
    """General-purpose price estimation request."""
    category: str = Field(..., description="Service category (e.g. software_development, design_creative)")
    service_type: str = Field(..., description="Specific service (e.g. web_application, logo_branding)")
    experience_level: str = Field(default="mid", description="junior, mid, senior, or expert")
    region: str = Field(default="global_remote", description="Geographic region for pricing (legacy fallback)")
    urgency: str = Field(default="standard", description="critical, urgent, standard, relaxed, ongoing")
    quality_tier: str = Field(default="standard", description="budget, standard, premium, enterprise")
    scope: str = Field(default="medium", description="minimal, small, medium, large, enterprise")
    estimated_hours: Optional[int] = Field(None, ge=1, le=10000, description="Custom hour estimate")
    description: Optional[str] = Field(default="", max_length=5000, description="Project description for better accuracy")
    features: Optional[List[str]] = Field(None, max_length=50, description="List of features/deliverables")
    team_size: int = Field(default=1, ge=1, le=50, description="Team size")
    client_country: Optional[str] = Field(None, min_length=2, max_length=2, description="Client ISO country code (e.g. US, PK, IN)")
    freelancer_country: Optional[str] = Field(None, min_length=2, max_length=2, description="Freelancer ISO country code (e.g. PK, IN, PH)")


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/categories")
async def get_estimation_categories():
    """
    Get all available categories and service types for price estimation.
    
    **No authentication required** - public endpoint for general use.
    Returns categories with their service types, average rates, and demand levels.
    """
    return {
        "categories": price_estimator_engine.get_categories(),
        "regions": price_estimator_engine.get_regions(),
        "countries": price_estimator_engine.get_countries(),
        "experience_levels": ["junior", "mid", "senior", "expert"],
        "urgency_options": ["critical", "urgent", "standard", "relaxed", "ongoing"],
        "quality_tiers": ["budget", "standard", "premium", "enterprise"],
        "scope_options": ["minimal", "small", "medium", "large", "enterprise"],
    }


@router.get("/hours-questions/{category}")
async def get_hours_questions(category: str):
    """
    Get smart complexity questions to help users estimate project hours.

    **No authentication required** — returns category-specific questions
    about project features, complexity, and scope that feed into the
    hours estimation calculator.
    """
    questions = price_estimator_engine.get_hours_questions(category)
    return {"category": category, "questions": questions}


class SmartHoursRequest(BaseModel):
    """Request body for smart hours estimation."""
    category: str
    service_type: str = ""
    scope: str = "medium"
    answers: dict = Field(default_factory=dict, description="Map of question_id → selected option value")
    features: Optional[List[str]] = None


@router.post("/estimate-hours")
async def estimate_hours(request: SmartHoursRequest):
    """
    Calculate estimated hours from complexity-question answers.

    **No authentication required** — returns total hours, per-question
    breakdown, confidence level, and a low/high range.
    """
    try:
        result = price_estimator_engine.calculate_smart_hours(
            category=request.category,
            service_type=request.service_type,
            scope=request.scope,
            answers=request.answers,
            features=request.features,
        )
        return result
    except Exception:
        logger.error("Hours estimation failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred estimating hours. Please try again.",
        )


@router.post("/estimate")
async def estimate_price(request: PriceEstimateRequest):
    """
    Generate a comprehensive AI-powered price estimate.
    
    **No authentication required** - general-purpose pricing tool.
    
    Analyzes service type, experience level, region, urgency, quality,
    scope, and market demand to produce accurate price ranges with
    detailed breakdowns, market comparisons, and ROI insights.
    """
    try:
        result = price_estimator_engine.estimate_price(
            category=request.category,
            service_type=request.service_type,
            experience_level=request.experience_level,
            region=request.region,
            urgency=request.urgency,
            quality_tier=request.quality_tier,
            scope=request.scope,
            estimated_hours=request.estimated_hours,
            description=request.description or "",
            features=request.features,
            team_size=request.team_size,
            client_country=request.client_country,
            freelancer_country=request.freelancer_country,
        )

        # Augment with platform market data if available
        try:
            platform_data = price_estimator_engine.get_platform_market_data(
                request.category, request.service_type
            )
            result["platform_data"] = platform_data
        except Exception:
            result["platform_data"] = None

        return result

    except Exception:
        logger.error("Price estimation failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred processing your price estimate. Please try again."
        )


@router.post("/compare")
async def compare_estimates(requests: List[PriceEstimateRequest]):
    """
    Compare multiple price estimates side by side.
    
    **No authentication required** - compare different approaches/options.
    Send 2-5 estimation requests to compare costs across different
    configurations (e.g., junior vs senior, different regions, etc.)
    """
    if len(requests) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 estimates to compare")
    if len(requests) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 estimates for comparison")

    try:
        estimates = []
        for req in requests:
            result = price_estimator_engine.estimate_price(
                category=req.category,
                service_type=req.service_type,
                experience_level=req.experience_level,
                region=req.region,
                urgency=req.urgency,
                quality_tier=req.quality_tier,
                scope=req.scope,
                estimated_hours=req.estimated_hours,
                description=req.description or "",
                features=req.features,
                team_size=req.team_size,
                client_country=req.client_country,
                freelancer_country=req.freelancer_country,
            )
            estimates.append(result)

        # Build comparison summary
        totals = [e["estimate"]["total_estimate"] for e in estimates]
        cheapest_idx = totals.index(min(totals))
        most_expensive_idx = totals.index(max(totals))
        savings = max(totals) - min(totals)

        return {
            "estimates": estimates,
            "comparison": {
                "cheapest_option": cheapest_idx,
                "most_expensive_option": most_expensive_idx,
                "price_range": {
                    "min": min(totals),
                    "max": max(totals),
                },
                "potential_savings": round(savings, 2),
                "savings_percentage": round((savings / max(totals)) * 100, 1) if max(totals) > 0 else 0,
            }
        }
    except Exception:
        logger.error("Price comparison failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred comparing estimates. Please try again."
        )
