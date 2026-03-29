# @AI-HINT: Time Tracking API endpoints - delegates to time_entries_service for all data access
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timezone
import logging
import json
logger = logging.getLogger(__name__)

from app.schemas.time_entry import (
    TimeEntryCreate, TimeEntryUpdate, TimeEntryRead, 
    TimeEntryStop, TimeEntrySummary, TimeEntrySubmit, TimeEntryReview
)
from app.core.security import get_current_user
from app.services import time_entries_service

router = APIRouter(prefix="/time-entries", tags=["time-tracking"])


@router.post("/", response_model=TimeEntryRead, status_code=status.HTTP_201_CREATED)
async def create_time_entry(
    time_entry: TimeEntryCreate,
    current_user = Depends(get_current_user)
):
    """
    Start a new time entry (start timer)
    - Freelancers can track time on their contracts
    - Auto-sets start_time if not provided
    - Status defaults to 'draft'
    """
    freelancer_id = time_entries_service.get_contract_freelancer_id(time_entry.contract_id)
    if freelancer_id is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if freelancer_id != current_user["id"]:
        raise HTTPException(
            status_code=403, 
            detail="Only the contract freelancer can create time entries"
        )
    
    if time_entries_service.has_active_time_entry(current_user["id"], time_entry.contract_id):
        raise HTTPException(
            status_code=400, 
            detail="You have an active time entry. Stop it before starting a new one."
        )
    
    hourly_rate = time_entry.hourly_rate
    if not hourly_rate:
        hourly_rate = time_entries_service.get_user_hourly_rate(current_user["id"])
    
    start_time = time_entry.start_time.isoformat() if time_entry.start_time else datetime.now(timezone.utc).isoformat()
    
    entry = time_entries_service.create_time_entry(
        user_id=current_user["id"],
        contract_id=time_entry.contract_id,
        description=time_entry.description,
        start_time=start_time,
        hourly_rate=hourly_rate,
        billable=time_entry.billable,
        entry_status=time_entry.status or "draft"
    )
    
    if not entry:
        raise HTTPException(status_code=500, detail="Failed to create time entry")
    
    return entry


