# @AI-HINT: Auth endpoints - register, login, 2FA, email verification, password reset
# Uses Turso HTTP API directly - NO SQLite fallback

import logging
import re
from typing import Any, Dict
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse

from app.core.security import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_active_user,
    get_password_hash,
    verify_password,
    add_token_to_blacklist,
    is_token_blacklisted,
    oauth2_scheme,
)
from app.core.rate_limit import (
    auth_rate_limit,
    password_reset_rate_limit,
    email_rate_limit,
)
from app.services import auth_service
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RefreshTokenRequest, Token
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.schemas.two_factor import (
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    TwoFactorLoginRequest,
    TwoFactorStatusResponse,
    TwoFactorDisableRequest,
    TwoFactorRegenerateBackupCodesResponse,
)
from app.schemas.email_verification import (
    EmailVerificationRequest,
    EmailVerificationResponse,
    ResendVerificationResponse,
)
from app.schemas.password_reset import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ValidateResetTokenRequest,
    ValidateResetTokenResponse,
)
from app.core.config import get_settings


router = APIRouter()
logger = logging.getLogger("megilance")

# Security: Validation constants
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
MAX_NAME_LENGTH = 100
MAX_BIO_LENGTH = 2000
MAX_EMAIL_LENGTH = 254
ALLOWED_USER_TYPES = {'client', 'freelancer'}  # admin accounts are created internally only


