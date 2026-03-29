"""
@AI-HINT: Milestone Management API - Turso HTTP only (NO SQLite fallback)
Handles milestone CRUD, submissions, approvals, and payment integration.
"""
from typing import List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

from app.core.security import get_current_active_user
from app.core.config import get_settings
from app.models import User
from app.schemas.milestone import (
    Milestone as MilestoneSchema,
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneSubmit,
    MilestoneApprove
)
from app.services import milestones_service
from app.services.db_utils import paginate_params

router = APIRouter()


@router.post("", response_model=MilestoneSchema, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    milestone_data: MilestoneCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new milestone for a contract. Only the contract client can create milestones."""
    contract = milestones_service.get_contract_parties(milestone_data.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract["client_id"]
    freelancer_id = contract["freelancer_id"]

    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can create milestones")

    due_date = milestone_data.due_date.isoformat() if milestone_data.due_date else None

    milestone = milestones_service.create_milestone(
        milestone_data.contract_id, milestone_data.title, milestone_data.description,
        milestone_data.amount, due_date
    )
    if not milestone:
        raise HTTPException(status_code=500, detail="Failed to create milestone")

    milestones_service.send_notification(
        user_id=freelancer_id,
        notification_type="milestone",
        title="New Milestone Created",
        content=f"A new milestone has been created for contract #{milestone_data.contract_id}",
        data={"milestone_id": milestone["id"], "contract_id": milestone_data.contract_id},
        priority="medium",
        action_url=f"/contracts/{milestone_data.contract_id}/milestones"
    )

    return milestone


@router.get("", response_model=List[MilestoneSchema])
async def list_milestones(
    contract_id: int = Query(..., description="Contract ID (required)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """List milestones for a contract. Only contract parties can view milestones."""
    offset, limit = paginate_params(page, page_size)
    contract = milestones_service.get_contract_parties(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if current_user.id not in [contract["client_id"], contract["freelancer_id"]]:
        raise HTTPException(status_code=403, detail="You don't have permission to view these milestones")

    return milestones_service.list_milestones(contract_id, status_filter, offset, limit)


@router.get("/{milestone_id}", response_model=MilestoneSchema)
async def get_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific milestone. Only contract parties can view."""
    milestone = milestones_service.get_milestone_by_id(milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract = milestones_service.get_contract_client_freelancer(milestone["contract_id"])
    if contract:
        if current_user.id not in [contract["client_id"], contract["freelancer_id"]]:
            raise HTTPException(status_code=403, detail="You don't have permission to view this milestone")

    return milestone


@router.patch("/{milestone_id}", response_model=MilestoneSchema)
async def update_milestone(
    milestone_id: int,
    milestone_data: MilestoneUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a milestone. Only the client can update milestones that aren't submitted yet."""
    core = milestones_service.get_milestone_core(milestone_id)
    if not core:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract_id = core["contract_id"]
    current_status = core["status"]

    client_id = milestones_service.get_contract_client_id(contract_id)
    if client_id is None:
        raise HTTPException(status_code=404, detail="Contract not found")

    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can update milestones")

    if current_status in ["submitted", "approved"]:
        raise HTTPException(status_code=400, detail="Cannot update submitted or approved milestones")

    update_data = milestone_data.model_dump(exclude_unset=True)
    if update_data:
        milestones_service.update_milestone_fields(milestone_id, update_data)

    return await get_milestone(milestone_id, current_user)


@router.post("/{milestone_id}/submit", response_model=MilestoneSchema)
async def submit_milestone(
    milestone_id: int,
    submission_data: MilestoneSubmit,
    current_user: User = Depends(get_current_active_user)
):
    """Submit a milestone for approval (freelancer action)."""
    core = milestones_service.get_milestone_core(milestone_id)
    if not core:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract_id = core["contract_id"]
    current_status = core["status"]

    contract = milestones_service.get_contract_client_freelancer(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract["client_id"]
    freelancer_id = contract["freelancer_id"]

    if current_user.id != freelancer_id:
        raise HTTPException(status_code=403, detail="Only the freelancer can submit milestones")

    if current_status != "pending":
        raise HTTPException(status_code=400, detail=f"Milestone is {current_status}, cannot submit")

    milestones_service.submit_milestone(milestone_id, submission_data.deliverables, submission_data.submission_notes)

    milestones_service.send_notification(
        user_id=client_id,
        notification_type="milestone",
        title="Milestone Submitted for Review",
        content=f"Milestone #{milestone_id} has been submitted for your review",
        data={"milestone_id": milestone_id, "contract_id": contract_id},
        priority="high",
        action_url=f"/milestones/{milestone_id}"
    )

    return await get_milestone(milestone_id, current_user)


@router.post("/{milestone_id}/approve", response_model=MilestoneSchema)
async def approve_milestone(
    milestone_id: int,
    approval_data: MilestoneApprove,
    current_user: User = Depends(get_current_active_user)
):
    """Approve a milestone (client action). Triggers payment creation."""
    ms = milestones_service.get_milestone_for_approval(milestone_id)
    if not ms:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract_id = ms["contract_id"]
    current_status = ms["status"]
    amount = ms["amount"]
    title = ms["title"]

    contract = milestones_service.get_contract_client_freelancer(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract["client_id"]
    freelancer_id = contract["freelancer_id"]

    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can approve milestones")

    if current_status != "submitted":
        raise HTTPException(status_code=400, detail=f"Milestone is {current_status}, must be submitted to approve")

    platform_fee_percentage = get_settings().STRIPE_PLATFORM_FEE_PERCENT / 100.0
    platform_fee = round(amount * platform_fee_percentage, 2)
    freelancer_amount = round(amount - platform_fee, 2)

    milestones_service.approve_milestone(milestone_id, approval_data.approval_notes)

    payment_id = milestones_service.create_payment_record(
        contract_id, milestone_id, client_id, freelancer_id,
        amount, platform_fee, freelancer_amount, title
    )

    milestones_service.create_invoice(
        contract_id, milestone_id, freelancer_id, client_id, amount, payment_id, title
    )

    milestones_service.send_notification(
        user_id=freelancer_id,
        notification_type="payment",
        title="Milestone Approved - Payment Processing",
        content=f"Milestone #{milestone_id} approved. Payment of ${freelancer_amount:.2f} is being processed.",
        data={"milestone_id": milestone_id, "payment_id": payment_id, "amount": float(freelancer_amount)},
        priority="high",
        action_url=f"/payments/{payment_id}" if payment_id else f"/milestones/{milestone_id}"
    )

    # Auto-complete contract if all milestones are approved (#204)
    milestones_service.check_and_complete_contract(contract_id)

    return await get_milestone(milestone_id, current_user)


@router.post("/{milestone_id}/reject", response_model=MilestoneSchema)
async def reject_milestone(
    milestone_id: int,
    rejection_notes: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user)
):
    """Reject a milestone submission (client action). Returns milestone to PENDING status."""
    core = milestones_service.get_milestone_core(milestone_id)
    if not core:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract_id = core["contract_id"]
    current_status = core["status"]

    contract = milestones_service.get_contract_client_freelancer(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract["client_id"]
    freelancer_id = contract["freelancer_id"]

    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can reject milestones")

    if current_status != "submitted":
        raise HTTPException(status_code=400, detail=f"Milestone is {current_status}, must be submitted to reject")

    milestones_service.reject_milestone(milestone_id, rejection_notes)

    milestones_service.send_notification(
        user_id=freelancer_id,
        notification_type="milestone",
        title="Milestone Needs Revision",
        content=f"Milestone #{milestone_id} needs revision. Check feedback from client.",
        data={"milestone_id": milestone_id, "contract_id": contract_id},
        priority="high",
        action_url=f"/milestones/{milestone_id}"
    )

    return await get_milestone(milestone_id, current_user)


@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a milestone. Only client can delete, and only if not yet submitted."""
    core = milestones_service.get_milestone_core(milestone_id)
    if not core:
        raise HTTPException(status_code=404, detail="Milestone not found")

    contract_id = core["contract_id"]
    current_status = core["status"]

    client_id = milestones_service.get_contract_client_id(contract_id)
    if client_id is None:
        raise HTTPException(status_code=404, detail="Contract not found")

    if current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Only the contract client can delete milestones")

    if current_status in ["submitted", "approved"]:
        raise HTTPException(status_code=400, detail="Cannot delete submitted or approved milestones")

    milestones_service.delete_milestone(milestone_id)
