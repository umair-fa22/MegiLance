# @AI-HINT: Freelance Income Calculator public API - income projections without auth
"""
Freelance Income Calculator API - Comprehensive income projections.
No authentication required. Calculates net income, taxes, effective rates,
savings goals, and provides financial health insights.
"""

import logging
from typing import Dict

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import income_calculator_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Income Calculator"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class IncomeCalculateRequest(BaseModel):
    # Income
    income_type: str = Field(default="hourly")
    rate: float = Field(default=0, ge=0, le=9999999)
    hours_per_week: float = Field(default=40, ge=1, le=168)
    weeks_per_year: float = Field(default=48, ge=1, le=52)
    days_per_week: float = Field(default=5, ge=1, le=7)
    projects_per_year: int = Field(default=6, ge=0, le=100)
    avg_project_value: float = Field(default=5000, ge=0, le=9999999)
    monthly_retainer: float = Field(default=0, ge=0, le=9999999)
    retainer_clients: int = Field(default=0, ge=0, le=50)
    additional_income: float = Field(default=0, ge=0, le=9999999)
    # Tax
    country: str = Field(default="us", max_length=50)
    state_tax_rate: float = Field(default=0, ge=0, le=30)
    # Expenses
    monthly_expenses: Dict[str, float] = Field(default_factory=dict)
    # Goals
    savings_goal_percent: float = Field(default=20, ge=0, le=100)
    emergency_fund_months: int = Field(default=6, ge=0, le=24)
    retirement_contribution_percent: float = Field(default=10, ge=0, le=100)
    # Time
    vacation_weeks: int = Field(default=4, ge=0, le=52)
    sick_days: int = Field(default=5, ge=0, le=365)


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/options")
async def get_calculator_options():
    """
    Get all available income calculator options.

    **No authentication required** - public endpoint.
    Returns countries with tax brackets, expense categories, income types.
    """
    return income_calculator_engine.get_options()


@router.post("/calculate")
async def calculate_income(request: IncomeCalculateRequest):
    """
    Calculate comprehensive freelance income projections.

    **No authentication required** - standalone public tool.
    Provides gross/net income, tax breakdown, effective hourly rate,
    savings projections, financial health score, and rate recommendations.
    """
    try:
        result = income_calculator_engine.calculate_income(
            income_type=request.income_type,
            rate=request.rate,
            hours_per_week=request.hours_per_week,
            weeks_per_year=request.weeks_per_year,
            days_per_week=request.days_per_week,
            projects_per_year=request.projects_per_year,
            avg_project_value=request.avg_project_value,
            monthly_retainer=request.monthly_retainer,
            retainer_clients=request.retainer_clients,
            additional_income=request.additional_income,
            country=request.country,
            state_tax_rate=request.state_tax_rate,
            monthly_expenses=request.monthly_expenses,
            savings_goal_percent=request.savings_goal_percent,
            emergency_fund_months=request.emergency_fund_months,
            retirement_contribution_percent=request.retirement_contribution_percent,
            vacation_weeks=request.vacation_weeks,
            sick_days=request.sick_days,
        )
        return result

    except Exception:
        logger.error("Income calculation failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred calculating your income. Please try again."
        )
