# @AI-HINT: API keys management endpoints - developer API key generation and management
"""
API Keys Management API - Developer Access Control

Provides:
- Create and manage API keys
- Scope and permission management
- Usage statistics and rate limits
- Key rotation and revocation
- IP whitelisting
"""

from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, Field

from ...core.security import get_current_active_user
from ...services.api_keys import api_key_service


router = APIRouter()


# ============== Pydantic Models ==============

ALLOWED_SCOPES = {"read", "write", "delete", "projects", "users", "analytics"}
PRIVILEGED_SCOPES = {"admin", "payments", "webhooks"}
ALLOWED_TIERS = {"free", "basic"}
ADMIN_TIERS = {"premium", "enterprise"}

class CreateAPIKeyRequest(BaseModel):
    """Request to create a new API key."""
    name: str = Field(..., min_length=1, max_length=100, description="Display name for the key")
    scopes: List[str] = Field(..., min_length=1, description="Permission scopes")
    tier: str = Field(default="free", description="Rate limit tier: free, basic, premium, enterprise")
    expires_in_days: Optional[int] = Field(365, ge=1, le=3650, description="Days until expiration")
    ip_whitelist: Optional[List[str]] = Field(None, description="Allowed IP addresses")
    description: Optional[str] = Field(None, max_length=500)


class UpdateAPIKeyRequest(BaseModel):
    """Request to update an API key."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    scopes: Optional[List[str]] = None
    ip_whitelist: Optional[List[str]] = None


class ValidateKeyRequest(BaseModel):
    """Request to validate an API key."""
    api_key: str = Field(..., description="The API key to validate")
    required_scope: Optional[str] = None


# ============== Key Management Endpoints ==============

@router.post("")
async def create_api_key(
    request: CreateAPIKeyRequest,
    current_user = Depends(get_current_active_user)
):
    """
    Create a new API key.
    
    ⚠️ **Important**: The full API key is only shown once. Save it securely!
    
    **Scopes**:
    - `read` - Read-only access
    - `write` - Create and update resources
    - `delete` - Delete resources
    - `projects` - Access project endpoints
    - `users` - Access user endpoints
    - `payments` - Access payment endpoints
    - `analytics` - Access analytics endpoints
    - `webhooks` - Manage webhooks
    - `admin` - Full administrative access
    
    **Tiers**:
    - `free` - 60 req/min, 1,000 req/day
    - `basic` - 300 req/min, 10,000 req/day
    - `premium` - 1,000 req/min, 100,000 req/day
    - `enterprise` - 5,000 req/min, 1,000,000 req/day
    """
    from app.services.db_utils import sanitize_text
    user_role = current_user.get("role", "")
    # Filter out privileged scopes for non-admin users
    scopes = request.scopes
    if user_role != "admin":
        scopes = [s for s in scopes if s not in PRIVILEGED_SCOPES]
        if not scopes:
            raise HTTPException(status_code=400, detail="No valid scopes provided")
    # Restrict tier for non-admin users
    tier = request.tier
    if user_role != "admin" and tier in ADMIN_TIERS:
        tier = "basic"
    try:
        result = await api_key_service.create_api_key(
            user_id=str(current_user.get("id")),
            name=sanitize_text(request.name, 100),
            scopes=scopes,
            tier=tier,
            expires_in_days=request.expires_in_days,
            ip_whitelist=request.ip_whitelist,
            description=sanitize_text(request.description, 500) if request.description else None
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_api_keys(
    include_inactive: bool = Query(False, description="Include revoked keys"),
    current_user = Depends(get_current_active_user)
):
    """
    List all API keys for the current user.
    
    Note: Full API keys are never shown after creation.
    Only the key prefix is displayed for identification.
    """
    result = await api_key_service.get_user_keys(
        user_id=str(current_user.get("id")),
        include_inactive=include_inactive
    )
    return result


@router.get("/scopes")
async def get_available_scopes(
    current_user = Depends(get_current_active_user)
):
    """Get all available API scopes and tiers."""
    result = await api_key_service.get_available_scopes()
    return result


@router.get("/{key_id}")
async def get_api_key(
    key_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get details of a specific API key."""
    result = await api_key_service.get_user_keys(
        user_id=str(current_user.get("id")),
        include_inactive=True
    )
    
    for key in result["api_keys"]:
        if key["id"] == key_id:
            return key
    
    raise HTTPException(status_code=404, detail="API key not found")


