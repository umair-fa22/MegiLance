# @AI-HINT: Team collaboration tools for agency/team freelancing
"""Team Collaboration Service - Multi-user team and agency management."""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)


class TeamRole(str, Enum):
    """Team member roles."""
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"
    VIEWER = "viewer"


class TeamPermission(str, Enum):
    """Team permissions."""
    MANAGE_TEAM = "manage_team"
    MANAGE_MEMBERS = "manage_members"
    MANAGE_PROJECTS = "manage_projects"
    SUBMIT_PROPOSALS = "submit_proposals"
    VIEW_EARNINGS = "view_earnings"
    MANAGE_BILLING = "manage_billing"
    VIEW_ANALYTICS = "view_analytics"
    MANAGE_SETTINGS = "manage_settings"


class InvitationStatus(str, Enum):
    """Team invitation status."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


# Role to permissions mapping
ROLE_PERMISSIONS = {
    TeamRole.OWNER: [p for p in TeamPermission],  # All permissions
    TeamRole.ADMIN: [
        TeamPermission.MANAGE_MEMBERS,
        TeamPermission.MANAGE_PROJECTS,
        TeamPermission.SUBMIT_PROPOSALS,
        TeamPermission.VIEW_EARNINGS,
        TeamPermission.VIEW_ANALYTICS,
        TeamPermission.MANAGE_SETTINGS
    ],
    TeamRole.MANAGER: [
        TeamPermission.MANAGE_PROJECTS,
        TeamPermission.SUBMIT_PROPOSALS,
        TeamPermission.VIEW_EARNINGS,
        TeamPermission.VIEW_ANALYTICS
    ],
    TeamRole.MEMBER: [
        TeamPermission.SUBMIT_PROPOSALS,
        TeamPermission.VIEW_EARNINGS
    ],
    TeamRole.VIEWER: []
}


class TeamCollaborationService:
    """
    Team and agency management for collaborative freelancing.
    
    Enables teams to share workspaces, split earnings,
    and collaborate on projects.
    """
    
    def __init__(self):
        pass
        
        # In-memory stores
        self._teams: Dict[str, Dict] = {}
        self._user_teams: Dict[int, List[str]] = defaultdict(list)
        self._invitations: Dict[str, Dict] = {}
        self._team_projects: Dict[str, List[int]] = defaultdict(list)
        self._activity_feed: Dict[str, List[Dict]] = defaultdict(list)
        self._shared_resources: Dict[str, List[Dict]] = defaultdict(list)
    
    async def create_team(
        self,
        owner_id: int,
        name: str,
        description: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new team."""
        team_id = f"team_{secrets.token_hex(8)}"
        
        team = {
            "id": team_id,
            "name": name,
            "description": description or "",
            "owner_id": owner_id,
            "members": [{
                "user_id": owner_id,
                "role": TeamRole.OWNER.value,
                "permissions": [p.value for p in TeamPermission],
                "earnings_split": 100.0,  # Owner gets 100% by default
                "joined_at": datetime.now(timezone.utc).isoformat()
            }],
            "settings": {
                "default_earnings_split": "equal",  # equal, custom, project-based
                "auto_accept_proposals": False,
                "shared_wallet": False,
                "visibility": "private",  # private, public, invite-only
                **(settings or {})
            },
            "stats": {
                "total_earnings": 0.0,
                "projects_completed": 0,
                "active_projects": 0,
                "average_rating": 0.0
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        self._teams[team_id] = team
        self._user_teams[owner_id].append(team_id)
        
        # Log activity
        await self._log_activity(team_id, owner_id, "team_created", {
            "team_name": name
        })
        
        return {
            "team_id": team_id,
            "team": team,
            "status": "created"
        }
    
    async def get_team(self, team_id: str) -> Optional[Dict[str, Any]]:
        """Get team details."""
        return self._teams.get(team_id)
    
    async def update_team(
        self,
        team_id: str,
        user_id: int,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update team settings."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        # Check permission
        if not self._has_permission(team, user_id, TeamPermission.MANAGE_SETTINGS):
            return {"error": "Permission denied"}
        
        # Apply updates
        if "name" in updates:
            team["name"] = updates["name"]
        if "description" in updates:
            team["description"] = updates["description"]
        if "settings" in updates:
            team["settings"].update(updates["settings"])
        
        team["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await self._log_activity(team_id, user_id, "team_updated", updates)
        
        return {"status": "updated", "team": team}
    
    async def invite_member(
        self,
        team_id: str,
        inviter_id: int,
        invitee_email: str,
        role: TeamRole = TeamRole.MEMBER,
        custom_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Invite a user to join the team."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        # Check permission
        if not self._has_permission(team, inviter_id, TeamPermission.MANAGE_MEMBERS):
            return {"error": "Permission denied"}
        
        # Check if already invited
        existing = [
            i for i in self._invitations.values()
            if i["team_id"] == team_id 
            and i["invitee_email"] == invitee_email
            and i["status"] == InvitationStatus.PENDING.value
        ]
        if existing:
            return {"error": "User already invited"}
        
        invitation_id = f"inv_{secrets.token_hex(8)}"
        invitation_token = secrets.token_urlsafe(32)
        
        invitation = {
            "id": invitation_id,
            "team_id": team_id,
            "team_name": team["name"],
            "inviter_id": inviter_id,
            "invitee_email": invitee_email,
            "role": role.value,
            "token": invitation_token,
            "custom_message": custom_message,
            "status": InvitationStatus.PENDING.value,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        }
        
        self._invitations[invitation_id] = invitation
        
        await self._log_activity(team_id, inviter_id, "member_invited", {
            "invitee_email": invitee_email,
            "role": role.value
        })
        
        return {
            "invitation_id": invitation_id,
            "token": invitation_token,
            "status": "sent",
            "expires_at": invitation["expires_at"]
        }
    
    async def accept_invitation(
        self,
        invitation_token: str,
        user_id: int
    ) -> Dict[str, Any]:
        """Accept a team invitation."""
        # Find invitation by token
        invitation = None
        for inv in self._invitations.values():
            if inv["token"] == invitation_token:
                invitation = inv
                break
        
        if not invitation:
            return {"error": "Invalid invitation"}
        
        if invitation["status"] != InvitationStatus.PENDING.value:
            return {"error": f"Invitation already {invitation['status']}"}
        
        # Check expiration
        expires_at = datetime.fromisoformat(invitation["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            invitation["status"] = InvitationStatus.EXPIRED.value
            return {"error": "Invitation expired"}
        
        team_id = invitation["team_id"]
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team no longer exists"}
        
        # Add member
        role = TeamRole(invitation["role"])
        member = {
            "user_id": user_id,
            "role": role.value,
            "permissions": [p.value for p in ROLE_PERMISSIONS[role]],
            "earnings_split": self._calculate_default_split(team),
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        
        team["members"].append(member)
        invitation["status"] = InvitationStatus.ACCEPTED.value
        
        self._user_teams[user_id].append(team_id)
        
        await self._log_activity(team_id, user_id, "member_joined", {
            "role": role.value
        })
        
        return {
            "status": "accepted",
            "team_id": team_id,
            "team_name": team["name"],
            "role": role.value
        }
    
    async def remove_member(
        self,
        team_id: str,
        remover_id: int,
        member_id: int
    ) -> Dict[str, Any]:
        """Remove a member from the team."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        # Check permission (or self-removal)
        if remover_id != member_id:
            if not self._has_permission(team, remover_id, TeamPermission.MANAGE_MEMBERS):
                return {"error": "Permission denied"}
        
        # Can't remove owner
        member = self._get_member(team, member_id)
        if not member:
            return {"error": "Member not found"}
        
        if member["role"] == TeamRole.OWNER.value:
            return {"error": "Cannot remove team owner"}
        
        # Remove member
        team["members"] = [m for m in team["members"] if m["user_id"] != member_id]
        
        if team_id in self._user_teams[member_id]:
            self._user_teams[member_id].remove(team_id)
        
        await self._log_activity(team_id, remover_id, "member_removed", {
            "removed_user_id": member_id
        })
        
        return {"status": "removed"}
    
    async def update_member_role(
        self,
        team_id: str,
        updater_id: int,
        member_id: int,
        new_role: TeamRole
    ) -> Dict[str, Any]:
        """Update a member's role."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        # Check permission
        if not self._has_permission(team, updater_id, TeamPermission.MANAGE_MEMBERS):
            return {"error": "Permission denied"}
        
        member = self._get_member(team, member_id)
        if not member:
            return {"error": "Member not found"}
        
        # Can't change owner role
        if member["role"] == TeamRole.OWNER.value:
            return {"error": "Cannot change owner role"}
        
        old_role = member["role"]
        member["role"] = new_role.value
        member["permissions"] = [p.value for p in ROLE_PERMISSIONS[new_role]]
        
        await self._log_activity(team_id, updater_id, "role_changed", {
            "member_id": member_id,
            "old_role": old_role,
            "new_role": new_role.value
        })
        
        return {"status": "updated", "new_role": new_role.value}
    
    async def set_earnings_split(
        self,
        team_id: str,
        updater_id: int,
        splits: Dict[int, float]
    ) -> Dict[str, Any]:
        """Set earnings split for team members."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        # Check permission
        if not self._has_permission(team, updater_id, TeamPermission.MANAGE_BILLING):
            return {"error": "Permission denied"}
        
        # Validate splits total 100%
        total = sum(splits.values())
        if abs(total - 100.0) > 0.01:
            return {"error": "Splits must total 100%"}
        
        # Apply splits
        for member in team["members"]:
            if member["user_id"] in splits:
                member["earnings_split"] = splits[member["user_id"]]
        
        await self._log_activity(team_id, updater_id, "earnings_split_updated", {
            "splits": splits
        })
        
        return {"status": "updated", "splits": splits}
    
    async def assign_project(
        self,
        team_id: str,
        user_id: int,
        project_id: int,
        assigned_members: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Assign a project to the team."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        # Check permission
        if not self._has_permission(team, user_id, TeamPermission.MANAGE_PROJECTS):
            return {"error": "Permission denied"}
        
        self._team_projects[team_id].append(project_id)
        team["stats"]["active_projects"] += 1
        
        await self._log_activity(team_id, user_id, "project_assigned", {
            "project_id": project_id,
            "assigned_members": assigned_members
        })
        
        return {
            "status": "assigned",
            "project_id": project_id,
            "team_id": team_id
        }
    
    async def share_resource(
        self,
        team_id: str,
        user_id: int,
        resource_type: str,
        resource_data: Dict[str, Any],
        visibility: str = "team"
    ) -> Dict[str, Any]:
        """Share a resource with the team."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        # Check if user is member
        if not self._get_member(team, user_id):
            return {"error": "Not a team member"}
        
        resource_id = f"res_{secrets.token_hex(8)}"
        
        resource = {
            "id": resource_id,
            "type": resource_type,  # file, link, template, snippet
            "data": resource_data,
            "shared_by": user_id,
            "visibility": visibility,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        self._shared_resources[team_id].append(resource)
        
        await self._log_activity(team_id, user_id, "resource_shared", {
            "resource_id": resource_id,
            "type": resource_type
        })
        
        return {"resource_id": resource_id, "status": "shared"}
    
    async def get_team_resources(
        self,
        team_id: str,
        user_id: int,
        resource_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get shared team resources."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        if not self._get_member(team, user_id):
            return {"error": "Not a team member"}
        
        resources = self._shared_resources.get(team_id, [])
        
        if resource_type:
            resources = [r for r in resources if r["type"] == resource_type]
        
        return {"resources": resources, "count": len(resources)}
    
    async def get_activity_feed(
        self,
        team_id: str,
        user_id: int,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get team activity feed."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        if not self._get_member(team, user_id):
            return {"error": "Not a team member"}
        
        activities = self._activity_feed.get(team_id, [])[-limit:]
        activities.reverse()  # Most recent first
        
        return {"activities": activities, "count": len(activities)}
    
    async def get_team_analytics(
        self,
        team_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """Get team analytics and performance metrics."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        if not self._has_permission(team, user_id, TeamPermission.VIEW_ANALYTICS):
            return {"error": "Permission denied"}
        
        # Build analytics
        analytics = {
            "overview": team["stats"],
            "members": {
                "total": len(team["members"]),
                "by_role": defaultdict(int)
            },
            "projects": {
                "total": len(self._team_projects.get(team_id, [])),
                "active": team["stats"]["active_projects"],
                "completed": team["stats"]["projects_completed"]
            },
            "earnings": {
                "total": team["stats"]["total_earnings"],
                "by_member": {}
            }
        }
        
        for member in team["members"]:
            analytics["members"]["by_role"][member["role"]] += 1
            # Would calculate actual earnings per member in production
            analytics["earnings"]["by_member"][member["user_id"]] = 0.0
        
        return analytics
    
    async def get_user_teams(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all teams a user belongs to."""
        team_ids = self._user_teams.get(user_id, [])
        teams = []
        
        for team_id in team_ids:
            team = self._teams.get(team_id)
            if team:
                member = self._get_member(team, user_id)
                teams.append({
                    "id": team_id,
                    "name": team["name"],
                    "role": member["role"] if member else None,
                    "member_count": len(team["members"]),
                    "created_at": team["created_at"]
                })
        
        return teams
    
    async def transfer_ownership(
        self,
        team_id: str,
        owner_id: int,
        new_owner_id: int
    ) -> Dict[str, Any]:
        """Transfer team ownership."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        # Verify current owner
        if team["owner_id"] != owner_id:
            return {"error": "Only owner can transfer ownership"}
        
        # Verify new owner is a member
        new_owner = self._get_member(team, new_owner_id)
        if not new_owner:
            return {"error": "New owner must be a team member"}
        
        # Transfer ownership
        old_owner = self._get_member(team, owner_id)
        if old_owner:
            old_owner["role"] = TeamRole.ADMIN.value
            old_owner["permissions"] = [p.value for p in ROLE_PERMISSIONS[TeamRole.ADMIN]]
        
        new_owner["role"] = TeamRole.OWNER.value
        new_owner["permissions"] = [p.value for p in TeamPermission]
        team["owner_id"] = new_owner_id
        
        await self._log_activity(team_id, owner_id, "ownership_transferred", {
            "new_owner_id": new_owner_id
        })
        
        return {"status": "transferred", "new_owner_id": new_owner_id}
    
    async def delete_team(
        self,
        team_id: str,
        owner_id: int
    ) -> Dict[str, Any]:
        """Delete a team."""
        team = self._teams.get(team_id)
        if not team:
            return {"error": "Team not found"}
        
        if team["owner_id"] != owner_id:
            return {"error": "Only owner can delete team"}
        
        # Remove from all members
        for member in team["members"]:
            user_id = member["user_id"]
            if team_id in self._user_teams[user_id]:
                self._user_teams[user_id].remove(team_id)
        
        # Clean up
        del self._teams[team_id]
        if team_id in self._team_projects:
            del self._team_projects[team_id]
        if team_id in self._activity_feed:
            del self._activity_feed[team_id]
        if team_id in self._shared_resources:
            del self._shared_resources[team_id]
        
        return {"status": "deleted"}
    
    def _has_permission(
        self,
        team: Dict,
        user_id: int,
        permission: TeamPermission
    ) -> bool:
        """Check if user has specific permission."""
        member = self._get_member(team, user_id)
        if not member:
            return False
        return permission.value in member.get("permissions", [])
    
    def _get_member(
        self,
        team: Dict,
        user_id: int
    ) -> Optional[Dict]:
        """Get member from team."""
        for member in team.get("members", []):
            if member["user_id"] == user_id:
                return member
        return None
    
    def _calculate_default_split(self, team: Dict) -> float:
        """Calculate default earnings split for new member."""
        split_mode = team["settings"].get("default_earnings_split", "equal")
        
        if split_mode == "equal":
            member_count = len(team["members"]) + 1  # Including new member
            return 100.0 / member_count
        
        return 0.0  # Custom mode starts at 0
    
    async def _log_activity(
        self,
        team_id: str,
        user_id: int,
        action: str,
        details: Dict[str, Any]
    ) -> None:
        """Log team activity."""
        activity = {
            "id": f"act_{secrets.token_hex(6)}",
            "user_id": user_id,
            "action": action,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        self._activity_feed[team_id].append(activity)
        
        # Keep only last 500 activities
        if len(self._activity_feed[team_id]) > 500:
            self._activity_feed[team_id] = self._activity_feed[team_id][-500:]


# Singleton instance
_team_service: Optional[TeamCollaborationService] = None


def get_team_service() -> TeamCollaborationService:
    """Get or create team service instance."""
    global _team_service
    if _team_service is None:
        _team_service = TeamCollaborationService()
    return _team_service
