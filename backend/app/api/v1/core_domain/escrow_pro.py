# @AI-HINT: API endpoints for advanced escrow system with Stripe integration
"""
Advanced Escrow API - Milestone-based payment management.

Endpoints for:
- Creating escrow accounts
- Funding milestones
- Releasing payments
- Handling disputes
- Refunds
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.advanced_escrow import get_escrow_service

router = APIRouter(prefix="/escrow", tags=["escrow"])


# Request/Response Models
class CreateEscrowRequest(BaseModel):
    contract_id: int
    amount: float = Field(..., gt=0)
    milestones: Optional[List[dict]] = None
    metadata: Optional[dict] = None


class FundMilestoneRequest(BaseModel):
    milestone_id: str
    payment_method_id: Optional[str] = None


class ReleaseMilestoneRequest(BaseModel):
    milestone_id: str
    release_notes: Optional[str] = None


class DisputeMilestoneRequest(BaseModel):
    milestone_id: str
    reason: str
    evidence: Optional[List[str]] = None


class RefundRequest(BaseModel):
    escrow_id: str
    amount: Optional[float] = None
    reason: str


class EscrowResponse(BaseModel):
    escrow_id: str
    status: str
    total_amount: float
    funded_amount: float
    released_amount: float
    milestones: List[dict]


# Endpoints
@router.post("/create", response_model=EscrowResponse)
async def create_escrow(
    request: CreateEscrowRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Create a new escrow account for a contract."""
    service = get_escrow_service()
    
    result = await service.create_escrow(
        client_id=current_user.id,
        contract_id=request.contract_id,
        amount=request.amount,
        milestones=request.milestones,
        metadata=request.metadata
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/{escrow_id}")
async def get_escrow(
    escrow_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get escrow details."""
    service = get_escrow_service()
    
    result = await service.get_escrow(escrow_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    # Verify user is part of the escrow
    if result["client_id"] != current_user.id and result.get("freelancer_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return result


@router.post("/{escrow_id}/fund")
async def fund_milestone(
    escrow_id: str,
    request: FundMilestoneRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Fund a milestone in the escrow."""
    service = get_escrow_service()
    
    result = await service.fund_milestone(
        escrow_id=escrow_id,
        milestone_id=request.milestone_id,
        payer_id=current_user.id,
        payment_method_id=request.payment_method_id
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{escrow_id}/release")
async def release_milestone(
    escrow_id: str,
    request: ReleaseMilestoneRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Release funds for a completed milestone."""
    service = get_escrow_service()
    
    result = await service.release_milestone(
        escrow_id=escrow_id,
        milestone_id=request.milestone_id,
        releaser_id=current_user.id,
        release_notes=request.release_notes
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{escrow_id}/dispute")
async def dispute_milestone(
    escrow_id: str,
    request: DisputeMilestoneRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Raise a dispute for a milestone."""
    service = get_escrow_service()
    
    result = await service.dispute_milestone(
        escrow_id=escrow_id,
        milestone_id=request.milestone_id,
        disputer_id=current_user.id,
        reason=request.reason,
        evidence=request.evidence
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{escrow_id}/refund")
async def request_refund(
    escrow_id: str,
    request: RefundRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Request a refund from escrow."""
    service = get_escrow_service()
    
    result = await service.process_refund(
        escrow_id=escrow_id,
        requester_id=current_user.id,
        amount=request.amount,
        reason=request.reason
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/{escrow_id}/balance")
async def get_escrow_balance(
    escrow_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get escrow balance breakdown."""
    service = get_escrow_service()
    
    result = await service.get_escrow_balance(escrow_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/{escrow_id}/transactions")
async def get_escrow_transactions(
    escrow_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get escrow transaction history."""
    service = get_escrow_service()
    
    escrow = await service.get_escrow(escrow_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")
    
    # Verify access
    if escrow["client_id"] != current_user.id and escrow.get("freelancer_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "escrow_id": escrow_id,
        "transactions": escrow.get("transactions", [])
    }


@router.get("/user/escrows")
async def get_user_escrows(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get all escrows for the current user."""
    service = get_escrow_service()
    
    result = await service.get_user_escrows(
        user_id=current_user.id,
        status=status
    )
    
    return result