def validate_email(email: str) -> bool:
    """Validate email format and length."""
    if not email or len(email) > MAX_EMAIL_LENGTH:
        return False
    return bool(EMAIL_REGEX.match(email))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements.
    Reads policy from Settings to stay consistent with config.
    Returns (is_valid, error_message).
    """
    settings = get_settings()
    min_length = settings.password_min_length
    max_length = settings.password_max_length
    
    if len(password) < min_length:
        return False, f"Password must be at least {min_length} characters long"
    
    if len(password) > max_length:
        return False, f"Password must be at most {max_length} characters long"
    
    if settings.password_require_uppercase and not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if settings.password_require_lowercase and not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if settings.password_require_digit and not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if settings.password_require_special and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, ""


def sanitize_string(value: str, max_length: int = 255) -> str:
    """Sanitize string input by trimming and limiting length."""
    if not value:
        return ""
    return value.strip()[:max_length]


def _safe_str(val):
    """Convert bytes to string if needed"""
    from app.api.v1.utils import safe_str
    return safe_str(val)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@auth_rate_limit()
def register_user(request: Request, payload: UserCreate):
    """
    Register a new user
    
    Creates a new user account in Turso database.
    """
    # Validate email format
    if not validate_email(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(payload.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Validate user_type
    user_type = (payload.user_type or "client").lower()
    if user_type not in ALLOWED_USER_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid user type. Allowed: {', '.join(ALLOWED_USER_TYPES)}"
        )
    
    # Sanitize inputs
    name = sanitize_string(payload.name or "", MAX_NAME_LENGTH)
    bio = sanitize_string(payload.bio or "", MAX_BIO_LENGTH)
    
    # Check if email already exists
    if auth_service.check_email_exists(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    try:
        # Ensure password is a string and within bcrypt's 72-byte limit
        password_str = str(payload.password) if payload.password else ""
        if len(password_str.encode('utf-8')) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is too long. Please use a password of 72 bytes or fewer."
            )
        hashed_password = get_password_hash(password_str)
    except Exception as e:
        logger.error("Password hashing failed: %s (type=%s, length=%d)", e, type(payload.password), len(str(payload.password)) if payload.password else 0, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )
    now = datetime.now(timezone.utc).isoformat()
    
    # Prepare profile data
    profile_data = {}
    if payload.title:
        profile_data["title"] = payload.title
    if payload.portfolio_url:
        profile_data["portfolio_url"] = payload.portfolio_url
    
    profile_data_json = json.dumps(profile_data) if profile_data else None
    
    # Insert new user
    try:
        insert_result = auth_service.insert_user(
            email=payload.email,
            hashed_password=hashed_password,
            is_active=payload.is_active,
            name=name,
            user_type=user_type,
            bio=bio,
            skills=sanitize_string(payload.skills or "", 500),
            hourly_rate=payload.hourly_rate,
            profile_image_url=sanitize_string(payload.profile_image_url or "", 500),
            location=sanitize_string(payload.location or "", 100),
            profile_data_json=profile_data_json,
            now=now,
        )
        
        # Insert returns {"columns": [], "rows": []} for local SQLite
        # This is considered successful as long as no exception was raised
        if insert_result is None:
            logger.error("User insert returned None for email=%s", payload.email)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed. Please try again."
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Database insert failed for email=%s: %s", payload.email, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )
    
    # Get the created user
    user_data = auth_service.get_user_by_email(payload.email)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User created but failed to retrieve"
        )
    
    # Send verification email (non-blocking — don't fail registration on email error)
    try:
        import secrets as _secrets
        from app.services.email_service import email_service
        from app.db.turso_http import get_turso_http
        verification_token = _secrets.token_urlsafe(32)
        turso = get_turso_http()
        turso.execute(
            "UPDATE users SET email_verification_token = ? WHERE email = ?",
            [verification_token, payload.email]
        )
        settings = get_settings()
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
        verification_url = f"{frontend_url}/verify-email?token={verification_token}"
        email_service.send_verification_email(
            to_email=payload.email,
            user_name=name or "User",
            verification_url=verification_url
        )
        logger.info("Verification email sent to %s", payload.email)
    except Exception as e:
        logger.warning("Failed to send verification email to %s: %s", payload.email, e)

    return UserRead(
        id=int(user_data.get("id", 0)),
        email=_safe_str(user_data.get("email")),
        is_active=bool(user_data.get("is_active")),
        name=_safe_str(user_data.get("name")),
        user_type=_safe_str(user_data.get("user_type")),
        bio=_safe_str(user_data.get("bio")),
        skills=_safe_str(user_data.get("skills")),
        hourly_rate=float(user_data.get("hourly_rate") or 0),
        profile_image_url=_safe_str(user_data.get("profile_image_url")),
        location=_safe_str(user_data.get("location")),
        title=_safe_str(user_data.get("title")),
        portfolio_url=_safe_str(user_data.get("portfolio_url")),
        joined_at=user_data.get("joined_at")
    )


@router.post("/login", response_model=AuthResponse)
@auth_rate_limit()
def login_user(request: Request, credentials: LoginRequest):
    """
    User login endpoint with 2FA support
    
    If user has 2FA enabled, returns requires_2fa=True and a temporary token.
    Uses Turso HTTP API directly - no SQLAlchemy session needed.
    Sets refresh token as httpOnly cookie for security.
    """
    logger.info("Login attempt for email=%s", credentials.email)

    # authenticate_user uses Turso HTTP API directly
    user = authenticate_user(credentials.email, credentials.password)
    logger.info("Login result for email=%s: %s", credentials.email, "SUCCESS" if user else "FAILED")
    
    if not user:
        logger.info("Login failed for email=%s: user not found or password mismatch", credentials.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Parse profile data for user object
    profile_data = {}
    if user.profile_data:
        try:
            profile_data = json.loads(user.profile_data)
        except (json.JSONDecodeError, ValueError):
            pass

    # Check if 2FA is enabled
    if hasattr(user, 'two_factor_enabled') and user.two_factor_enabled:
        # Create temporary token for 2FA verification
        temp_claims = {"user_id": user.id, "temp_2fa": True}
        temp_token = create_access_token(
            subject=_safe_str(user.email),
            custom_claims=temp_claims,
            expires_delta_minutes=5
        )
        
        user_data = UserRead(
            id=user.id,
            email=_safe_str(user.email),
            is_active=bool(user.is_active),
            name=_safe_str(user.name),
            user_type=_safe_str(user.user_type),
            bio=_safe_str(user.bio),
            skills=_safe_str(user.skills),
            hourly_rate=float(user.hourly_rate) if user.hourly_rate else None,
            profile_image_url=_safe_str(user.profile_image_url),
            location=_safe_str(user.location),
            title=profile_data.get("title"),
            portfolio_url=profile_data.get("portfolio_url"),
            joined_at=user.joined_at
        )
        
        return AuthResponse(
            access_token=temp_token,
            refresh_token="",
            user=user_data,
            requires_2fa=True,
            message="Two-factor authentication required."
        )

    # No 2FA - proceed with normal login
    email_str = _safe_str(user.email)
    user_type_str = _safe_str(user.user_type) or ""
    
    custom_claims: Dict[str, Any] = {"user_id": user.id, "role": user_type_str}
    access_token = create_access_token(subject=email_str, custom_claims=custom_claims)
    refresh_token = create_refresh_token(subject=email_str, custom_claims=custom_claims)

    user_data = UserRead(
        id=user.id,
        email=email_str,
        is_active=bool(user.is_active),
        name=_safe_str(user.name),
        user_type=user_type_str,
        bio=_safe_str(user.bio),
        skills=_safe_str(user.skills),
        hourly_rate=float(user.hourly_rate) if user.hourly_rate else None,
        profile_image_url=_safe_str(user.profile_image_url),
        location=_safe_str(user.location),
        title=profile_data.get("title"),
        portfolio_url=profile_data.get("portfolio_url"),
        joined_at=user.joined_at
    )
    
    auth_response = AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_data,
    )
    
    # Set refresh token as httpOnly cookie (XSS-resistant)
    response = JSONResponse(content=auth_response.model_dump(mode='json'))
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
    return response


@router.post("/refresh", response_model=Token)
def refresh_token(request: Request, body: RefreshTokenRequest = None):
    """Refresh access token using refresh token from httpOnly cookie or request body"""
    # Prefer httpOnly cookie, fall back to request body
    token_value = request.cookies.get("refresh_token")
    if not token_value and body and body.refresh_token:
        token_value = body.refresh_token
    
    if not token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )
    
    try:
        payload = decode_token(token_value)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Check if this refresh token has been revoked (e.g., after logout or previous rotation)
    if is_token_blacklisted(token_value):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked"
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    custom_claims = {
        k: v for k, v in payload.items() 
        if k not in {"exp", "sub", "type", "iat", "nbf"}
    }
    access_token = create_access_token(subject=subject, custom_claims=custom_claims)
    new_refresh_token = create_refresh_token(subject=subject, custom_claims=custom_claims)
    
    # Blacklist the old refresh token to prevent replay attacks
    old_exp = payload.get("exp")
    if old_exp:
        add_token_to_blacklist(token_value, datetime.fromtimestamp(old_exp, tz=timezone.utc))
    
    token_response = Token(access_token=access_token, refresh_token=new_refresh_token)
    
    # Set new refresh token as httpOnly cookie
    response = JSONResponse(content=token_response.model_dump(mode='json'))
    settings = get_settings()
    is_production = settings.environment == "production"
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/api/auth/refresh",
        max_age=settings.refresh_token_expire_minutes * 60,
    )
    return response


@router.post("/logout")
def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_active_user),
):
    """Logout user: blacklist access token and clear refresh cookie"""
    if token:
        try:
            payload = decode_token(token)
            exp = payload.get("exp")
            if exp:
                expiry = datetime.fromtimestamp(exp, tz=timezone.utc)
                add_token_to_blacklist(token, expiry)
        except Exception:
            pass  # Token invalid/expired — still clear cookies

    # Also blacklist refresh token from cookie if present
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            exp = payload.get("exp")
            if exp:
                expiry = datetime.fromtimestamp(exp, tz=timezone.utc)
                add_token_to_blacklist(refresh_token, expiry)
        except Exception:
            pass

    settings = get_settings()
    is_production = settings.environment == "production"
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=is_production,
        samesite="lax",
        path="/api/auth/refresh",
    )
    return response


@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    # Parse profile data
    profile_data = {}
    if current_user.profile_data:
        try:
            profile_data = json.loads(current_user.profile_data)
        except (json.JSONDecodeError, ValueError):
            pass
            
    return UserRead(
        id=current_user.id,
        email=_safe_str(current_user.email),
        is_active=bool(current_user.is_active),
        name=_safe_str(current_user.name),
        user_type=_safe_str(current_user.user_type),
        bio=_safe_str(current_user.bio),
        skills=_safe_str(current_user.skills),
        hourly_rate=float(current_user.hourly_rate) if current_user.hourly_rate else None,
        profile_image_url=_safe_str(current_user.profile_image_url),
        location=_safe_str(current_user.location),
        title=profile_data.get("title"),
        portfolio_url=profile_data.get("portfolio_url"),
        joined_at=current_user.joined_at,
        headline=_safe_str(getattr(current_user, 'headline', None)),
        experience_level=_safe_str(getattr(current_user, 'experience_level', None)),
        languages=getattr(current_user, 'languages', None),
    )


@router.put("/me", response_model=UserRead)
def update_user_me(
    update_payload: UserUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """Update current user profile"""
    update_data = update_payload.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data:
        # No changes - return current user
        return read_users_me(current_user)
    
    # Handle password change
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    # Check email uniqueness if changing email
    if "email" in update_data:
        if not auth_service.check_email_available(update_data["email"], current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
            
    # Handle full_name alias
    if "full_name" in update_data:
        update_data["name"] = update_data.pop("full_name")

    # Handle profile_data fields
    profile_fields = ["title", "portfolio_url"]
    profile_updates = {}
    for field in profile_fields:
        if field in update_data:
            profile_updates[field] = update_data.pop(field)
            
    if profile_updates:
        # Get existing profile_data
        current_profile = {}
        if current_user.profile_data:
            try:
                current_profile = json.loads(current_user.profile_data)
            except (json.JSONDecodeError, ValueError):
                pass
        current_profile.update(profile_updates)
        update_data["profile_data"] = json.dumps(current_profile)
    
    # Handle JSON-serialized list/dict fields
    json_fields = [
        "education", "certifications", "work_history", "achievements",
        "industry_focus", "tools_and_technologies", "contact_preferences",
    ]
    for field in json_fields:
        if field in update_data:
            val = update_data[field]
            if isinstance(val, (list, dict)):
                update_data[field] = json.dumps(val)

    # Handle languages - can be list or string
    if "languages" in update_data:
        val = update_data["languages"]
        if isinstance(val, list):
            update_data["languages"] = json.dumps(val)

    # Auto-generate profile slug if not set
    if "name" in update_data and update_data["name"]:
        import re as _re
        from app.db.turso_http import execute_query as _exec_q
        slug = _re.sub(r'[^a-z0-9]+', '-', update_data["name"].lower()).strip('-')
        # Check if slug exists for another user
        existing = _exec_q(
            "SELECT id FROM users WHERE profile_slug = ? AND id != ?",
            [slug, current_user.id]
        )
        if existing and existing.get("rows"):
            slug = f"{slug}-{current_user.id}"
        update_data["profile_slug"] = slug
    
    # Update user fields
    update_result = auth_service.update_user_fields(current_user.id, update_data)
    
    if not update_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )
    
    # Fetch updated user
    user_data = auth_service.get_user_by_id(current_user.id)
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve updated user"
        )
    
    return UserRead(
        id=int(user_data.get("id", 0)),
        email=_safe_str(user_data.get("email")),
        is_active=bool(user_data.get("is_active")),
        name=_safe_str(user_data.get("name")),
        user_type=_safe_str(user_data.get("user_type")),
        bio=_safe_str(user_data.get("bio")),
        skills=_safe_str(user_data.get("skills")),
        hourly_rate=float(user_data.get("hourly_rate") or 0),
        profile_image_url=_safe_str(user_data.get("profile_image_url")),
        location=_safe_str(user_data.get("location")),
        title=_safe_str(user_data.get("title")),
        portfolio_url=_safe_str(user_data.get("portfolio_url")),
        joined_at=user_data.get("joined_at")
    )


# ===== Two-Factor Authentication Endpoints =====

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(current_user: User = Depends(get_current_active_user)):
    """Initialize 2FA setup for the current user"""
    if hasattr(current_user, 'two_factor_enabled') and current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is already enabled"
        )
    
    # Import here to avoid circular imports
    from app.services.two_factor_service import two_factor_service
    
    # Generate setup data
    setup_data = two_factor_service.setup_2fa_for_user_turso(current_user)
    
    return TwoFactorSetupResponse(
        secret=setup_data["secret"],
        qr_code=setup_data["qr_code"],
        backup_codes=setup_data["backup_codes"],
        provisioning_uri=setup_data["provisioning_uri"]
    )


@router.post("/2fa/enable", status_code=status.HTTP_200_OK)
def enable_2fa(
    request: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Enable 2FA after setup by verifying a TOTP token"""
    if hasattr(current_user, 'two_factor_enabled') and current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is already enabled"
        )
    
    if not hasattr(current_user, 'two_factor_secret') or not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please initialize 2FA setup first by calling /auth/2fa/setup"
        )
    
    from app.services.two_factor_service import two_factor_service
    success = two_factor_service.enable_2fa_turso(current_user, request.token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please try again."
        )
    
    return {"message": "Two-factor authentication enabled successfully"}


