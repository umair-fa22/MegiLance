# @AI-HINT: Two-Factor Authentication API endpoints using Turso DB-backed service
"""
Two-Factor Authentication API - 2FA management endpoints.

Features:
- Setup TOTP authenticator with QR code
- Verify 2FA codes (TOTP + backup codes)
- Manage backup codes
- Persistent storage via Turso HTTP
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import get_current_active_user
from app.services.two_factor_service import two_factor_service

router = APIRouter(prefix="/2fa", tags=["two-factor-auth"])


# Request/Response Models
class VerifyCodeRequest(BaseModel):
    code: str
    is_backup_code: bool = False


# Endpoints
@router.get("/status")
async def get_2fa_status(
    current_user=Depends(get_current_active_user)
):
    """Get current 2FA status."""
    user_id = current_user.id if hasattr(current_user, 'id') else current_user.get('id')
    
    status_data = two_factor_service.get_2fa_status(user_id)
    
    if status_data is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return status_data


@router.post("/totp/setup")
async def start_totp_setup(
    current_user=Depends(get_current_active_user)
):
    """Start TOTP authenticator setup. Returns QR code and backup codes."""
    user_data = {
        "id": current_user.id if hasattr(current_user, 'id') else current_user.get('id'),
        "email": current_user.email if hasattr(current_user, 'email') else current_user.get('email'),
    }
    
    result = two_factor_service.setup_2fa_for_user_turso(user_data)
    
    return {
        "message": "Scan the QR code with your authenticator app, then verify with a code",
        "qr_code": result["qr_code"],
        "secret": result["secret"],
        "backup_codes": result["backup_codes"],
        "provisioning_uri": result["provisioning_uri"],
    }


@router.post("/totp/verify-setup")
async def verify_totp_setup(
    request: VerifyCodeRequest,
    current_user=Depends(get_current_active_user)
):
    """Verify TOTP setup with a code from authenticator app to enable 2FA."""
    user_data = {
        "id": current_user.id if hasattr(current_user, 'id') else current_user.get('id'),
    }
    
    success = two_factor_service.enable_2fa_turso(user_data, request.code)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Make sure the code from your authenticator app is correct."
        )
    
    return {"success": True, "message": "2FA enabled successfully!"}


@router.post("/verify")
async def verify_2fa_code(
    request: VerifyCodeRequest,
    current_user=Depends(get_current_active_user)
):
    """Verify a 2FA code (TOTP or backup code)."""
    user_data = {
        "id": current_user.id if hasattr(current_user, 'id') else current_user.get('id'),
        "two_factor_enabled": True,
    }
    
    success = two_factor_service.verify_2fa_login_turso(
        user_data,
        request.code,
        is_backup_code=request.is_backup_code
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid code"
        )
    
    return {"success": True, "method": "backup_code" if request.is_backup_code else "totp"}


@router.post("/disable")
async def disable_2fa(
    request: VerifyCodeRequest,
    current_user=Depends(get_current_active_user)
):
    """Disable 2FA (requires valid TOTP code first)."""
    user_data = {
        "id": current_user.id if hasattr(current_user, 'id') else current_user.get('id'),
        "two_factor_enabled": True,
    }
    
    # Verify code before disabling
    valid = two_factor_service.verify_2fa_login_turso(user_data, request.code)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid code. Provide a valid TOTP code to disable 2FA."
        )
    
    two_factor_service.disable_2fa_turso(user_data)
    
    return {"success": True, "message": "2FA disabled"}


@router.post("/backup-codes/regenerate")
async def regenerate_backup_codes(
    request: VerifyCodeRequest,
    current_user=Depends(get_current_active_user)
):
    """Regenerate backup codes (requires valid TOTP code)."""
    user_data = {
        "id": current_user.id if hasattr(current_user, 'id') else current_user.get('id'),
        "email": current_user.email if hasattr(current_user, 'email') else current_user.get('email'),
        "two_factor_enabled": True,
    }
    
    # Verify TOTP code first
    valid = two_factor_service.verify_2fa_login_turso(user_data, request.code)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid TOTP code"
        )
    
    # Re-setup generates new backup codes while preserving the existing secret
    result = two_factor_service.setup_2fa_for_user_turso(user_data)
    
    # Re-enable since setup resets enabled flag
    two_factor_service.enable_2fa_turso(user_data, request.code)
    
    return {
        "success": True,
        "backup_codes": result["backup_codes"],
        "message": "New backup codes generated. Save them securely!"
    }
