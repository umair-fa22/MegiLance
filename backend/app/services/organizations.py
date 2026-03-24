# @AI-HINT: Organization/Workspace service for multi-tenant team management
"""Organization Service - Multi-tenant workspace and team management."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel
import logging
import uuid
import secrets
logger = logging.getLogger(__name__)


class OrganizationRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"
    VIEWER = "viewer"


class OrganizationType(str, Enum):
    AGENCY = "agency"
    COMPANY = "company"
    TEAM = "team"
    PERSONAL = "personal"


class InviteStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class Organization(BaseModel):
    """Organization/Workspace model."""
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    org_type: OrganizationType
    logo_url: Optional[str] = None
    website: Optional[str] = None
    owner_id: str
    is_active: bool = True
    settings: Dict[str, Any] = {}
    features: List[str] = []
    member_count: int = 0
    created_at: datetime
    updated_at: datetime


class OrganizationMember(BaseModel):
    """Organization member."""
    id: str
    organization_id: str
    user_id: str
    role: OrganizationRole
    department: Optional[str] = None
    title: Optional[str] = None
    permissions: List[str] = []
    joined_at: datetime
    invited_by: Optional[str] = None


class OrganizationInvite(BaseModel):
    """Organization invite."""
    id: str
    organization_id: str
    email: str
    role: OrganizationRole
    status: InviteStatus = InviteStatus.PENDING
    token: str
    invited_by: str
    message: Optional[str] = None
    expires_at: datetime
    created_at: datetime


# Permission definitions
ROLE_PERMISSIONS = {
    OrganizationRole.OWNER: [
        "org.manage", "org.delete", "org.billing",
        "members.manage", "members.invite", "members.remove",
        "projects.create", "projects.manage", "projects.delete",
        "contracts.manage", "payments.manage", "reports.view"
    ],
    OrganizationRole.ADMIN: [
        "org.manage",
        "members.manage", "members.invite", "members.remove",
        "projects.create", "projects.manage",
        "contracts.manage", "payments.view", "reports.view"
    ],
    OrganizationRole.MANAGER: [
        "members.invite",
        "projects.create", "projects.manage",
        "contracts.view", "reports.view"
    ],
    OrganizationRole.MEMBER: [
        "projects.view", "projects.contribute",
        "contracts.view"
    ],
    OrganizationRole.VIEWER: [
        "projects.view", "contracts.view"
    ]
}


class OrganizationService:
    """Service for organization/workspace management."""
    
    def __init__(self):
        self._organizations: Dict[str, Organization] = {}
        self._members: Dict[str, List[OrganizationMember]] = {}
        self._invites: Dict[str, OrganizationInvite] = {}
        self._user_orgs: Dict[str, List[str]] = {}  # user_id -> org_ids
    
    def _generate_slug(self, name: str) -> str:
        """Generate URL-friendly slug."""
        import re
        slug = name.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')
        return f"{slug}-{uuid.uuid4().hex[:6]}"
    
    async def create_organization(
        self,
        owner_id: str,
        name: str,
        org_type: OrganizationType,
        description: Optional[str] = None,
        website: Optional[str] = None
    ) -> Organization:
        """Create a new organization."""
        org_id = f"org_{uuid.uuid4().hex[:12]}"
        slug = self._generate_slug(name)
        
        org = Organization(
            id=org_id,
            name=name,
            slug=slug,
            description=description,
            org_type=org_type,
            website=website,
            owner_id=owner_id,
            settings={
                "allow_member_invites": True,
                "require_approval_for_projects": False,
                "default_member_role": OrganizationRole.MEMBER.value,
                "notification_settings": {
                    "new_member": True,
                    "project_updates": True,
                    "payment_updates": True
                }
            },
            features=["projects", "proposals", "contracts", "invoices"],
            member_count=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        self._organizations[org_id] = org
        
        # Add owner as first member
        owner_member = OrganizationMember(
            id=f"mem_{uuid.uuid4().hex[:12]}",
            organization_id=org_id,
            user_id=owner_id,
            role=OrganizationRole.OWNER,
            permissions=ROLE_PERMISSIONS[OrganizationRole.OWNER],
            joined_at=datetime.now(timezone.utc)
        )
        
        self._members[org_id] = [owner_member]
        
        # Track user's orgs
        if owner_id not in self._user_orgs:
            self._user_orgs[owner_id] = []
        self._user_orgs[owner_id].append(org_id)
        
        return org
    
    async def get_organization(self, org_id: str) -> Optional[Organization]:
        """Get organization by ID."""
        return self._organizations.get(org_id)
    
    async def get_organization_by_slug(self, slug: str) -> Optional[Organization]:
        """Get organization by slug."""
        for org in self._organizations.values():
            if org.slug == slug:
                return org
        return None
    
    async def get_user_organizations(self, user_id: str) -> List[Organization]:
        """Get all organizations a user belongs to."""
        org_ids = self._user_orgs.get(user_id, [])
        return [self._organizations[oid] for oid in org_ids if oid in self._organizations]
    
    async def update_organization(
        self,
        org_id: str,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Organization]:
        """Update organization settings."""
        org = self._organizations.get(org_id)
        if not org:
            return None
        
        # Check permission
        if not await self._has_permission(org_id, user_id, "org.manage"):
            return None
        
        allowed_fields = ["name", "description", "website", "logo_url", "settings", "features"]
        
        org_dict = org.dict()
        for field in allowed_fields:
            if field in updates:
                org_dict[field] = updates[field]
        
        org_dict["updated_at"] = datetime.now(timezone.utc)
        
        # Regenerate slug if name changed
        if "name" in updates:
            org_dict["slug"] = self._generate_slug(updates["name"])
        
        updated_org = Organization(**org_dict)
        self._organizations[org_id] = updated_org
        return updated_org
    
    async def delete_organization(self, org_id: str, user_id: str) -> bool:
        """Delete an organization (owner only)."""
        org = self._organizations.get(org_id)
        if not org or org.owner_id != user_id:
            return False
        
        # Remove all members' references
        members = self._members.get(org_id, [])
        for member in members:
            if member.user_id in self._user_orgs:
                self._user_orgs[member.user_id].remove(org_id)
        
        # Clean up
        del self._organizations[org_id]
        if org_id in self._members:
            del self._members[org_id]
        
        return True
    
    async def _has_permission(
        self,
        org_id: str,
        user_id: str,
        permission: str
    ) -> bool:
        """Check if user has a specific permission."""
        members = self._members.get(org_id, [])
        for member in members:
            if member.user_id == user_id:
                return permission in member.permissions
        return False
    
    async def get_member(
        self,
        org_id: str,
        user_id: str
    ) -> Optional[OrganizationMember]:
        """Get a specific member."""
        members = self._members.get(org_id, [])
        for member in members:
            if member.user_id == user_id:
                return member
        return None
    
    async def get_members(self, org_id: str) -> List[OrganizationMember]:
        """Get all members of an organization."""
        return self._members.get(org_id, [])
    
    async def invite_member(
        self,
        org_id: str,
        invited_by: str,
        email: str,
        role: OrganizationRole,
        message: Optional[str] = None
    ) -> Optional[OrganizationInvite]:
        """Create an invite for a new member."""
        if not await self._has_permission(org_id, invited_by, "members.invite"):
            return None
        
        org = self._organizations.get(org_id)
        if not org:
            return None
        
        # Can't invite as owner
        if role == OrganizationRole.OWNER:
            return None
        
        invite_id = f"inv_{uuid.uuid4().hex[:12]}"
        token = secrets.token_urlsafe(32)
        
        invite = OrganizationInvite(
            id=invite_id,
            organization_id=org_id,
            email=email,
            role=role,
            token=token,
            invited_by=invited_by,
            message=message,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            created_at=datetime.now(timezone.utc)
        )
        
        self._invites[invite_id] = invite
        return invite
    
    async def accept_invite(
        self,
        token: str,
        user_id: str
    ) -> Optional[OrganizationMember]:
        """Accept an organization invite."""
        # Find invite by token
        invite = None
        for inv in self._invites.values():
            if inv.token == token and inv.status == InviteStatus.PENDING:
                invite = inv
                break
        
        if not invite:
            return None
        
        # Check if expired
        if datetime.now(timezone.utc) > invite.expires_at:
            invite.status = InviteStatus.EXPIRED
            return None
        
        # Add as member
        member = OrganizationMember(
            id=f"mem_{uuid.uuid4().hex[:12]}",
            organization_id=invite.organization_id,
            user_id=user_id,
            role=invite.role,
            permissions=ROLE_PERMISSIONS[invite.role],
            joined_at=datetime.now(timezone.utc),
            invited_by=invite.invited_by
        )
        
        if invite.organization_id not in self._members:
            self._members[invite.organization_id] = []
        self._members[invite.organization_id].append(member)
        
        # Update user's orgs
        if user_id not in self._user_orgs:
            self._user_orgs[user_id] = []
        self._user_orgs[user_id].append(invite.organization_id)
        
        # Update org member count
        org = self._organizations.get(invite.organization_id)
        if org:
            org.member_count += 1
        
        # Update invite status
        invite.status = InviteStatus.ACCEPTED
        
        return member
    
    async def decline_invite(self, token: str) -> bool:
        """Decline an organization invite."""
        for inv in self._invites.values():
            if inv.token == token and inv.status == InviteStatus.PENDING:
                inv.status = InviteStatus.DECLINED
                return True
        return False
    
    async def get_pending_invites(self, org_id: str) -> List[OrganizationInvite]:
        """Get all pending invites for an organization."""
        return [
            inv for inv in self._invites.values()
            if inv.organization_id == org_id and inv.status == InviteStatus.PENDING
        ]
    
    async def update_member_role(
        self,
        org_id: str,
        updated_by: str,
        target_user_id: str,
        new_role: OrganizationRole
    ) -> Optional[OrganizationMember]:
        """Update a member's role."""
        if not await self._has_permission(org_id, updated_by, "members.manage"):
            return None
        
        # Can't change owner role
        if new_role == OrganizationRole.OWNER:
            return None
        
        members = self._members.get(org_id, [])
        for i, member in enumerate(members):
            if member.user_id == target_user_id:
                # Can't change owner's role
                if member.role == OrganizationRole.OWNER:
                    return None
                
                member.role = new_role
                member.permissions = ROLE_PERMISSIONS[new_role]
                return member
        
        return None
    
    async def remove_member(
        self,
        org_id: str,
        removed_by: str,
        target_user_id: str
    ) -> bool:
        """Remove a member from organization."""
        if not await self._has_permission(org_id, removed_by, "members.remove"):
            return False
        
        members = self._members.get(org_id, [])
        for i, member in enumerate(members):
            if member.user_id == target_user_id:
                # Can't remove owner
                if member.role == OrganizationRole.OWNER:
                    return False
                
                self._members[org_id].pop(i)
                
                # Update user's orgs
                if target_user_id in self._user_orgs:
                    self._user_orgs[target_user_id].remove(org_id)
                
                # Update member count
                org = self._organizations.get(org_id)
                if org:
                    org.member_count -= 1
                
                return True
        
        return False
    
    async def leave_organization(
        self,
        org_id: str,
        user_id: str
    ) -> bool:
        """Leave an organization (non-owners only)."""
        members = self._members.get(org_id, [])
        for i, member in enumerate(members):
            if member.user_id == user_id:
                # Owner can't leave
                if member.role == OrganizationRole.OWNER:
                    return False
                
                self._members[org_id].pop(i)
                
                if user_id in self._user_orgs:
                    self._user_orgs[user_id].remove(org_id)
                
                org = self._organizations.get(org_id)
                if org:
                    org.member_count -= 1
                
                return True
        
        return False
    
    async def transfer_ownership(
        self,
        org_id: str,
        current_owner_id: str,
        new_owner_id: str
    ) -> bool:
        """Transfer organization ownership."""
        org = self._organizations.get(org_id)
        if not org or org.owner_id != current_owner_id:
            return False
        
        # Check new owner is a member
        new_owner_member = await self.get_member(org_id, new_owner_id)
        if not new_owner_member:
            return False
        
        # Update org owner
        org.owner_id = new_owner_id
        org.updated_at = datetime.now(timezone.utc)
        
        # Update member roles
        members = self._members.get(org_id, [])
        for member in members:
            if member.user_id == current_owner_id:
                member.role = OrganizationRole.ADMIN
                member.permissions = ROLE_PERMISSIONS[OrganizationRole.ADMIN]
            elif member.user_id == new_owner_id:
                member.role = OrganizationRole.OWNER
                member.permissions = ROLE_PERMISSIONS[OrganizationRole.OWNER]
        
        return True
    
    async def get_organization_stats(self, org_id: str) -> Dict[str, Any]:
        """Get organization statistics."""
        org = self._organizations.get(org_id)
        if not org:
            return {}
        
        members = self._members.get(org_id, [])
        
        roles_count = {}
        for role in OrganizationRole:
            roles_count[role.value] = len([m for m in members if m.role == role])
        
        return {
            "organization_id": org_id,
            "name": org.name,
            "member_count": len(members),
            "members_by_role": roles_count,
            "active_since": org.created_at.isoformat(),
            "features_enabled": org.features
        }


_singleton_organization_service = None

def get_organization_service() -> OrganizationService:
    """Get organization service instance."""
    global _singleton_organization_service
    if _singleton_organization_service is None:
        _singleton_organization_service = OrganizationService()
    return _singleton_organization_service


# Import at end to avoid circular import
from datetime import timedelta