@router.put("/{key_id}")
async def update_api_key(
    key_id: str,
    request: UpdateAPIKeyRequest,
    current_user = Depends(get_current_active_user)
):
    """
    Update an API key's settings.
    
    You can update:
    - name
    - description
    - scopes (permissions)
    - ip_whitelist
    """
    try:
        updates = request.dict(exclude_unset=True)
        result = await api_key_service.update_api_key(
            user_id=str(current_user.get("id")),
            key_id=key_id,
            updates=updates
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Revoke an API key.
    
    This immediately invalidates the key. Any requests using this key
    will be rejected with a 401 error.
    """
    try:
        result = await api_key_service.revoke_api_key(
            user_id=str(current_user.get("id")),
            key_id=key_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{key_id}/rotate")
async def rotate_api_key(
    key_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Rotate an API key.
    
    This creates a new key with the same settings and schedules
    the old key for revocation in 24 hours. This allows time to
    update your applications with the new key.
    
    ⚠️ **Important**: Save the new API key! It's only shown once.
    """
    try:
        result = await api_key_service.rotate_api_key(
            user_id=str(current_user.get("id")),
            key_id=key_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== Usage & Statistics ==============

@router.get("/{key_id}/usage")
async def get_key_usage(
    key_id: str,
    current_user = Depends(get_current_active_user)
):
    """
    Get usage statistics for an API key.
    
    Returns:
    - Total requests made
    - Requests today
    - Requests this minute
    - Rate limit remaining
    - Last used timestamp
    """
    try:
        result = await api_key_service.get_key_usage(
            user_id=str(current_user.get("id")),
            key_id=key_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ============== Validation Endpoint ==============

@router.post("/validate")
async def validate_api_key(
    request: ValidateKeyRequest
):
    """
    Validate an API key.
    
    This endpoint can be used to verify if an API key is valid
    and check its permissions without making an authenticated request.
    
    Returns validation status and remaining rate limits.
    """
    result = await api_key_service.validate_api_key(
        api_key=request.api_key,
        required_scope=request.required_scope
    )
    
    if not result["valid"]:
        raise HTTPException(
            status_code=401,
            detail=result.get("error", "Invalid API key"),
            headers={"X-Retry-After": str(result.get("retry_after", 0))} if result.get("retry_after") else None
        )
    
    return result


# ============== API Key Header Validation (for other routes) ==============

async def verify_api_key(
    x_api_key: str = Header(..., description="API key for authentication"),
    x_required_scope: Optional[str] = Header(None, description="Required scope for this request")
):
    """
    Dependency to validate API key from header.
    
    Use this in other routes to enable API key authentication:
    
    ```python
    @router.get("/protected")
    async def protected_route(user=Depends(verify_api_key)):
        return {"user_id": user["user_id"]}
    ```
    """
    result = await api_key_service.validate_api_key(
        api_key=x_api_key,
        required_scope=x_required_scope
    )
    
    if not result["valid"]:
        raise HTTPException(
            status_code=401,
            detail=result.get("error", "Invalid API key")
        )
    
    return result


# ============== Info Endpoint ==============

@router.get("/info/limits")
async def get_rate_limits_info(
    current_user = Depends(get_current_active_user)
):
    """Get information about rate limit tiers."""
    return {
        "tiers": {
            "free": {
                "requests_per_minute": 60,
                "requests_per_day": 1000,
                "description": "For personal projects and testing"
            },
            "basic": {
                "requests_per_minute": 300,
                "requests_per_day": 10000,
                "description": "For small applications"
            },
            "premium": {
                "requests_per_minute": 1000,
                "requests_per_day": 100000,
                "description": "For production applications"
            },
            "enterprise": {
                "requests_per_minute": 5000,
                "requests_per_day": 1000000,
                "description": "For high-volume applications"
            }
        }
    }


@router.get("/info/best-practices")
async def get_best_practices(
    current_user = Depends(get_current_active_user)
):
    """Get API key best practices and security recommendations."""
    return {
        "best_practices": [
            {
                "title": "Keep keys secret",
                "description": "Never commit API keys to version control or share them publicly"
            },
            {
                "title": "Use environment variables",
                "description": "Store API keys in environment variables, not in code"
            },
            {
                "title": "Rotate regularly",
                "description": "Rotate keys periodically, especially if you suspect compromise"
            },
            {
                "title": "Use minimum scopes",
                "description": "Only request the scopes your application actually needs"
            },
            {
                "title": "Enable IP whitelisting",
                "description": "Restrict keys to known server IP addresses when possible"
            },
            {
                "title": "Monitor usage",
                "description": "Regularly check key usage for unexpected patterns"
            },
            {
                "title": "Set expiration",
                "description": "Set reasonable expiration dates on keys"
            }
        ],
        "security_headers": {
            "X-API-Key": "Include your API key in this header for authentication",
            "X-Required-Scope": "Optional header to verify specific scope permissions"
        }
    }