@router.post("/2fa/verify", response_model=AuthResponse)
def verify_2fa_login(
    request: TwoFactorLoginRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Complete login with 2FA verification"""
    if not hasattr(current_user, 'two_factor_enabled') or not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled for this account"
        )
    
    from app.services.two_factor_service import two_factor_service
    success = two_factor_service.verify_2fa_login_turso(
        current_user, 
        request.token,
        is_backup_code=request.is_backup_code
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication code"
        )
    
    # 2FA verified - issue full access tokens
    email_str = _safe_str(current_user.email)
    user_type_str = _safe_str(current_user.user_type) or ""
    
    custom_claims: Dict[str, Any] = {"user_id": current_user.id, "role": user_type_str}
    access_token = create_access_token(subject=email_str, custom_claims=custom_claims)
    refresh_token = create_refresh_token(subject=email_str, custom_claims=custom_claims)
    
    # Parse profile data
    profile_data = {}
    if current_user.profile_data:
        try:
            profile_data = json.loads(current_user.profile_data)
        except (json.JSONDecodeError, ValueError):
            pass

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserRead(
            id=current_user.id,
            email=email_str,
            is_active=bool(current_user.is_active),
            name=_safe_str(current_user.name),
            user_type=user_type_str,
            bio=_safe_str(current_user.bio),
            skills=_safe_str(current_user.skills),
            hourly_rate=float(current_user.hourly_rate) if current_user.hourly_rate else None,
            profile_image_url=_safe_str(current_user.profile_image_url),
            location=_safe_str(current_user.location),
            title=profile_data.get("title"),
            portfolio_url=profile_data.get("portfolio_url"),
            joined_at=current_user.joined_at
        ),
        message="Login successful"
    )


@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
def get_2fa_status(current_user: User = Depends(get_current_active_user)):
    """Get current user's 2FA status"""
    backup_codes_count = 0
    two_factor_enabled = hasattr(current_user, 'two_factor_enabled') and current_user.two_factor_enabled
    
    if two_factor_enabled and hasattr(current_user, 'two_factor_backup_codes') and current_user.two_factor_backup_codes:
        try:
            codes = json.loads(current_user.two_factor_backup_codes)
            backup_codes_count = len(codes)
        except (json.JSONDecodeError, TypeError):
            pass
    
    return TwoFactorStatusResponse(
        enabled=two_factor_enabled,
        has_backup_codes=backup_codes_count > 0,
        backup_codes_remaining=backup_codes_count if two_factor_enabled else None
    )


@router.post("/2fa/disable", status_code=status.HTTP_200_OK)
def disable_2fa(
    request: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Disable 2FA for current user (requires password confirmation)"""
    if not hasattr(current_user, 'two_factor_enabled') or not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled"
        )
    
    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    from app.services.two_factor_service import two_factor_service
    two_factor_service.disable_2fa_turso(current_user)
    
    return {"message": "Two-factor authentication disabled successfully"}


@router.post("/2fa/regenerate-backup-codes", response_model=TwoFactorRegenerateBackupCodesResponse)
def regenerate_backup_codes(current_user: User = Depends(get_current_active_user)):
    """Regenerate backup codes (invalidates old codes)"""
    if not hasattr(current_user, 'two_factor_enabled') or not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled"
        )
    
    from app.services.two_factor_service import two_factor_service
    plain_codes, hashed_codes = two_factor_service.generate_backup_codes()
    
    # Update in Turso
    update_result = auth_service.update_backup_codes(current_user.id, json.dumps(hashed_codes))
    
    if not update_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save backup codes"
        )
    
    return TwoFactorRegenerateBackupCodesResponse(
        backup_codes=plain_codes,
        message="Your old backup codes have been invalidated. Save these new codes in a secure location."
    )


# ===== Email Verification Endpoints =====

@router.post("/verify-email", response_model=EmailVerificationResponse)
def verify_email(request: EmailVerificationRequest):
    """Verify user's email address using token from email"""
    from app.services.email_verification_service import email_verification_service
    
    user = email_verification_service.verify_email_turso(request.token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    return EmailVerificationResponse(
        message="Email verified successfully. You can now log in.",
        email_verified=True
    )


@router.post("/resend-verification", response_model=ResendVerificationResponse)
@email_rate_limit()
def resend_verification_email(
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    """Resend email verification link to current user"""
    if hasattr(current_user, 'email_verified') and current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )
    
    from app.services.email_verification_service import email_verification_service
    from app.services.email_service import email_service
    
    verification_token = email_verification_service.resend_verification_email_turso(current_user)
    settings = get_settings()
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    try:
        email_service.send_verification_email(
            to_email=_safe_str(current_user.email),
            user_name=_safe_str(current_user.name) or "User",
            verification_url=verification_url
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )
    
    return ResendVerificationResponse(
        message="Verification email sent successfully. Please check your inbox."
    )


# ===== Password Reset Endpoints =====

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@password_reset_rate_limit()
def forgot_password(
    request: Request,
    request_body: ForgotPasswordRequest,
):
    """Initiate password reset flow"""
    from app.services.password_reset_service import password_reset_service
    from app.services.email_service import email_service
    
    # Always return success (don't reveal if email exists)
    success_message = "If an account with that email exists, a password reset link has been sent."
    
    # Check if user exists
    user_data = auth_service.get_user_for_password_reset(request_body.email)
    
    if user_data:
        # Generate reset token
        reset_token, expiry = password_reset_service.create_reset_token_turso(
            int(user_data.get("id", 0))
        )
        settings = get_settings()
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        try:
            email_service.send_password_reset_email(
                to_email=_safe_str(user_data.get("email")),
                user_name=_safe_str(user_data.get("name")) or "User",
                reset_url=reset_url
            )
        except Exception as e:
            logger.error("Failed to send password reset email for email=%s: %s", request_body.email, e, exc_info=True)
    
    return ForgotPasswordResponse(message=success_message)


@router.post("/reset-password", response_model=ResetPasswordResponse)
@auth_rate_limit()
def reset_password(
    request: Request,
    request_body: ResetPasswordRequest,
):
    """Reset password using token from email"""
    from app.services.password_reset_service import password_reset_service
    
    user_id = password_reset_service.validate_reset_token_turso(request_body.token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Hash new password
    new_password_hash = get_password_hash(request_body.new_password)
    
    # Reset password
    password_reset_service.reset_password_turso(user_id, new_password_hash)
    
    return ResetPasswordResponse(
        message="Password reset successfully. You can now log in with your new password."
    )


@router.post("/validate-reset-token", response_model=ValidateResetTokenResponse)
def validate_reset_token(request: ValidateResetTokenRequest):
    """Validate a password reset token without using it"""
    from app.services.password_reset_service import password_reset_service
    
    user_id = password_reset_service.validate_reset_token_turso(request.token)
    
    if not user_id:
        return ValidateResetTokenResponse(
            valid=False,
            message="Invalid or expired reset token"
        )
    
    return ValidateResetTokenResponse(
        valid=True,
        message="Token is valid"
    )
