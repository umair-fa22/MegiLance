# @AI-HINT: Proposals API - CRUD for freelancer proposals on projects
# Delegates to proposals_service for all data access
# Enhanced with input validation, security measures, and standardized responses
# Auto-creates contracts when proposals are accepted

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

from app.core.security import get_current_active_user
from app.core.responses import (
    validate_length,
    validate_range
)
from app.models.user import User
from app.schemas.proposal import ProposalCreate, ProposalRead, ProposalUpdate
from app.services.profile_validation import is_profile_complete, get_missing_profile_fields
from app.services import proposals_service
from app.services.db_utils import sanitize_text, paginate_params
from app.api.v1.core_domain.utils import moderate_content

router = APIRouter()

# === Input Validation Constants ===
MAX_COVER_LETTER_LENGTH = 5000
MIN_COVER_LETTER_LENGTH = 50
MAX_AVAILABILITY_LENGTH = 500
MAX_ATTACHMENTS_LENGTH = 2000
MAX_BID_AMOUNT = 1000000  # $1M max
MIN_BID_AMOUNT = 1        # $1 min
MAX_HOURLY_RATE = 1000    # $1000/hr max
MIN_HOURLY_RATE = 1       # $1/hr min
MAX_ESTIMATED_HOURS = 10000  # 10,000 hours max
MIN_ESTIMATED_HOURS = 1   # 1 hour min
VALID_PROPOSAL_STATUSES = {"draft", "submitted", "accepted", "rejected", "withdrawn", "shortlisted"}


def _validate_proposal_input(proposal) -> None:
    """Validate proposal input fields with enhanced error messages"""
    # Cover letter validation
    if proposal.cover_letter:
        validate_length(
            proposal.cover_letter,
            "Cover letter",
            min_length=MIN_COVER_LETTER_LENGTH,
            max_length=MAX_COVER_LETTER_LENGTH
        )
    
    # Availability validation
    if proposal.availability:
        validate_length(
            proposal.availability,
            "Availability",
            max_length=MAX_AVAILABILITY_LENGTH
        )
    
    # Attachments validation
    if proposal.attachments:
        validate_length(
            proposal.attachments,
            "Attachments",
            max_length=MAX_ATTACHMENTS_LENGTH
        )
    
    # Bid amount validation
    if proposal.bid_amount is not None:
        validate_range(
            proposal.bid_amount,
            "Bid amount",
            min_val=MIN_BID_AMOUNT,
            max_val=MAX_BID_AMOUNT
        )
    
    # Hourly rate validation
    if proposal.hourly_rate is not None:
        validate_range(
            proposal.hourly_rate,
            "Hourly rate",
            min_val=MIN_HOURLY_RATE,
            max_val=MAX_HOURLY_RATE
        )
    
    # Estimated hours validation
    if proposal.estimated_hours is not None:
        validate_range(
            proposal.estimated_hours,
            "Estimated hours",
            min_val=MIN_ESTIMATED_HOURS,
            max_val=MAX_ESTIMATED_HOURS
        )


def _safe_str(val):
    """Convert bytes to string if needed"""
    from app.api.v1.core_domain.utils import safe_str
    return safe_str(val)


