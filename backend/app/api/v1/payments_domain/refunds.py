# @AI-HINT: Refunds API endpoints - delegates DB operations to refunds_service
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Literal

from app.core.security import get_current_user
from app.models import User
from app.schemas.refund import (
    RefundCreate, RefundUpdate, RefundRead,
    RefundApprove, RefundReject, RefundList
)
from app.services import refunds_service
from app.services.db_utils import get_user_role

router = APIRouter(prefix="/refunds", tags=["refunds"])


@router.post("/", response_model=RefundRead, status_code=status.HTTP_201_CREATED)
async def create_refund(
    refund: RefundCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a refund request. Users can request refunds for payments they made."""
    payment = refunds_service.get_payment_for_refund(refund.payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment["from_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only request refunds for your own payments")

    if payment["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only refund completed payments")

    if refunds_service.check_existing_refund(refund.payment_id):
        raise HTTPException(status_code=400, detail="A refund request already exists for this payment")

    if refund.amount > payment["amount"]:
        raise HTTPException(status_code=400, detail=f"Refund amount cannot exceed payment amount (${payment['amount']:.2f})")

    created = refunds_service.create_refund(refund.payment_id, refund.amount, refund.reason, current_user.id)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to retrieve created refund")

    return created


@router.get("/", response_model=RefundList)
async def list_refunds(
    status_filter: Optional[Literal["pending", "approved", "rejected", "processed"]] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """List refunds. Users see refunds they requested, admins see all."""
    user_role = get_user_role(current_user)
    is_admin = user_role == "admin"

    refunds, total = refunds_service.list_refunds(
        user_id=current_user.id,
        is_admin=is_admin,
        status_filter=status_filter,
        page=page,
        page_size=page_size
    )

    return RefundList(refunds=refunds, total=total, page=page, page_size=page_size)


@router.get("/{refund_id}", response_model=RefundRead)
async def get_refund(
    refund_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get a refund by ID"""
    refund = refunds_service.get_refund_by_id(refund_id)
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")

    user_role = get_user_role(current_user)
    if user_role != "admin" and refund["requested_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return refund


@router.patch("/{refund_id}", response_model=RefundRead)
async def update_refund(
    refund_id: int,
    update_data: RefundUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update refund details. User can update their own pending refunds, admin can update any."""
    existing = refunds_service.get_refund_for_update(refund_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Refund not found")

    user_role = get_user_role(current_user)
    if user_role != "admin":
        if existing["requested_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if existing["status"] != "pending":
            raise HTTPException(status_code=400, detail="Can only update pending refund requests")

    update_dict = update_data.model_dump(exclude_unset=True)
    if update_dict:
        refunds_service.update_refund_fields(refund_id, update_dict)

    return await get_refund(refund_id, current_user)


@router.post("/{refund_id}/approve", response_model=RefundRead)
async def approve_refund(
    refund_id: int,
    approve_data: RefundApprove,
    current_user: User = Depends(get_current_user)
):
    """Approve a refund request. Admin only."""
    if get_user_role(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    refund_status = refunds_service.get_refund_status(refund_id)
    if refund_status is None:
        raise HTTPException(status_code=404, detail="Refund not found")
    if refund_status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot approve refund with status: {refund_status}")

    refunds_service.approve_refund(refund_id, current_user.id)
    return await get_refund(refund_id, current_user)


@router.post("/{refund_id}/reject", response_model=RefundRead)
async def reject_refund(
    refund_id: int,
    reject_data: RefundReject,
    current_user: User = Depends(get_current_user)
):
    """Reject a refund request. Admin only."""
    if get_user_role(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    refund_info = refunds_service.get_refund_status(refund_id, include_reason=True)
    if refund_info is None:
        raise HTTPException(status_code=404, detail="Refund not found")

    if isinstance(refund_info, str):
        refund_status = refund_info
        current_reason = ""
    else:
        refund_status = refund_info["status"]
        current_reason = refund_info.get("reason", "")

    if refund_status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot reject refund with status: {refund_status}")

    refunds_service.reject_refund(refund_id, current_reason, reject_data.rejection_reason)
    return await get_refund(refund_id, current_user)


@router.post("/{refund_id}/process", response_model=RefundRead)
async def process_refund(
    refund_id: int,
    current_user: User = Depends(get_current_user)
):
    """Process an approved refund. Admin only. Transfers money back to requester."""
    if get_user_role(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    refund_data = refunds_service.get_refund_for_processing(refund_id)
    if not refund_data:
        raise HTTPException(status_code=404, detail="Refund not found")

    if refund_data["status"] != "approved":
        raise HTTPException(status_code=400, detail="Can only process approved refunds")

    balance = refunds_service.get_user_balance(refund_data["requested_by"])
    refunds_service.process_refund(
        refund_id=refund_id,
        payment_id=refund_data["payment_id"],
        requested_by=refund_data["requested_by"],
        amount=refund_data["amount"],
        current_balance=balance
    )

    return await get_refund(refund_id, current_user)


@router.delete("/{refund_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_refund(
    refund_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete a refund request. User can delete their own pending refunds, admin can delete any."""
    existing = refunds_service.get_refund_for_update(refund_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Refund not found")

    user_role = get_user_role(current_user)
    if user_role != "admin":
        if existing["requested_by"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if existing["status"] != "pending":
            raise HTTPException(status_code=400, detail="Can only delete pending refund requests")

    refunds_service.delete_refund(refund_id)
