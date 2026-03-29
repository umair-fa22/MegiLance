# @AI-HINT: Contract Builder Standalone public API - build contracts/NDAs without auth
"""
Contract Builder Standalone API - AI-assisted legal document generator.
No authentication required. Generates NDAs, service agreements,
consulting contracts with clause library and risk analysis.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import contract_builder_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Contract Builder Standalone"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class ContractBuildRequest(BaseModel):
    contract_type: str = Field(default="freelance_service")
    # Parties
    party_a_name: str = Field(default="", max_length=200)
    party_a_role: str = Field(default="Client", max_length=100)
    party_a_address: str = Field(default="", max_length=500)
    party_a_email: str = Field(default="", max_length=200)
    party_b_name: str = Field(default="", max_length=200)
    party_b_role: str = Field(default="Contractor", max_length=100)
    party_b_address: str = Field(default="", max_length=500)
    party_b_email: str = Field(default="", max_length=200)
    # Terms
    start_date: str = Field(default="")
    end_date: str = Field(default="")
    auto_renew: bool = Field(default=False)
    jurisdiction: str = Field(default="us_federal")
    # Financial
    total_value: Optional[float] = Field(default=None, ge=0, le=999999999)
    currency: str = Field(default="USD", max_length=10)
    payment_schedule: str = Field(default="milestone")
    # Clauses
    selected_clauses: List[str] = Field(default_factory=list, max_length=30)
    # Scope
    scope_description: str = Field(default="", max_length=5000)
    deliverables: List[str] = Field(default_factory=list, max_length=20)
    revision_rounds: int = Field(default=2, ge=0, le=20)
    notice_period_days: int = Field(default=14, ge=1, le=365)
    warranty_days: int = Field(default=30, ge=0, le=365)
    # NDA specific
    nda_type: str = Field(default="mutual")
    confidentiality_period_months: int = Field(default=24, ge=1, le=120)
    # SLA specific
    uptime_percentage: float = Field(default=99.9, ge=0, le=100)
    support_hours: str = Field(default="business")


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/options")
async def get_contract_options():
    """
    Get all available contract builder options.

    **No authentication required** - public endpoint.
    Returns contract types, clause library, and jurisdictions.
    """
    return contract_builder_engine.get_options()


@router.get("/clauses/{contract_type}")
async def get_clauses(contract_type: str):
    """
    Get recommended and available clauses for a specific contract type.

    **No authentication required** - public endpoint.
    """
    clauses = contract_builder_engine.get_clauses_for_type(contract_type)
    if not clauses:
        return {"clauses": [], "message": "No specific clauses found. Try 'freelance_service' or 'nda'."}
    return {"clauses": clauses, "count": len(clauses)}


@router.post("/generate")
async def build_contract(request: ContractBuildRequest):
    """
    Generate a complete contract document with clauses and risk analysis.

    **No authentication required** - standalone public tool.
    Supports multiple contract types, clause library, jurisdiction-aware terms,
    completeness scoring, and risk analysis.
    """
    try:
        result = contract_builder_engine.build_contract(
            contract_type=request.contract_type,
            party_a_name=request.party_a_name,
            party_a_role=request.party_a_role,
            party_a_address=request.party_a_address,
            party_a_email=request.party_a_email,
            party_b_name=request.party_b_name,
            party_b_role=request.party_b_role,
            party_b_address=request.party_b_address,
            party_b_email=request.party_b_email,
            start_date=request.start_date,
            end_date=request.end_date,
            auto_renew=request.auto_renew,
            jurisdiction=request.jurisdiction,
            total_value=request.total_value,
            currency=request.currency,
            payment_schedule=request.payment_schedule,
            selected_clauses=request.selected_clauses,
            scope_description=request.scope_description,
            deliverables=request.deliverables,
            revision_rounds=request.revision_rounds,
            notice_period_days=request.notice_period_days,
            warranty_days=request.warranty_days,
            nda_type=request.nda_type,
            confidentiality_period_months=request.confidentiality_period_months,
            uptime_percentage=request.uptime_percentage,
            support_hours=request.support_hours,
        )
        return result

    except Exception:
        logger.error("Contract generation failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred generating your contract. Please try again."
        )
