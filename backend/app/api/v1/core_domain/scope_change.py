# @AI-HINT: Scope change request API - contract modification proposals between client and freelancer
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Any

from app.db.turso_http import execute_query, parse_rows
from app.services.scope_change_service import ScopeChangeService
from app.schemas.scope_change import ScopeChangeCreate, ScopeChangeResponse, ScopeChangeStatus
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=ScopeChangeResponse, status_code=status.HTTP_201_CREATED)
async def create_scope_change_request(
    request: ScopeChangeCreate,
    current_user: Any = Depends(get_current_user)
):
    """Create a new scope change request for a contract."""
    return await ScopeChangeService.create_request(request, current_user.id)

@router.get("/{request_id}", response_model=ScopeChangeResponse)
async def get_scope_change_request(
    request_id: int,
    current_user: Any = Depends(get_current_user)
):
    """Get details of a specific scope change request."""
    request = await ScopeChangeService.get_request(request_id)
    # Verify user is part of the contract
    result = execute_query(
        "SELECT client_id, freelancer_id FROM contracts WHERE id = ?",
        [request["contract_id"]]
    )
    contracts = parse_rows(result)
    if contracts:
        contract = contracts[0]
        if contract["client_id"] != current_user.id and contract["freelancer_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this request")
    return request

@router.get("/contract/{contract_id}", response_model=List[ScopeChangeResponse])
async def get_contract_scope_changes(
    contract_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(get_current_user)
):
    """List all scope change requests for a specific contract."""
    # Verify access to contract
    result = execute_query(
        "SELECT client_id, freelancer_id FROM contracts WHERE id = ?",
        [contract_id]
    )
    contracts = parse_rows(result)
    if not contracts:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    contract = contracts[0]
    if contract["client_id"] != current_user.id and contract["freelancer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return await ScopeChangeService.get_by_contract(contract_id, skip, limit)

@router.post("/{request_id}/approve", response_model=ScopeChangeResponse)
async def approve_scope_change(
    request_id: int,
    current_user: Any = Depends(get_current_user)
):
    """Approve a scope change request. Must be done by the other party."""
    return await ScopeChangeService.update_status(request_id, ScopeChangeStatus.APPROVED, current_user.id)

@router.post("/{request_id}/reject", response_model=ScopeChangeResponse)
async def reject_scope_change(
    request_id: int,
    current_user: Any = Depends(get_current_user)
):
    """Reject a scope change request."""
    return await ScopeChangeService.update_status(request_id, ScopeChangeStatus.REJECTED, current_user.id)

@router.post("/{request_id}/cancel", response_model=ScopeChangeResponse)
async def cancel_scope_change(
    request_id: int,
    current_user: Any = Depends(get_current_user)
):
    """Cancel a scope change request. Must be done by the requester."""
    return await ScopeChangeService.update_status(request_id, ScopeChangeStatus.CANCELLED, current_user.id)
