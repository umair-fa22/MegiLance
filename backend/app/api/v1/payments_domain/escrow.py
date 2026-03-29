# @AI-HINT: Escrow API endpoints - Turso HTTP only (NO SQLite fallback)
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.core.security import get_current_user
from app.models import User
from app.schemas.escrow import (
    EscrowCreate, EscrowUpdate, EscrowRead,
    EscrowRelease, EscrowRefund, EscrowBalance
)
from app.services import escrow_service
from app.services.db_utils import get_user_role

router = APIRouter(prefix="/escrow", tags=["escrow"])


@router.post("/", response_model=EscrowRead, status_code=status.HTTP_201_CREATED)
async def create_escrow(
    escrow: EscrowCreate,
    current_user: User = Depends(get_current_user)
):
    """Fund escrow for a contract. Clients fund escrow to secure payment."""
    contract = escrow_service.get_contract_parties(escrow.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the contract client can fund escrow")

    balance = escrow_service.get_user_balance(current_user.id)
    if balance < escrow.amount:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: ${balance:.2f}")

    expires_at = escrow.expires_at.isoformat() if escrow.expires_at else None
    result = escrow_service.create_escrow(
        escrow.contract_id, current_user.id, escrow.amount, expires_at, escrow.notes
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to retrieve created escrow")
    return result


@router.get("/", response_model=List[EscrowRead])
async def list_escrow(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """List escrow records. Clients see escrow they funded, freelancers see escrow for their contracts."""
    user_role = get_user_role(current_user)

    return escrow_service.list_escrows(current_user.id, user_role, contract_id, status_filter, limit, offset)


@router.get("/balance", response_model=EscrowBalance)
async def get_escrow_balance(
    contract_id: int = Query(..., description="Contract ID for balance check"),
    current_user: User = Depends(get_current_user)
):
    """Check escrow balance for a contract."""
    contract = escrow_service.get_contract_parties(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    user_role = get_user_role(current_user)

    if user_role == "client" and contract["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif user_role == "freelancer" and contract.get("freelancer_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    data = escrow_service.get_escrow_balance_data(contract_id)
    return EscrowBalance(contract_id=contract_id, **data)


@router.post("/{escrow_id}/release", response_model=EscrowRead)
async def release_escrow(
    escrow_id: int,
    release_data: EscrowRelease,
    current_user: User = Depends(get_current_user)
):
    """Release escrow funds to freelancer."""
    escrow = escrow_service.get_escrow_core(escrow_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    if escrow["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the client can release escrow")
    if escrow["status"] != "active":
        raise HTTPException(status_code=400, detail=f"Cannot release escrow with status: {escrow['status']}")

    available = escrow["amount"] - escrow["released_amount"]
    if release_data.amount > available:
        raise HTTPException(status_code=400, detail=f"Insufficient escrow balance. Available: ${available:.2f}")

    freelancer_id = escrow_service.get_freelancer_id_for_contract(escrow["contract_id"])
    if freelancer_id is None:
        raise HTTPException(status_code=404, detail="Contract not found")

    escrow_service.release_escrow_funds(
        escrow_id, release_data.amount, freelancer_id,
        escrow["released_amount"], escrow["amount"]
    )
    return await get_escrow(escrow_id, current_user)


@router.post("/{escrow_id}/refund", response_model=EscrowRead)
async def refund_escrow(
    escrow_id: int,
    refund_data: EscrowRefund,
    current_user: User = Depends(get_current_user)
):
    """Refund escrow to client. Admin or client can refund."""
    escrow = escrow_service.get_escrow_core(escrow_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    user_role = get_user_role(current_user)

    if user_role != "admin" and escrow["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if escrow["status"] not in ["active", "expired"]:
        raise HTTPException(status_code=400, detail=f"Cannot refund escrow with status: {escrow['status']}")

    available = escrow["amount"] - escrow["released_amount"]
    if refund_data.amount > available:
        raise HTTPException(status_code=400, detail=f"Insufficient escrow balance for refund. Available: ${available:.2f}")

    escrow_service.refund_escrow_funds(
        escrow_id, refund_data.amount, escrow["client_id"], escrow["released_amount"]
    )
    return await get_escrow(escrow_id, current_user)


@router.get("/{escrow_id}", response_model=EscrowRead)
async def get_escrow(
    escrow_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get escrow details by ID"""
    escrow = escrow_service.get_escrow_by_id(escrow_id)
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found")

    freelancer_id = escrow_service.get_freelancer_id_for_contract(escrow["contract_id"])

    user_role = get_user_role(current_user)

    if escrow["client_id"] != current_user.id and freelancer_id != current_user.id:
        if user_role != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    return escrow


@router.patch("/{escrow_id}", response_model=EscrowRead)
async def update_escrow(
    escrow_id: int,
    update_data: EscrowUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update escrow details. Only client can update active escrow."""
    ownership = escrow_service.get_escrow_ownership(escrow_id)
    if not ownership:
        raise HTTPException(status_code=404, detail="Escrow not found")

    if ownership["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if ownership["status"] != "active":
        raise HTTPException(status_code=400, detail="Only active escrow can be updated")

    update_dict = update_data.model_dump(exclude_unset=True)
    if update_dict:
        escrow_service.update_escrow_fields(escrow_id, update_dict)

    return await get_escrow(escrow_id, current_user)
