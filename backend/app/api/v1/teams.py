# @AI-HINT: API endpoints for team collaboration and agency management
"""
Team Collaboration API - Multi-user team and agency management.

Endpoints for:
- Team creation and management
- Member invitations
- Role management
- Earnings split
- Team analytics
- Shared resources
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.team_collaboration import get_team_service, TeamRole

router = APIRouter(prefix="/teams", tags=["teams"])


# Request/Response Models
class CreateTeamRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    settings: Optional[dict] = None


class UpdateTeamRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "member"
    custom_message: Optional[str] = None


class AcceptInvitationRequest(BaseModel):
    invitation_token: str


class UpdateRoleRequest(BaseModel):
    member_id: int
    role: str


class EarningsSplitRequest(BaseModel):
    splits: dict  # user_id -> percentage


class AssignProjectRequest(BaseModel):
    project_id: int
    assigned_members: Optional[List[int]] = None


class ShareResourceRequest(BaseModel):
    resource_type: str
    resource_data: dict
    visibility: str = "team"


class TransferOwnershipRequest(BaseModel):
    new_owner_id: int


# Endpoints
@router.post("/create")
async def create_team(
    request: CreateTeamRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Create a new team."""
    service = get_team_service()
    
    result = await service.create_team(
        owner_id=current_user.id,
        name=request.name,
        description=request.description,
        settings=request.settings
    )
    
    return result


@router.get("/my-teams")
async def get_my_teams(
    current_user: User = Depends(get_current_active_user),
    
):
    """Get all teams the user belongs to."""
    service = get_team_service()
    
    teams = await service.get_user_teams(current_user.id)
    
    return {"teams": teams, "count": len(teams)}


@router.get("/{team_id}")
async def get_team(
    team_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get team details."""
    service = get_team_service()
    
    team = await service.get_team(team_id)
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Verify user is a member
    member_ids = [m["user_id"] for m in team["members"]]
    if current_user.id not in member_ids:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return team


@router.put("/{team_id}")
async def update_team(
    team_id: str,
    request: UpdateTeamRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Update team settings."""
    service = get_team_service()
    
    result = await service.update_team(
        team_id=team_id,
        user_id=current_user.id,
        updates=request.model_dump(exclude_none=True)
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{team_id}/invite")
async def invite_member(
    team_id: str,
    request: InviteMemberRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Invite a user to join the team."""
    service = get_team_service()
    
    try:
        role = TeamRole(request.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await service.invite_member(
        team_id=team_id,
        inviter_id=current_user.id,
        invitee_email=request.email,
        role=role,
        custom_message=request.custom_message
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/accept-invitation")
async def accept_invitation(
    request: AcceptInvitationRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Accept a team invitation."""
    service = get_team_service()
    
    result = await service.accept_invitation(
        invitation_token=request.invitation_token,
        user_id=current_user.id
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.delete("/{team_id}/members/{member_id}")
async def remove_member(
    team_id: str,
    member_id: int,
    current_user: User = Depends(get_current_active_user),
    
):
    """Remove a member from the team."""
    service = get_team_service()
    
    result = await service.remove_member(
        team_id=team_id,
        remover_id=current_user.id,
        member_id=member_id
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.put("/{team_id}/members/role")
async def update_member_role(
    team_id: str,
    request: UpdateRoleRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Update a member's role."""
    service = get_team_service()
    
    try:
        role = TeamRole(request.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await service.update_member_role(
        team_id=team_id,
        updater_id=current_user.id,
        member_id=request.member_id,
        new_role=role
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.put("/{team_id}/earnings-split")
async def set_earnings_split(
    team_id: str,
    request: EarningsSplitRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Set earnings split for team members."""
    service = get_team_service()
    
    # Convert string keys to int
    splits = {int(k): v for k, v in request.splits.items()}
    
    result = await service.set_earnings_split(
        team_id=team_id,
        updater_id=current_user.id,
        splits=splits
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{team_id}/projects/assign")
async def assign_project(
    team_id: str,
    request: AssignProjectRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Assign a project to the team."""
    service = get_team_service()
    
    result = await service.assign_project(
        team_id=team_id,
        user_id=current_user.id,
        project_id=request.project_id,
        assigned_members=request.assigned_members
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{team_id}/resources")
async def share_resource(
    team_id: str,
    request: ShareResourceRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Share a resource with the team."""
    service = get_team_service()
    
    result = await service.share_resource(
        team_id=team_id,
        user_id=current_user.id,
        resource_type=request.resource_type,
        resource_data=request.resource_data,
        visibility=request.visibility
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/{team_id}/resources")
async def get_team_resources(
    team_id: str,
    resource_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get shared team resources."""
    service = get_team_service()
    
    result = await service.get_team_resources(
        team_id=team_id,
        user_id=current_user.id,
        resource_type=resource_type
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/{team_id}/activity")
async def get_activity_feed(
    team_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get team activity feed."""
    service = get_team_service()
    
    result = await service.get_activity_feed(
        team_id=team_id,
        user_id=current_user.id,
        limit=limit
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/{team_id}/analytics")
async def get_team_analytics(
    team_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Get team analytics and performance metrics."""
    service = get_team_service()
    
    result = await service.get_team_analytics(
        team_id=team_id,
        user_id=current_user.id
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/{team_id}/transfer-ownership")
async def transfer_ownership(
    team_id: str,
    request: TransferOwnershipRequest,
    current_user: User = Depends(get_current_active_user),
    
):
    """Transfer team ownership."""
    service = get_team_service()
    
    result = await service.transfer_ownership(
        team_id=team_id,
        owner_id=current_user.id,
        new_owner_id=request.new_owner_id
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.delete("/{team_id}")
async def delete_team(
    team_id: str,
    current_user: User = Depends(get_current_active_user),
    
):
    """Delete a team."""
    service = get_team_service()
    
    result = await service.delete_team(
        team_id=team_id,
        owner_id=current_user.id
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result
