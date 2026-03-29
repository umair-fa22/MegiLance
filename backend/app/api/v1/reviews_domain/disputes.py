"""
@AI-HINT: Dispute Management API - Turso HTTP only (NO SQLite fallback)
Handles dispute creation, listing, admin assignment, and resolution.
"""
from typing import Optional
import logging
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from pydantic import BaseModel, Field
logger = logging.getLogger(__name__)

from app.core.security import get_current_active_user
from app.api.v1.core_domain.uploads import validate_file, save_uploaded_file, DOCUMENT_DIR, ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, MAX_DOCUMENT_SIZE
from app.models import User
from app.services.db_utils import get_user_role, sanitize_text, paginate_params
from app.schemas.dispute import (
    Dispute as DisputeSchema,
    DisputeCreate,
    DisputeUpdate,
    DisputeList
)
from app.services import disputes_service

router = APIRouter()


@router.post("", response_model=DisputeSchema, status_code=status.HTTP_201_CREATED)
async def create_dispute(
    dispute_data: DisputeCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new dispute. Only contract parties can raise disputes."""
    contract = disputes_service.get_contract_parties(dispute_data.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract["client_id"]
    freelancer_id = contract["freelancer_id"]

    if current_user.id not in [client_id, freelancer_id]:
        raise HTTPException(status_code=403, detail="Only contract parties can raise disputes")

    dispute_type = dispute_data.dispute_type.value if hasattr(dispute_data.dispute_type, 'value') else dispute_data.dispute_type

    dispute = disputes_service.create_dispute(
        dispute_data.contract_id, current_user.id, dispute_type, sanitize_text(dispute_data.description)
    )
    if not dispute:
        raise HTTPException(status_code=500, detail="Failed to retrieve created dispute")

    # Notify other party
    other_party_id = freelancer_id if current_user.id == client_id else client_id
    disputes_service.send_notification(
        user_id=other_party_id,
        notification_type="dispute",
        title="New Dispute Raised",
        content=f"A dispute has been raised on contract #{dispute_data.contract_id}",
        data={"dispute_id": dispute["id"], "contract_id": dispute_data.contract_id},
        priority="high",
        action_url=f"/disputes/{dispute['id']}"
    )

    # Notify admins
    for admin_id in disputes_service.get_admin_user_ids():
        disputes_service.send_notification(
            user_id=admin_id,
            notification_type="admin_action",
            title="New Dispute Requires Attention",
            content=f"Dispute #{dispute['id']} raised on contract #{dispute_data.contract_id}",
            data={"dispute_id": dispute["id"], "contract_id": dispute_data.contract_id},
            priority="high",
            action_url=f"/admin/disputes/{dispute['id']}"
        )

    return dispute


@router.get("", response_model=DisputeList)
async def list_disputes(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    dispute_type: Optional[str] = Query(None, description="Filter by type"),
    raised_by_me: bool = Query(False, description="Only disputes I raised"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """List disputes with filtering. Regular users see only disputes they're involved in."""
    offset, limit = paginate_params(page, page_size)
    user_type = get_user_role(current_user)

    data = disputes_service.list_disputes(
        user_type, current_user.id, contract_id, status_filter,
        dispute_type, raised_by_me, offset, limit
    )
    return DisputeList(total=data["total"], disputes=data["disputes"])


@router.get("/{dispute_id}", response_model=DisputeSchema)
async def get_dispute(
    dispute_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific dispute. Only viewable by contract parties and admins."""
    dispute = disputes_service.get_dispute_by_id(dispute_id)
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    user_type = get_user_role(current_user)

    if user_type != "admin":
        contract = disputes_service.get_contract_client_freelancer(dispute["contract_id"])
        if contract:
            if current_user.id not in [contract["client_id"], contract["freelancer_id"]]:
                raise HTTPException(status_code=403, detail="You don't have permission to view this dispute")

    return dispute


@router.patch("/{dispute_id}", response_model=DisputeSchema)
async def update_dispute(
    dispute_id: int,
    dispute_data: DisputeUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a dispute. Regular users can only update description, admins can update everything."""
    dispute_core = disputes_service.get_dispute_contract_id(dispute_id)
    if not dispute_core:
        raise HTTPException(status_code=404, detail="Dispute not found")

    contract_id = dispute_core["contract_id"]
    current_status = dispute_core["status"]

    contract = disputes_service.get_contract_client_freelancer(contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    client_id = contract["client_id"]
    freelancer_id = contract["freelancer_id"]

    user_type = get_user_role(current_user)

    update_dict = dispute_data.model_dump(exclude_unset=True)

    if user_type == "admin":
        if "status" in update_dict and update_dict["status"] != current_status:
            new_status = update_dict["status"]
            if hasattr(new_status, 'value'):
                new_status = new_status.value
            for party_id in [client_id, freelancer_id]:
                disputes_service.send_notification(
                    user_id=party_id,
                    notification_type="dispute",
                    title="Dispute Status Updated",
                    content=f"Dispute #{dispute_id} status changed to {new_status}",
                    data={"dispute_id": dispute_id, "new_status": new_status},
                    priority="high",
                    action_url=f"/disputes/{dispute_id}"
                )
    elif current_user.id in [client_id, freelancer_id]:
        if set(update_dict.keys()) - {"description"}:
            raise HTTPException(status_code=403, detail="You can only update the description")
        if "description" not in update_dict:
            update_dict = {}
    else:
        raise HTTPException(status_code=403, detail="You don't have permission to update this dispute")

    if update_dict:
        disputes_service.update_dispute(dispute_id, update_dict)

    return await get_dispute(dispute_id, current_user)


class AssignDisputeRequest(BaseModel):
    admin_id: int = Field(..., gt=0)

class ResolveDisputeRequest(BaseModel):
    resolution: str = Field(..., min_length=5, max_length=5000)
    contract_status: Optional[str] = None

@router.post("/{dispute_id}/assign", response_model=DisputeSchema)
async def assign_dispute(
    dispute_id: int,
    body: AssignDisputeRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Assign a dispute to an admin. Admin-only endpoint."""
    user_type = get_user_role(current_user)

    if user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can assign disputes")

    if not disputes_service.dispute_exists(dispute_id):
        raise HTTPException(status_code=404, detail="Dispute not found")

    admin_type = disputes_service.get_user_type(body.admin_id)
    if admin_type is None:
        raise HTTPException(status_code=404, detail="Admin user not found")
    if admin_type.lower() != "admin":
        raise HTTPException(status_code=400, detail="Can only assign to admin users")

    disputes_service.assign_dispute(dispute_id, body.admin_id)

    disputes_service.send_notification(
        user_id=body.admin_id,
        notification_type="admin_action",
        title="Dispute Assigned to You",
        content=f"You have been assigned dispute #{dispute_id}",
        data={"dispute_id": dispute_id},
        priority="high",
        action_url=f"/admin/disputes/{dispute_id}"
    )

    return await get_dispute(dispute_id, current_user)


@router.post("/{dispute_id}/resolve", response_model=DisputeSchema)
async def resolve_dispute(
    dispute_id: int,
    body: ResolveDisputeRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Resolve a dispute. Admin-only endpoint."""
    user_type = get_user_role(current_user)

    if user_type != "admin":
        raise HTTPException(status_code=403, detail="Only admins can resolve disputes")

    dispute_core = disputes_service.get_dispute_contract_id(dispute_id)
    if not dispute_core:
        raise HTTPException(status_code=404, detail="Dispute not found")

    contract_id = dispute_core["contract_id"]

    # Validate contract_status BEFORE resolving to prevent inconsistent state
    if body.contract_status:
        valid_statuses = ["pending", "active", "completed", "cancelled", "disputed", "terminated", "refunded"]
        if body.contract_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid contract status. Must be one of: {', '.join(valid_statuses)}")

    disputes_service.resolve_dispute(dispute_id, sanitize_text(body.resolution))

    if body.contract_status:
        disputes_service.update_contract_status(contract_id, body.contract_status)

    contract = disputes_service.get_contract_client_freelancer(contract_id)
    if contract:
        for party_id in [contract["client_id"], contract["freelancer_id"]]:
            disputes_service.send_notification(
                user_id=party_id,
                notification_type="dispute",
                title="Dispute Resolved",
                content=f"Dispute #{dispute_id} has been resolved",
                data={"dispute_id": dispute_id, "resolution": body.resolution},
                priority="high",
                action_url=f"/disputes/{dispute_id}"
            )

    return await get_dispute(dispute_id, current_user)


@router.post("/{dispute_id}/evidence", response_model=DisputeSchema)
async def upload_evidence(
    dispute_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload evidence for a dispute. Only contract parties and admins can upload."""
    evidence_data = disputes_service.get_dispute_evidence(dispute_id)
    if not evidence_data:
        raise HTTPException(status_code=404, detail="Dispute not found")

    contract_id = evidence_data["contract_id"]
    current_evidence_json = evidence_data["evidence_json"]

    user_type = get_user_role(current_user)

    if user_type != "admin":
        contract = disputes_service.get_contract_client_freelancer(contract_id)
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        if current_user.id not in [contract["client_id"], contract["freelancer_id"]]:
            raise HTTPException(status_code=403, detail="You don't have permission to upload evidence for this dispute")

    # Validate file type (images and documents allowed as evidence), size, and content
    allowed_evidence_types = ALLOWED_DOCUMENT_TYPES | ALLOWED_IMAGE_TYPES
    file_content = validate_file(file, allowed_evidence_types, MAX_DOCUMENT_SIZE)

    # Save using the secure upload pipeline (sanitizes filename, prevents path traversal)
    evidence_dir = DOCUMENT_DIR / "disputes" / str(dispute_id)
    evidence_dir.mkdir(parents=True, exist_ok=True)
    file_url = save_uploaded_file(file_content, file.filename or "evidence", evidence_dir)

    evidence_list = []
    if current_evidence_json:
        try:
            evidence_list = json.loads(current_evidence_json)
            if not isinstance(evidence_list, list):
                evidence_list = []
        except json.JSONDecodeError:
            evidence_list = []

    evidence_list.append(file_url)
    disputes_service.update_dispute_evidence(dispute_id, json.dumps(evidence_list))

    return await get_dispute(dispute_id, current_user)

