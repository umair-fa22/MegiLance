# @AI-HINT: Support Tickets API endpoints - delegates DB operations to support_tickets_service
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Literal

from app.schemas.support_ticket import (
    SupportTicketCreate, SupportTicketUpdate, SupportTicketRead,
    SupportTicketAssign, SupportTicketResolve, SupportTicketList
)
from app.core.security import get_current_user
from app.services import support_tickets_service

router = APIRouter(prefix="/support-tickets", tags=["support"])


def _is_admin(current_user) -> bool:
    return current_user.get("role", "").lower() == "admin" or current_user.get("user_type", "").lower() == "admin"


@router.post("/", response_model=SupportTicketRead, status_code=status.HTTP_201_CREATED)
async def create_support_ticket(
    ticket: SupportTicketCreate,
    current_user = Depends(get_current_user)
):
    """Create a new support ticket. Any authenticated user can create tickets."""
    created = support_tickets_service.create_ticket(
        user_id=current_user["id"],
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority or "medium",
        attachments=ticket.attachments
    )
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create support ticket")
    return created


@router.get("/", response_model=SupportTicketList)
async def list_support_tickets(
    ticket_status: Optional[Literal["open", "in_progress", "resolved", "closed"]] = Query(None, alias="status"),
    category: Optional[Literal["billing", "technical", "account", "other"]] = Query(None),
    priority: Optional[Literal["low", "medium", "high", "urgent"]] = Query(None),
    assigned_to_me: bool = Query(False, description="Show tickets assigned to me (admin only)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """List support tickets. Users see their own, admins see all."""
    is_admin = _is_admin(current_user)

    result = support_tickets_service.list_tickets(
        user_id=current_user["id"],
        is_admin=is_admin,
        assigned_to_me=assigned_to_me,
        ticket_status=ticket_status,
        category=category,
        priority=priority,
        page=page,
        page_size=page_size
    )

    return SupportTicketList(
        tickets=result["tickets"],
        total=result["total"],
        page=result.get("page", page),
        page_size=result.get("page_size", page_size)
    )


@router.get("/{ticket_id}", response_model=SupportTicketRead)
async def get_support_ticket(
    ticket_id: int,
    current_user = Depends(get_current_user)
):
    """Get a support ticket by ID"""
    ticket = support_tickets_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not _is_admin(current_user) and ticket["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    return ticket


@router.patch("/{ticket_id}", response_model=SupportTicketRead)
async def update_support_ticket(
    ticket_id: int,
    update_data: SupportTicketUpdate,
    current_user = Depends(get_current_user)
):
    """Update a support ticket. Users can update their own open tickets, admins any."""
    ticket = support_tickets_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_admin = _is_admin(current_user)
    if not is_admin:
        if ticket["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        if ticket["status"] not in ["open", "in_progress"]:
            raise HTTPException(status_code=400, detail="Cannot update resolved or closed tickets")

    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        return ticket

    support_tickets_service.update_ticket_fields(ticket_id, update_dict)
    return support_tickets_service.get_ticket_by_id(ticket_id)


@router.post("/{ticket_id}/assign", response_model=SupportTicketRead)
async def assign_support_ticket(
    ticket_id: int,
    assign_data: SupportTicketAssign,
    current_user = Depends(get_current_user)
):
    """Assign ticket to support agent. Admin only."""
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    if not support_tickets_service.ticket_exists(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")

    assignee_role = support_tickets_service.get_assignee_role(assign_data.assigned_to)
    if assignee_role is None:
        raise HTTPException(status_code=404, detail="Assignee not found")
    if assignee_role != "admin":
        raise HTTPException(status_code=400, detail="Can only assign to admin users")

    support_tickets_service.assign_ticket(ticket_id, assign_data.assigned_to)
    return support_tickets_service.get_ticket_by_id(ticket_id)


@router.post("/{ticket_id}/resolve", response_model=SupportTicketRead)
async def resolve_support_ticket(
    ticket_id: int,
    resolve_data: SupportTicketResolve,
    current_user = Depends(get_current_user)
):
    """Resolve a support ticket. Admin only."""
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    if not support_tickets_service.ticket_exists(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")

    support_tickets_service.resolve_ticket(ticket_id)
    return support_tickets_service.get_ticket_by_id(ticket_id)


@router.post("/{ticket_id}/close", response_model=SupportTicketRead)
async def close_support_ticket(
    ticket_id: int,
    current_user = Depends(get_current_user)
):
    """Close a support ticket. Ticket creator or admin can close."""
    ticket = support_tickets_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not _is_admin(current_user) and ticket["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if ticket["status"] == "closed":
        raise HTTPException(status_code=400, detail="Ticket already closed")

    support_tickets_service.close_ticket(ticket_id)
    return support_tickets_service.get_ticket_by_id(ticket_id)


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_support_ticket(
    ticket_id: int,
    current_user = Depends(get_current_user)
):
    """Delete a support ticket. Admin only."""
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    if not support_tickets_service.ticket_exists(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")

    support_tickets_service.delete_ticket(ticket_id)
