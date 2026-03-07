# @AI-HINT: Organizations API endpoints for multi-tenant workspace management
"""
Organizations API - Workspace and team management endpoints.

Features:
- CRUD for organizations
- Member management
- Role-based access
- Organization invites
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

from app.core.security import get_current_active_user
from app.services.db_utils import sanitize_text
from app.models.user import User
from app.services.organizations import (
    get_organization_service,
    OrganizationType,
    OrganizationRole,
    ROLE_PERMISSIONS
)

router = APIRouter(prefix="/organizations", tags=["organizations"])


# Request/Response Models
class CreateOrganizationRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    org_type: OrganizationType
    description: Optional[str] = None
    website: Optional[str] = None


class UpdateOrganizationRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    settings: Optional[dict] = None


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: OrganizationRole = OrganizationRole.MEMBER
    message: Optional[str] = None


class UpdateMemberRoleRequest(BaseModel):
    role: OrganizationRole


class AcceptInviteRequest(BaseModel):
    token: str


class TransferOwnershipRequest(BaseModel):
    new_owner_id: str


# Endpoints
@router.post("")
async def create_organization(
    request: CreateOrganizationRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Create a new organization."""
    service = get_organization_service()
    
    org = await service.create_organization(
        owner_id=current_user["id"],
        name=sanitize_text(request.name, 100),
        org_type=request.org_type,
        description=sanitize_text(request.description, 1000) if request.description else None,
        website=sanitize_text(request.website, 500) if request.website else None
    )
    
    return {"organization": org, "message": "Organization created successfully"}


@router.get("")
async def get_my_organizations(
    ,
    current_user = Depends(get_current_active_user)
):
    """Get all organizations the current user belongs to."""
    service = get_organization_service()
    
    orgs = await service.get_user_organizations(current_user["id"])
    
    return {"organizations": orgs}


@router.get("/roles")
async def get_available_roles(
    current_user = Depends(get_current_active_user)
):
    """Get available organization roles and their permissions."""
    roles = []
    for role in OrganizationRole:
        roles.append({
            "role": role.value,
            "permissions": ROLE_PERMISSIONS[role]
        })
    return {"roles": roles}


@router.get("/{org_id}")
async def get_organization(
    org_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get organization details."""
    service = get_organization_service()
    
    org = await service.get_organization(org_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check membership
    member = await service.get_member(org_id, current_user["id"])
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )
    
    return {"organization": org, "your_role": member.role}


@router.put("/{org_id}")
async def update_organization(
    org_id: str,
    request: UpdateOrganizationRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Update organization details."""
    service = get_organization_service()
    
    updates = request.dict(exclude_unset=True)
    org = await service.update_organization(
        org_id=org_id,
        user_id=current_user["id"],
        updates=updates
    )
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found or insufficient permissions"
        )
    
    return {"organization": org, "message": "Organization updated successfully"}


@router.delete("/{org_id}")
async def delete_organization(
    org_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Delete an organization (owner only)."""
    service = get_organization_service()
    
    success = await service.delete_organization(org_id, current_user["id"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization not found or you are not the owner"
        )
    
    return {"message": "Organization deleted successfully"}


@router.get("/{org_id}/stats")
async def get_organization_stats(
    org_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get organization statistics."""
    service = get_organization_service()
    
    # Check membership
    member = await service.get_member(org_id, current_user["id"])
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    stats = await service.get_organization_stats(org_id)
    return stats


# Member Management
@router.get("/{org_id}/members")
async def get_members(
    org_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get all members of an organization."""
    service = get_organization_service()
    
    # Check membership
    member = await service.get_member(org_id, current_user["id"])
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    members = await service.get_members(org_id)
    return {"members": members}


@router.post("/{org_id}/invites")
async def invite_member(
    org_id: str,
    request: InviteMemberRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Invite a new member to the organization."""
    service = get_organization_service()
    
    invite = await service.invite_member(
        org_id=org_id,
        invited_by=current_user["id"],
        email=request.email,
        role=request.role,
        message=sanitize_text(request.message, 500) if request.message else None
    )
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create invite. Check permissions."
        )
    
    return {
        "invite": invite,
        "invite_link": f"https://megilance.com/invite/{invite.token}",
        "message": "Invitation sent successfully"
    }


@router.get("/{org_id}/invites")
async def get_pending_invites(
    org_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get all pending invites for an organization."""
    service = get_organization_service()
    
    # Check membership
    member = await service.get_member(org_id, current_user["id"])
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    invites = await service.get_pending_invites(org_id)
    return {"invites": invites}


@router.post("/invites/accept")
async def accept_invite(
    request: AcceptInviteRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Accept an organization invite."""
    service = get_organization_service()
    
    member = await service.accept_invite(
        token=request.token,
        user_id=current_user["id"]
    )
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite"
        )
    
    return {"member": member, "message": "Welcome to the organization!"}


@router.post("/invites/decline")
async def decline_invite(
    request: AcceptInviteRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Decline an organization invite."""
    service = get_organization_service()
    
    success = await service.decline_invite(request.token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invite"
        )
    
    return {"message": "Invite declined"}


@router.put("/{org_id}/members/{user_id}/role")
async def update_member_role(
    org_id: str,
    user_id: str,
    request: UpdateMemberRoleRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Update a member's role."""
    service = get_organization_service()
    
    member = await service.update_member_role(
        org_id=org_id,
        updated_by=current_user["id"],
        target_user_id=user_id,
        new_role=request.role
    )
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update role. Check permissions."
        )
    
    return {"member": member, "message": "Role updated successfully"}


@router.delete("/{org_id}/members/{user_id}")
async def remove_member(
    org_id: str,
    user_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Remove a member from the organization."""
    service = get_organization_service()
    
    success = await service.remove_member(
        org_id=org_id,
        removed_by=current_user["id"],
        target_user_id=user_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot remove member. Check permissions."
        )
    
    return {"message": "Member removed successfully"}


@router.post("/{org_id}/leave")
async def leave_organization(
    org_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Leave an organization."""
    service = get_organization_service()
    
    success = await service.leave_organization(org_id, current_user["id"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot leave organization. You might be the owner."
        )
    
    return {"message": "You have left the organization"}


@router.post("/{org_id}/transfer-ownership")
async def transfer_ownership(
    org_id: str,
    request: TransferOwnershipRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Transfer organization ownership to another member."""
    service = get_organization_service()
    
    success = await service.transfer_ownership(
        org_id=org_id,
        current_owner_id=current_user["id"],
        new_owner_id=request.new_owner_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot transfer ownership. You must be the owner and the new owner must be a member."
        )
    
    return {"message": "Ownership transferred successfully"}
