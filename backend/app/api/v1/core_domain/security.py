# @AI-HINT: Advanced security API endpoints for MFA, risk-based auth, and session management

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel, Field

from app.core.security import get_current_user
from app.services.advanced_security import get_security_service, AdvancedSecurityService
from app.models.user import User

router = APIRouter()


# Request/Response Schemas
class MFASetupRequest(BaseModel):
    method: str = Field(..., description="MFA method: totp, sms, email, webauthn, hardware_key, backup_codes")
    phone_number: str | None = Field(None, description="Phone number for SMS MFA")
    email: str | None = Field(None, description="Email for email MFA")


class MFASetupResponse(BaseModel):
    method: str
    qr_code: str | None = None
    secret: str | None = None
    backup_codes: List[str] | None = None
    message: str


class MFAVerifyRequest(BaseModel):
    method: str
    code: str


class RiskAssessmentResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str
    factors: dict
    recommendation: str


class SessionResponse(BaseModel):
    id: str
    device_name: str
    ip_address: str
    last_active: str
    is_current: bool


# MFA Endpoints
@router.post("/mfa/setup", response_model=MFASetupResponse, status_code=status.HTTP_201_CREATED)
async def setup_mfa(
    request: MFASetupRequest,
    current_user: User = Depends(get_current_user),
    security_service: AdvancedSecurityService = Depends(get_security_service)
):
    """
    Setup multi-factor authentication for user.
    
    Supported methods:
    - totp: Time-based OTP (Google Authenticator, Authy)
    - sms: SMS verification via Twilio
    - email: Email verification codes
    - webauthn: Biometric/hardware key (FIDO2)
    - hardware_key: YubiKey, security keys
    - backup_codes: One-time recovery codes
    """
    try:
        result = await security_service.setup_mfa(
            user_id=str(current_user.id),
            method=request.method,
            phone_number=request.phone_number,
            email=request.email or current_user.email
        )
        return MFASetupResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"MFA setup failed: {str(e)}")


@router.post("/mfa/verify", status_code=status.HTTP_200_OK)
async def verify_mfa(
    request: MFAVerifyRequest,
    current_user: User = Depends(get_current_user),
    security_service: AdvancedSecurityService = Depends(get_security_service)
):
    """Verify MFA code for authentication."""
    try:
        is_valid = await security_service.verify_mfa(
            user_id=str(current_user.id),
            method=request.method,
            code=request.code
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid MFA code"
            )
        
        return {"message": "MFA verification successful", "verified": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"MFA verification failed: {str(e)}")


@router.delete("/mfa/disable", status_code=status.HTTP_200_OK)
async def disable_mfa(
    method: str,
    current_user: User = Depends(get_current_user),
    security_service: AdvancedSecurityService = Depends(get_security_service)
):
    """Disable a specific MFA method."""
    try:
        await security_service.disable_mfa(
            user_id=str(current_user.id),
            method=method
        )
        return {"message": f"{method.upper()} MFA disabled successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to disable MFA: {str(e)}")


@router.get("/mfa/methods", response_model=List[str])
async def list_mfa_methods(
    current_user: User = Depends(get_current_user),
    security_service: AdvancedSecurityService = Depends(get_security_service)
):
    """List all enabled MFA methods for the current user."""
    try:
        methods = await security_service.get_user_mfa_methods(
            user_id=str(current_user.id)
        )
        return methods
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list MFA methods")


# Risk-Based Authentication
@router.post("/risk-assessment", response_model=RiskAssessmentResponse)
async def assess_login_risk(
    ip_address: str,
    user_agent: str,
    current_user: User = Depends(get_current_user),
    security_service: AdvancedSecurityService = Depends(get_security_service)
):
    """
    Assess login risk based on device fingerprint and user behavior.
    Returns risk score (0-100) and recommended action.
    """
    try:
        assessment = await security_service.assess_login_risk(
            user_id=str(current_user.id),
            ip_address=ip_address,
            user_agent=user_agent
        )
        return RiskAssessmentResponse(**assessment)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Risk assessment failed")


# Session Management
@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),

    security_service: AdvancedSecurityService = Depends(get_security_service)
):
    """List all active sessions for the current user."""
    try:
        sessions = await security_service.get_user_sessions(
            user_id=str(current_user.id)
        )
        return [SessionResponse(**session) for session in sessions]
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list sessions")


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def terminate_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    security_service: AdvancedSecurityService = Depends(get_security_service)
):
    """Terminate a specific session (remote logout)."""
    try:
        await security_service.terminate_session(
            user_id=str(current_user.id),
            session_id=session_id
        )
        return {"message": "Session terminated successfully"}
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to terminate session")


# Security Events
@router.get("/security-events")
async def get_security_events(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    security_service: AdvancedSecurityService = Depends(get_security_service)
):
    """Get security event log for the current user."""
    try:
        events = await security_service.get_security_events(
            user_id=str(current_user.id),
            limit=limit
        )
        return {"events": events, "total": len(events)}
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get security events")
