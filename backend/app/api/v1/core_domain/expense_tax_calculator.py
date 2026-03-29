# @AI-HINT: Expense & Tax Calculator public API - self-employment tax planning without auth
"""
Expense & Tax Calculator API - Self-employment tax planning tool.
No authentication required. Calculates federal/state taxes, deductible expenses,
quarterly estimates, profit/loss, and provides tax-saving recommendations.
"""

import logging
from typing import Optional, Dict

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import expense_tax_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Expense Tax Calculator"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class ExpenseTaxRequest(BaseModel):
    # Income
    gross_income: float = Field(default=0, ge=0, le=99999999)
    other_income: float = Field(default=0, ge=0, le=99999999)
    # Region & filing
    region: str = Field(default="us", max_length=50)
    filing_status: str = Field(default="single")
    us_state: str = Field(default="none", max_length=50)
    custom_state_rate: float = Field(default=0, ge=0, le=30)
    # Expenses
    expenses: Dict[str, float] = Field(default_factory=dict)
    additional_deductions: float = Field(default=0, ge=0, le=99999999)
    use_standard_deduction: bool = Field(default=True)
    # Retirement
    retirement_contribution: float = Field(default=0, ge=0, le=99999999)
    # Health
    health_insurance_premium: float = Field(default=0, ge=0, le=99999999)
    # Quarterly
    taxes_already_paid: float = Field(default=0, ge=0, le=99999999)
    current_quarter: int = Field(default=1, ge=1, le=4)
    # YoY comparison
    previous_year_income: Optional[float] = Field(default=None, ge=0, le=99999999)


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/options")
async def get_tax_options():
    """
    Get all available expense & tax calculator options.

    **No authentication required** - public endpoint.
    Returns filing statuses, tax regions, deduction categories, US state taxes.
    """
    return expense_tax_engine.get_options()


@router.post("/calculate")
async def calculate_taxes(request: ExpenseTaxRequest):
    """
    Calculate comprehensive tax breakdown for self-employed individuals.

    **No authentication required** - standalone public tool.
    Provides income/expense analysis, progressive tax calculation,
    quarterly estimates, profit/loss statement, and tax-saving recommendations.
    """
    try:
        result = expense_tax_engine.calculate_taxes(
            gross_income=request.gross_income,
            other_income=request.other_income,
            region=request.region,
            filing_status=request.filing_status,
            us_state=request.us_state,
            custom_state_rate=request.custom_state_rate,
            expenses=request.expenses,
            additional_deductions=request.additional_deductions,
            use_standard_deduction=request.use_standard_deduction,
            retirement_contribution=request.retirement_contribution,
            health_insurance_premium=request.health_insurance_premium,
            taxes_already_paid=request.taxes_already_paid,
            current_quarter=request.current_quarter,
            previous_year_income=request.previous_year_income,
        )
        return result

    except Exception:
        logger.error("Tax calculation failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred calculating your taxes. Please try again."
        )