@router.get("/drafts", response_model=List[ProposalRead])
def list_draft_proposals(
    project_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """Get all draft proposals for the current user"""
    return proposals_service.get_draft_proposals(current_user.id, project_id)


@router.post("/draft", response_model=ProposalRead, status_code=status.HTTP_201_CREATED)
def create_draft_proposal(
    proposal: ProposalCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Save a proposal as draft"""
    user_type = _safe_str(current_user.user_type)
    if not user_type or user_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers can create proposals"
        )
    
    # Validate input
    _validate_proposal_input(proposal)
    
    # Check if project exists
    if not proposals_service.project_exists(proposal.project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    # Auto-calculate bid_amount from hours * rate if not provided
    draft_bid = proposal.bid_amount
    if not draft_bid and proposal.estimated_hours and proposal.hourly_rate:
        draft_bid = proposal.estimated_hours * proposal.hourly_rate

    result = proposals_service.create_draft_proposal(current_user.id, {
        "project_id": proposal.project_id,
        "cover_letter": sanitize_text(proposal.cover_letter) if proposal.cover_letter else "",
        "bid_amount": draft_bid or 0,
        "estimated_hours": proposal.estimated_hours or 0,
        "hourly_rate": proposal.hourly_rate or 0,
        "availability": sanitize_text(proposal.availability) if proposal.availability else "",
        "attachments": proposal.attachments or "",
    })
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create draft proposal")
    return result


@router.get("", response_model=List[ProposalRead])
def list_proposals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user)
):
    """List proposals for current user"""
    offset, limit = paginate_params(page, page_size)
    user_type = _safe_str(current_user.user_type)
    return proposals_service.list_proposals(
        user_id=current_user.id,
        user_type=user_type,
        project_id=project_id,
        status_filter=status,
        limit=limit,
        skip=offset
    )


@router.get("/{proposal_id}", response_model=ProposalRead)
def get_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific proposal"""
    proposal = proposals_service.get_proposal_with_joins(proposal_id)
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    is_proposal_owner = proposal["freelancer_id"] == current_user.id
    
    client_id = proposals_service.get_project_client_id(proposal["project_id"])
    is_project_owner = client_id == current_user.id
    
    if not is_proposal_owner and not is_project_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this proposal"
        )
    
    return proposal


@router.post("", response_model=ProposalRead, status_code=status.HTTP_201_CREATED)
def create_proposal(
    proposal: ProposalCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new proposal"""
    user_type = _safe_str(current_user.user_type)
    if not user_type or user_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers can submit proposals"
        )
    
    # Validate input
    _validate_proposal_input(proposal)
    
    # Content moderation
    ok, reason = moderate_content(proposal.cover_letter)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cover letter rejected: {reason}")
    
    # Validate cover letter is not empty for submission
    if not proposal.cover_letter or len(proposal.cover_letter.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cover letter must be at least 50 characters"
        )
    
    # Check profile completion
    if not is_profile_complete(current_user):
        missing = get_missing_profile_fields(current_user)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Please complete your profile before submitting a proposal. Missing: {', '.join(missing)}"
        )
    
    # Check if project exists and is open
    project_status = proposals_service.get_project_status(proposal.project_id)
    if project_status is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    if project_status != "open":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is not open for proposals"
        )
    
    # Check if already submitted
    if proposals_service.has_submitted_proposal(proposal.project_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a proposal for this project"
        )
    
    # Auto-calculate bid_amount from hours * rate if not provided
    bid_amount = proposal.bid_amount
    if not bid_amount and proposal.estimated_hours and proposal.hourly_rate:
        bid_amount = proposal.estimated_hours * proposal.hourly_rate

    result = proposals_service.create_proposal(current_user.id, {
        "project_id": proposal.project_id,
        "cover_letter": sanitize_text(proposal.cover_letter) if proposal.cover_letter else "",
        "bid_amount": bid_amount,
        "estimated_hours": proposal.estimated_hours or 0,
        "hourly_rate": proposal.hourly_rate or 0,
        "availability": sanitize_text(proposal.availability) if proposal.availability else "",
        "attachments": proposal.attachments or "",
    })
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create proposal")
    return result


@router.put("/{proposal_id}", response_model=ProposalRead)
def update_proposal(
    proposal_id: int,
    proposal: ProposalUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update a proposal"""
    existing = proposals_service.get_proposal_raw(proposal_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    if existing["freelancer_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this proposal"
        )
    
    if existing["status"] != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update proposal that is not in submitted status"
        )
    
    update_data = proposal.model_dump(exclude_unset=True, exclude_none=True)
    
    result = proposals_service.update_proposal(proposal_id, update_data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated proposal")
    return result


@router.delete("/{proposal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a proposal"""
    entry = proposals_service.get_proposal_for_delete(proposal_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    if entry["freelancer_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this proposal"
        )
    
    if entry["status"] != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete proposal that is not in submitted status"
        )
    
    proposals_service.delete_proposal(proposal_id)
    return


@router.post("/{proposal_id}/accept", response_model=ProposalRead)
def accept_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Client accepts a proposal - creates a contract automatically"""
    details = proposals_service.get_proposal_with_project_details(proposal_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    if not details.get("_project_title"):
        raise HTTPException(status_code=404, detail="Project not found")
    
    if details.get("_project_client_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can accept proposals"
        )
    
    # Verify project is still open before accepting
    project_status = details.get("_project_status", "open")
    if project_status not in ("open", "in_progress"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project is {project_status} and cannot accept proposals"
        )
    
    if details["status"] != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal is not in submitted status"
        )
    
    result = proposals_service.accept_proposal(proposal_id, details, current_user.id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated proposal")
    return result


@router.post("/{proposal_id}/reject", response_model=ProposalRead)
def reject_proposal(
    proposal_id: int,
    reason: Optional[str] = Body(None, embed=True, max_length=1000),
    current_user: User = Depends(get_current_active_user)
):
    """Client rejects a proposal with an optional reason"""
    existing = proposals_service.get_proposal_raw(proposal_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    client_id = proposals_service.get_project_client_id(existing["project_id"])
    if client_id is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can reject proposals"
        )
    
    if existing["status"] not in ("submitted", "shortlisted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Proposal must be in submitted or shortlisted status to reject"
        )
    
    result = proposals_service.reject_proposal(proposal_id, reason=sanitize_text(reason) if reason else None)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated proposal")
    return result


@router.post("/{proposal_id}/shortlist", response_model=ProposalRead)
def shortlist_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Client shortlists a proposal for further consideration"""
    existing = proposals_service.get_proposal_raw(proposal_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    client_id = proposals_service.get_project_client_id(existing["project_id"])
    if client_id is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can shortlist proposals"
        )
    
    if existing["status"] != "submitted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only submitted proposals can be shortlisted"
        )
    
    result = proposals_service.shortlist_proposal(proposal_id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to shortlist proposal")
    return result


@router.post("/{proposal_id}/withdraw", response_model=ProposalRead)
def withdraw_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Freelancer withdraws their own proposal"""
    existing = proposals_service.get_proposal_raw(proposal_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    if existing["freelancer_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to withdraw this proposal"
        )
    
    if existing["status"] not in ("submitted", "shortlisted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only withdraw submitted or shortlisted proposals"
        )
    
    result = proposals_service.withdraw_proposal(proposal_id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to withdraw proposal")
    return result


@router.post("/{proposal_id}/counter-offer", response_model=ProposalRead)
def create_counter_offer(
    proposal_id: int,
    bid_amount: Optional[float] = Body(None, gt=0, le=1000000),
    hourly_rate: Optional[float] = Body(None, gt=0, le=1000),
    estimated_hours: Optional[int] = Body(None, gt=0, le=10000),
    message: Optional[str] = Body(None, max_length=2000),
    current_user: User = Depends(get_current_active_user)
):
    """
    Client sends a counter-offer with modified terms.
    The freelancer's proposal is updated with counter-offer data stored in draft_data
    and status changed to 'submitted' (awaiting freelancer response).
    """
    existing = proposals_service.get_proposal_raw(proposal_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    
    client_id = proposals_service.get_project_client_id(existing["project_id"])
    if client_id is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can make counter-offers"
        )
    
    if existing["status"] not in ("submitted", "shortlisted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only counter-offer submitted or shortlisted proposals"
        )
    
    if not any([bid_amount, hourly_rate, estimated_hours]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide at least one modified term (bid_amount, hourly_rate, or estimated_hours)"
        )
    
    counter_data = {
        "original_bid": existing["bid_amount"],
        "original_hourly_rate": existing["hourly_rate"],
        "original_estimated_hours": existing["estimated_hours"],
        "counter_bid": bid_amount,
        "counter_hourly_rate": hourly_rate,
        "counter_estimated_hours": estimated_hours,
        "counter_message": sanitize_text(message) if message else None,
        "counter_by": current_user.id,
        "counter_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    }
    
    result = proposals_service.create_counter_offer(proposal_id, counter_data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create counter-offer")
    return result


@router.get("/stats/my")
def get_my_proposal_stats(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get proposal statistics for the current freelancer.
    Shows acceptance rate, average bid, total proposals, and status breakdown.
    """
    user_type = _safe_str(current_user.user_type)
    if not user_type or user_type.lower() != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers can view proposal stats"
        )
    
    return proposals_service.get_freelancer_proposal_stats(current_user.id)
