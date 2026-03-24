# @AI-HINT: Talent Invitations API - Upwork-style invite-to-bid system
# Uses Turso HTTP API directly (no SQLAlchemy ORM)
"""Talent invitation endpoints for client-initiated freelancer invitations."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import logging
import uuid
logger = logging.getLogger(__name__)

from app.db.turso_http import get_turso_http
from app.core.security import get_current_active_user
from app.models.user import User
from pydantic import BaseModel, Field
from typing import Optional, List

# Define schemas inline for this router
class InvitationCreate(BaseModel):
    """Schema for creating a single invitation."""
    project_id: int
    freelancer_id: int
    message: Optional[str] = Field(None, max_length=1000)
    budget_hint: Optional[float] = None
    expires_in_days: int = 7

class InvitationBulkCreate(BaseModel):
    """Schema for sending invitations to multiple freelancers."""
    project_id: int
    freelancer_ids: List[int] = Field(..., min_length=1, max_length=50)
    message: Optional[str] = Field(None, max_length=1000)
    budget_hint: Optional[float] = None
    expires_in_days: int = 7

class InvitationStatusUpdate(BaseModel):
    """Schema for responding to an invitation."""
    status: str
    message: Optional[str] = None

router = APIRouter()


# =====================
# HELPER FUNCTIONS
# =====================

def _row_to_invitation(row: list, columns: list) -> dict:
    """Convert database row to invitation dict."""
    inv = {}
    for i, col in enumerate(columns):
        inv[col] = row[i] if i < len(row) else None
    return inv


def _get_freelancer_info(turso, user_id: int) -> Optional[dict]:
    """Get freelancer information for invitation."""
    result = turso.execute("""
        SELECT id, full_name, email, avatar_url, title, hourly_rate
        FROM users WHERE id = ? AND user_type = 'freelancer'
    """, [user_id])
    
    if not result.get("rows"):
        return None
    
    row = result["rows"][0]
    return {
        "id": row[0],
        "full_name": row[1],
        "email": row[2],
        "avatar_url": row[3],
        "title": row[4],
        "hourly_rate": row[5]
    }


def _get_project_info(turso, project_id: int) -> Optional[dict]:
    """Get project information for invitation."""
    result = turso.execute("""
        SELECT id, title, description, budget_type, min_budget, max_budget, client_id, status
        FROM projects WHERE id = ?
    """, [project_id])
    
    if not result.get("rows"):
        return None
    
    row = result["rows"][0]
    return {
        "id": row[0],
        "title": row[1],
        "description": row[2],
        "budget_type": row[3],
        "min_budget": row[4],
        "max_budget": row[5],
        "client_id": row[6],
        "status": row[7]
    }


# =====================
# ENDPOINTS
# =====================

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_invitation(
    invitation: InvitationCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Invite a freelancer to apply for a project."""
    if current_user.user_type != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can invite freelancers"
        )
    
    turso = get_turso_http()
    
    # Verify project exists and belongs to client
    project = _get_project_info(turso, invitation.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only invite freelancers to your own projects")
    
    if project["status"] not in ["open", "active"]:
        raise HTTPException(status_code=400, detail="Project is not accepting applications")
    
    # Verify freelancer exists
    freelancer = _get_freelancer_info(turso, invitation.freelancer_id)
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    
    # Check for existing pending invitation
    existing = turso.execute("""
        SELECT id FROM talent_invitations 
        WHERE project_id = ? AND freelancer_id = ? AND status = 'pending'
    """, [invitation.project_id, invitation.freelancer_id])
    
    if existing.get("rows"):
        raise HTTPException(status_code=400, detail="Invitation already sent to this freelancer")
    
    # Create invitation
    invitation_id = str(uuid.uuid4())[:8]
    expires_at = (datetime.now(timezone.utc) + timedelta(days=invitation.expires_in_days or 7)).isoformat()
    
    turso.execute("""
        INSERT INTO talent_invitations (
            id, project_id, client_id, freelancer_id, message,
            budget_hint, status, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
    """, [
        invitation_id, invitation.project_id, current_user.id,
        invitation.freelancer_id, invitation.message, invitation.budget_hint,
        expires_at
    ])
    
    return {
        "id": invitation_id,
        "project_id": invitation.project_id,
        "project_title": project["title"],
        "freelancer_id": invitation.freelancer_id,
        "freelancer_name": freelancer["full_name"],
        "message": invitation.message,
        "budget_hint": invitation.budget_hint,
        "status": "pending",
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/bulk", response_model=dict)
def create_bulk_invitations(
    bulk: InvitationBulkCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Invite multiple freelancers to a project."""
    if current_user.user_type != "client":
        raise HTTPException(status_code=403, detail="Only clients can invite freelancers")
    
    turso = get_turso_http()
    
    # Verify project
    project = _get_project_info(turso, bulk.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only invite freelancers to your own projects")
    
    if project["status"] not in ["open", "active"]:
        raise HTTPException(status_code=400, detail="Project is not accepting applications")
    
    created = []
    skipped = []
    
    expires_at = (datetime.now(timezone.utc) + timedelta(days=bulk.expires_in_days or 7)).isoformat()
    
    for freelancer_id in bulk.freelancer_ids:
        # Check if freelancer exists
        freelancer = _get_freelancer_info(turso, freelancer_id)
        if not freelancer:
            skipped.append({"freelancer_id": freelancer_id, "reason": "Freelancer not found"})
            continue
        
        # Check for existing invitation
        existing = turso.execute("""
            SELECT id FROM talent_invitations 
            WHERE project_id = ? AND freelancer_id = ? AND status = 'pending'
        """, [bulk.project_id, freelancer_id])
        
        if existing.get("rows"):
            skipped.append({"freelancer_id": freelancer_id, "reason": "Already invited"})
            continue
        
        # Create invitation
        invitation_id = str(uuid.uuid4())[:8]
        turso.execute("""
            INSERT INTO talent_invitations (
                id, project_id, client_id, freelancer_id, message,
                budget_hint, status, expires_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))
        """, [
            invitation_id, bulk.project_id, current_user.id,
            freelancer_id, bulk.message, bulk.budget_hint, expires_at
        ])
        
        created.append({
            "id": invitation_id,
            "freelancer_id": freelancer_id,
            "freelancer_name": freelancer["full_name"]
        })
    
    return {
        "project_id": bulk.project_id,
        "project_title": project["title"],
        "invitations_created": len(created),
        "invitations_skipped": len(skipped),
        "created": created,
        "skipped": skipped
    }


@router.get("/received", response_model=dict)
def list_received_invitations(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user)
):
    """List invitations received by current freelancer."""
    if current_user.user_type != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can view received invitations")
    
    turso = get_turso_http()
    
    sql = """
    SELECT ti.*, p.title as project_title, p.description as project_description,
           p.budget_type, p.min_budget, p.max_budget,
           u.full_name as client_name, u.avatar_url as client_avatar
    FROM talent_invitations ti
    LEFT JOIN projects p ON ti.project_id = p.id
    LEFT JOIN users u ON ti.client_id = u.id
    WHERE ti.freelancer_id = ?
    """
    params = [current_user.id]
    
    if status_filter:
        sql += " AND ti.status = ?"
        params.append(status_filter)
    
    # Count total
    count_sql = sql.replace("SELECT ti.*, p.title as project_title, p.description as project_description,\n           p.budget_type, p.min_budget, p.max_budget,\n           u.full_name as client_name, u.avatar_url as client_avatar", "SELECT COUNT(*)")
    count_result = turso.execute(count_sql, params)
    total = count_result["rows"][0][0] if count_result.get("rows") else 0
    
    sql += " ORDER BY ti.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    result = turso.execute(sql, params)
    
    invitations = []
    columns = result.get("columns", [])
    for row in result.get("rows", []):
        inv = _row_to_invitation(row, columns)
        invitations.append(inv)
    
    return {
        "invitations": invitations,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/sent", response_model=dict)
def list_sent_invitations(
    project_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user)
):
    """List invitations sent by current client."""
    if current_user.user_type != "client":
        raise HTTPException(status_code=403, detail="Only clients can view sent invitations")
    
    turso = get_turso_http()
    
    sql = """
    SELECT ti.*, p.title as project_title,
           u.full_name as freelancer_name, u.avatar_url as freelancer_avatar,
           u.title as freelancer_title, u.hourly_rate
    FROM talent_invitations ti
    LEFT JOIN projects p ON ti.project_id = p.id
    LEFT JOIN users u ON ti.freelancer_id = u.id
    WHERE ti.client_id = ?
    """
    params = [current_user.id]
    
    if project_id:
        sql += " AND ti.project_id = ?"
        params.append(project_id)
    
    if status_filter:
        sql += " AND ti.status = ?"
        params.append(status_filter)
    
    # Count
    count_sql = sql.replace("SELECT ti.*, p.title as project_title,\n           u.full_name as freelancer_name, u.avatar_url as freelancer_avatar,\n           u.title as freelancer_title, u.hourly_rate", "SELECT COUNT(*)")
    count_result = turso.execute(count_sql, params)
    total = count_result["rows"][0][0] if count_result.get("rows") else 0
    
    sql += " ORDER BY ti.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    result = turso.execute(sql, params)
    
    invitations = []
    columns = result.get("columns", [])
    for row in result.get("rows", []):
        inv = _row_to_invitation(row, columns)
        invitations.append(inv)
    
    return {
        "invitations": invitations,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{invitation_id}", response_model=dict)
def get_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get invitation details."""
    turso = get_turso_http()
    
    result = turso.execute("""
        SELECT ti.*, p.title as project_title, p.description as project_description,
               p.budget_type, p.min_budget, p.max_budget, p.status as project_status,
               c.full_name as client_name, c.avatar_url as client_avatar,
               f.full_name as freelancer_name, f.avatar_url as freelancer_avatar
        FROM talent_invitations ti
        LEFT JOIN projects p ON ti.project_id = p.id
        LEFT JOIN users c ON ti.client_id = c.id
        LEFT JOIN users f ON ti.freelancer_id = f.id
        WHERE ti.id = ?
    """, [invitation_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    row = result["rows"][0]
    columns = result.get("columns", [])
    inv = _row_to_invitation(row, columns)
    
    # Check authorization
    if current_user.id not in [inv.get("client_id"), inv.get("freelancer_id")]:
        raise HTTPException(status_code=403, detail="Not authorized to view this invitation")
    
    return inv


@router.patch("/{invitation_id}/respond", response_model=dict)
def respond_to_invitation(
    invitation_id: str,
    response: InvitationStatusUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Accept or decline an invitation (freelancer only)."""
    if current_user.user_type != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can respond to invitations")
    
    if response.status not in ["accepted", "declined"]:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'declined'")
    
    turso = get_turso_http()
    
    # Get invitation
    result = turso.execute("""
        SELECT * FROM talent_invitations WHERE id = ?
    """, [invitation_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    row = result["rows"][0]
    columns = result.get("columns", [])
    inv = _row_to_invitation(row, columns)
    
    # Check ownership
    if inv.get("freelancer_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not your invitation")
    
    # Check status
    if inv.get("status") != "pending":
        raise HTTPException(status_code=400, detail=f"Invitation already {inv.get('status')}")
    
    # Check expiration
    expires_at = inv.get("expires_at")
    if expires_at:
        exp_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00')) if isinstance(expires_at, str) else expires_at
        if exp_dt < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invitation has expired")
    
    # Update invitation
    turso.execute("""
        UPDATE talent_invitations
        SET status = ?, responded_at = datetime('now'), response_message = ?, updated_at = datetime('now')
        WHERE id = ?
    """, [response.status, response.message, invitation_id])
    
    return {
        "id": invitation_id,
        "status": response.status,
        "message": "Invitation accepted" if response.status == "accepted" else "Invitation declined"
    }


@router.delete("/{invitation_id}", response_model=dict)
def cancel_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Cancel a pending invitation (client only)."""
    if current_user.user_type != "client":
        raise HTTPException(status_code=403, detail="Only clients can cancel invitations")
    
    turso = get_turso_http()
    
    # Get invitation
    result = turso.execute("SELECT * FROM talent_invitations WHERE id = ?", [invitation_id])
    
    if not result.get("rows"):
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    row = result["rows"][0]
    columns = result.get("columns", [])
    inv = _row_to_invitation(row, columns)
    
    if inv.get("client_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not your invitation")
    
    if inv.get("status") != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot cancel {inv.get('status')} invitation")
    
    turso.execute("""
        UPDATE talent_invitations SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?
    """, [invitation_id])
    
    return {"id": invitation_id, "status": "cancelled", "message": "Invitation cancelled"}


@router.get("/suggested-freelancers/{project_id}", response_model=dict)
def get_suggested_freelancers(
    project_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user)
):
    """Get suggested freelancers for a project based on skills match."""
    if current_user.user_type != "client":
        raise HTTPException(status_code=403, detail="Only clients can view suggested freelancers")
    
    turso = get_turso_http()
    
    # Verify project ownership
    project = _get_project_info(turso, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project["client_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    # Get project skills
    skills_result = turso.execute("""
        SELECT skill FROM project_skills WHERE project_id = ?
    """, [project_id])
    
    project_skills = [row[0] for row in skills_result.get("rows", [])]
    
    if not project_skills:
        # If no skills, return top-rated freelancers
        result = turso.execute("""
            SELECT u.id, u.full_name, u.avatar_url, u.title, u.hourly_rate,
                   s.jss_score, s.completed_orders, s.average_rating, s.level
            FROM users u
            LEFT JOIN seller_stats s ON u.id = s.user_id
            WHERE u.user_type = 'freelancer'
            ORDER BY s.jss_score DESC NULLS LAST
            LIMIT ?
        """, [limit])
    else:
        # Match by skills (simplified - in production use full-text search or skill tables)
        # For now, just get top freelancers
        result = turso.execute("""
            SELECT u.id, u.full_name, u.avatar_url, u.title, u.hourly_rate,
                   s.jss_score, s.completed_orders, s.average_rating, s.level
            FROM users u
            LEFT JOIN seller_stats s ON u.id = s.user_id
            WHERE u.user_type = 'freelancer'
            ORDER BY s.jss_score DESC NULLS LAST
            LIMIT ?
        """, [limit])
    
    # Check for existing invitations
    existing_invites = turso.execute("""
        SELECT freelancer_id, status FROM talent_invitations WHERE project_id = ?
    """, [project_id])
    
    invited_map = {row[0]: row[1] for row in existing_invites.get("rows", [])}
    
    freelancers = []
    for row in result.get("rows", []):
        freelancer_id = row[0]
        invite_status = invited_map.get(freelancer_id)
        
        freelancers.append({
            "id": freelancer_id,
            "full_name": row[1],
            "avatar_url": row[2],
            "title": row[3],
            "hourly_rate": row[4],
            "jss_score": row[5],
            "completed_orders": row[6],
            "average_rating": row[7],
            "level": row[8] or "new_seller",
            "already_invited": invite_status is not None,
            "invitation_status": invite_status
        })
    
    return {
        "project_id": project_id,
        "project_title": project["title"],
        "suggested_freelancers": freelancers,
        "skills_matched": project_skills
    }
