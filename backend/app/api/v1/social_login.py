# @AI-HINT: Social login OAuth2 API endpoints — enhanced with intelligent login/register
# detection, role-based onboarding, httpOnly refresh cookie, and persistent link/delink.
"""
Social Login API - OAuth2 authentication endpoints.

Features:
- Get available providers
- Start OAuth flow (login, register, or link)
- Complete OAuth flow with smart existing-user detection
- Choose role after social signup (onboarding)
- Manage linked accounts (link & unlink with safety checks)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional, List
from pydantic import BaseModel, field_validator

from app.core.config import get_settings
from app.core.security import get_current_active_user, get_current_user_optional
from app.services.social_login import get_social_login_service, SocialProvider

router = APIRouter(prefix="/social-auth", tags=["social-auth"])
logger = logging.getLogger("megilance")


# ── Request / Response Models ────────────────────────────────────────────

class StartOAuthRequest(BaseModel):
    provider: SocialProvider
    redirect_uri: str
    portal_area: Optional[str] = None
    intent: Optional[str] = None  # "login" | "register" | "link"


class CompleteOAuthRequest(BaseModel):
    code: str
    state: str


class SyncProfileRequest(BaseModel):
    provider: SocialProvider
    fields: Optional[List[str]] = None


class SelectRoleRequest(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in {"client", "freelancer"}:
            raise ValueError("Role must be 'client' or 'freelancer'")
        return v


# ── Helpers ──────────────────────────────────────────────────────────────

def _set_refresh_cookie(response: JSONResponse, refresh_token: str) -> None:
    """Set refresh token as httpOnly cookie, matching main auth flow."""
    settings = get_settings()
    is_production = settings.environment == "production"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/api/auth/refresh",
        max_age=settings.refresh_token_expire_minutes * 60,
    )


# ── Public Endpoints ─────────────────────────────────────────────────────

@router.get("/providers")
async def get_available_providers():
    """Get list of available social login providers."""
    service = get_social_login_service()
    providers = await service.get_available_providers()
    return {"providers": providers}


@router.post("/start")
async def start_oauth(
    request: StartOAuthRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """Start OAuth flow — returns authorization URL."""
    service = get_social_login_service()

    user_id = None
    intent = request.intent
    if current_user:
        user_id = current_user.get("id") if isinstance(current_user, dict) else getattr(current_user, "id", None)
        if not intent:
            intent = "link"

    result = await service.start_oauth(
        provider=request.provider,
        redirect_uri=request.redirect_uri,
        user_id=user_id,
        portal_area=request.portal_area,
        intent=intent,
    )

    if result.get("success") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to start OAuth"),
        )

    return result


@router.post("/complete")
async def complete_oauth(
    request: CompleteOAuthRequest,
):
    """
    Complete OAuth flow — exchange code for tokens.

    Smart behaviour:
    - If email already exists → auto-login (returns action="login")
    - If new user and role was selected → register with that role
    - If new user and no role → register with needs_role_selection=True
    - If linking → returns action="linked"

    Sets refresh_token as httpOnly cookie for security.
    """
    service = get_social_login_service()

    result = await service.complete_oauth(
        code=request.code,
        state=request.state,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "OAuth failed"),
        )

    # Set refresh token as httpOnly cookie for login/register actions
    refresh_token = result.get("refresh_token")
    if refresh_token and result.get("action") in ("login", "register"):
        response = JSONResponse(content=result)
        _set_refresh_cookie(response, refresh_token)
        return response

    return result


# ── Authenticated Endpoints ──────────────────────────────────────────────

@router.post("/select-role")
async def select_role(
    request: SelectRoleRequest,
    current_user=Depends(get_current_active_user),
):
    """
    Post-registration role selection for users who signed up via social auth
    without choosing a role upfront. Issues fresh tokens with the new role.
    """
    service = get_social_login_service()
    result = await service.update_user_role(current_user.id, request.role)

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to update role"),
        )

    # Set httpOnly refresh cookie with new token
    refresh_token = result.get("refresh_token")
    response = JSONResponse(content=result)
    if refresh_token:
        _set_refresh_cookie(response, refresh_token)
    return response


@router.get("/linked-accounts")
async def get_linked_accounts(
    current_user=Depends(get_current_active_user),
):
    """Get user's linked social accounts."""
    service = get_social_login_service()
    accounts = await service.get_linked_accounts(current_user.id)
    return {"accounts": accounts}


@router.delete("/linked-accounts/{provider}")
async def unlink_account(
    provider: SocialProvider,
    current_user=Depends(get_current_active_user),
):
    """Unlink a social account (ensures user keeps at least one auth method)."""
    service = get_social_login_service()

    result = await service.unlink_account(
        user_id=current_user.id,
        provider=provider,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Cannot unlink account."),
        )

    return result


@router.post("/sync-profile")
async def sync_profile_from_social(
    request: SyncProfileRequest,
    current_user=Depends(get_current_active_user),
):
    """Sync profile data from a linked social account."""
    service = get_social_login_service()

    result = await service.sync_profile_from_social(
        user_id=current_user.id,
        provider=request.provider,
        fields=request.fields,
    )

    return result