@router.put("/{time_entry_id}/stop", response_model=TimeEntryRead)
async def stop_time_entry(
    time_entry_id: int,
    stop_data: TimeEntryStop,
    current_user = Depends(get_current_user)
):
    """
    Stop a running time entry (stop timer)
    - Auto-calculates duration and amount
    - Sets end_time to current time if not provided
    """
    entry = time_entries_service.fetch_time_entry(time_entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    if entry["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if entry["end_time"] is not None:
        raise HTTPException(status_code=400, detail="Time entry already stopped")
    
    end_time = stop_data.end_time if stop_data.end_time else datetime.now(timezone.utc)
    
    start_time = entry["start_time"]
    if isinstance(start_time, str):
        start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00").replace("+00:00", ""))
    
    duration_minutes = int((end_time - start_time).total_seconds() / 60)
    
    amount = None
    if entry["billable"] and entry["hourly_rate"]:
        amount = (duration_minutes / 60) * entry["hourly_rate"]
    
    return time_entries_service.stop_time_entry(
        time_entry_id, end_time.isoformat(), duration_minutes, amount
    )


@router.get("/", response_model=List[TimeEntryRead])
async def list_time_entries(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    entry_status: Optional[str] = Query(None, alias="status", description="Filter by status"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date (from)"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date (to)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user)
):
    """
    List time entries with filters
    - Freelancers see only their own entries
    - Clients see entries for their contracts
    - Supports filtering by contract, status, date range
    """
    user_type = current_user.get("user_type", "").lower() or current_user.get("role", "").lower()
    
    return time_entries_service.list_time_entries(
        user_id=current_user["id"],
        user_type=user_type,
        contract_id=contract_id,
        entry_status=entry_status,
        start_date=start_date.isoformat() if start_date else None,
        end_date=end_date.isoformat() if end_date else None,
        limit=limit,
        offset=offset
    )


@router.get("/summary", response_model=TimeEntrySummary)
async def get_time_summary(
    contract_id: int = Query(..., description="Contract ID for summary"),
    current_user = Depends(get_current_user)
):
    """
    Get time entry summary for a contract
    - Total hours worked
    - Total billable hours
    - Total amount earned
    - Number of entries
    """
    contract_info = time_entries_service.get_contract_access_info(contract_id)
    if not contract_info:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    user_type = current_user.get("user_type", "").lower() or current_user.get("role", "").lower()
    
    if user_type == "freelancer" and contract_info["freelancer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    elif user_type == "client" and contract_info["client_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    summary = time_entries_service.get_time_summary(contract_id)
    
    return TimeEntrySummary(
        contract_id=contract_id,
        total_hours=round(summary["total_minutes"] / 60, 2),
        total_amount=round(summary["total_amount"], 2),
        billable_hours=round(summary["billable_minutes"] / 60, 2),
        billable_amount=round(summary["billable_amount"], 2),
        entry_count=summary["entry_count"]
    )


@router.get("/{time_entry_id}", response_model=TimeEntryRead)
async def get_time_entry(
    time_entry_id: int,
    current_user = Depends(get_current_user)
):
    """Get a single time entry by ID"""
    entry = time_entries_service.fetch_time_entry(time_entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    if entry["user_id"] != current_user["id"]:
        client_id = time_entries_service.get_contract_client_id(entry["contract_id"])
        if client_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return entry


@router.patch("/{time_entry_id}", response_model=TimeEntryRead)
async def update_time_entry(
    time_entry_id: int,
    update_data: TimeEntryUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update a time entry
    - Only freelancer can update their own entries
    - Only 'draft' entries can be edited
    """
    entry = time_entries_service.fetch_time_entry(time_entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    if entry["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if entry["status"] != "draft":
        raise HTTPException(
            status_code=400, 
            detail="Only draft time entries can be edited"
        )
    
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        return entry
    
    updated_entry = time_entries_service.update_time_entry(time_entry_id, update_dict)
    
    if updated_entry and updated_entry["start_time"] and updated_entry["end_time"]:
        updated_entry = time_entries_service.recalculate_duration_and_amount(
            time_entry_id, updated_entry["start_time"], updated_entry["end_time"]
        )
    
    return updated_entry


@router.delete("/{time_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_entry(
    time_entry_id: int,
    current_user = Depends(get_current_user)
):
    """
    Delete a time entry
    - Only draft entries can be deleted
    - Only freelancer can delete their own entries
    """
    entry = time_entries_service.get_entry_for_delete(time_entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    if entry["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if entry["status"] != "draft":
        raise HTTPException(
            status_code=400, 
            detail="Only draft time entries can be deleted"
        )
    
    time_entries_service.delete_time_entry(time_entry_id)
    return None


@router.post("/submit", status_code=status.HTTP_200_OK)
async def submit_time_entries(
    submission: TimeEntrySubmit,
    current_user = Depends(get_current_user)
):
    """
    Submit time entries for approval
    - Only freelancer can submit their own entries
    - Only 'draft' entries can be submitted
    - Entries must belong to the same contract (optional validation, but good practice)
    """
    if not submission.time_entry_ids:
        raise HTTPException(status_code=400, detail="No time entries provided")
    
    entries = time_entries_service.get_entries_for_submit(submission.time_entry_ids)
    
    if not entries:
        raise HTTPException(status_code=404, detail="Time entries not found")
    
    if len(entries) != len(submission.time_entry_ids):
        raise HTTPException(status_code=400, detail="Some time entries were not found")
    
    contract_ids = set()
    
    for e in entries:
        if e["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail=f"Not authorized for entry {e['id']}")
        if e["status"] != "draft":
            raise HTTPException(status_code=400, detail=f"Entry {e['id']} is not in draft status")
        contract_ids.add(e["contract_id"])
    
    time_entries_service.submit_entries(submission.time_entry_ids)
    
    for cid in contract_ids:
        client_id = time_entries_service.get_contract_client_id(cid)
        if client_id:
            time_entries_service.send_notification(
                user_id=client_id,
                notification_type="timesheet",
                title="Timesheet Submitted",
                content=f"Freelancer submitted {len(entries)} time entries for review",
                data={"contract_id": cid, "count": len(entries)},
                priority="high",
                action_url=f"/contracts/{cid}/timesheet"
            )
            
    return {"message": f"Submitted {len(entries)} time entries"}


@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve_time_entries(
    review: TimeEntryReview,
    current_user = Depends(get_current_user)
):
    """
    Approve time entries and generate invoice
    - Only client can approve
    - Only 'submitted' entries can be approved
    - Generates an invoice for the total amount
    """
    if not review.time_entry_ids:
        raise HTTPException(status_code=400, detail="No time entries provided")
        
    entries = time_entries_service.get_entries_for_review(review.time_entry_ids)
    
    if not entries:
        raise HTTPException(status_code=404, detail="Time entries not found")
        
    contract_ids = set()
    total_amount = 0.0
    freelancer_id = None
    
    for e in entries:
        if freelancer_id is None:
            freelancer_id = e["user_id"]
        elif freelancer_id != e["user_id"]:
            raise HTTPException(status_code=400, detail="Cannot approve entries from different freelancers at once")
        
        if e["status"] != "submitted":
            raise HTTPException(status_code=400, detail=f"Entry {e['id']} is not submitted")
            
        contract_ids.add(e["contract_id"])
        total_amount += e["amount"]
        
    if len(contract_ids) > 1:
        raise HTTPException(status_code=400, detail="Cannot approve entries from multiple contracts at once")
        
    contract_id = list(contract_ids)[0]
    
    client_id = time_entries_service.get_contract_client_id(contract_id)
    if client_id is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    if client_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only contract client can approve time entries")
        
    time_entries_service.approve_entries(review.time_entry_ids)
    
    if total_amount > 0:
        invoice_number = f"INV-HR-{contract_id}-{int(datetime.now(timezone.utc).timestamp())}"
        
        items_list = [{"description": f"Time Entry #{e['id']}", "amount": e["amount"]} for e in entries]
        items_json = json.dumps(items_list)
        
        time_entries_service.create_invoice(
            invoice_number, contract_id, freelancer_id, client_id,
            total_amount, items_json
        )
        
        time_entries_service.send_notification(
            user_id=freelancer_id,
            notification_type="invoice",
            title="Time Entries Approved",
            content=f"Client approved {len(entries)} time entries. Invoice {invoice_number} generated.",
            data={"contract_id": contract_id, "amount": total_amount, "invoice_number": invoice_number},
            priority="high",
            action_url=f"/contracts/{contract_id}/invoices"
        )
        
    return {"message": f"Approved {len(entries)} entries", "invoice_amount": total_amount}


@router.post("/reject", status_code=status.HTTP_200_OK)
async def reject_time_entries(
    review: TimeEntryReview,
    current_user = Depends(get_current_user)
):
    """
    Reject time entries
    - Only client can reject
    - Returns entries to 'rejected' status (or 'draft'?) -> usually rejected so they can be fixed or deleted
    """
    if not review.time_entry_ids:
        raise HTTPException(status_code=400, detail="No time entries provided")
    
    if not review.rejection_reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required")
        
    entries = time_entries_service.get_entries_for_review(review.time_entry_ids)
    
    if not entries:
        raise HTTPException(status_code=404, detail="Time entries not found")
        
    contract_ids = set()
    freelancer_id = None
    
    for e in entries:
        if freelancer_id is None:
            freelancer_id = e["user_id"]
        
        if e["status"] != "submitted":
            raise HTTPException(status_code=400, detail=f"Entry {e['id']} is not submitted")
            
        contract_ids.add(e["contract_id"])
        
    if len(contract_ids) > 1:
        raise HTTPException(status_code=400, detail="Cannot reject entries from multiple contracts at once")
        
    contract_id = list(contract_ids)[0]
    
    client_id = time_entries_service.get_contract_client_id(contract_id)
    if client_id is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    if client_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only contract client can reject time entries")
        
    time_entries_service.reject_entries(review.time_entry_ids)
    
    time_entries_service.send_notification(
        user_id=freelancer_id,
        notification_type="timesheet",
        title="Time Entries Rejected",
        content=f"Client rejected {len(entries)} time entries: {review.rejection_reason}",
        data={"contract_id": contract_id, "reason": review.rejection_reason},
        priority="high",
        action_url=f"/contracts/{contract_id}/timesheet"
    )
    
    return {"message": f"Rejected {len(entries)} entries"}

