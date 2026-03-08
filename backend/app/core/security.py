"""
@AI-HINT: Security and authentication module for MegiLance
- JWT token management with expiry validation
- Token blacklist for revoked tokens
- Password hashing with bcrypt
- Rate limiting on auth endpoints
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Set, Any, Union
import logging
import time
import threading

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.db.turso_http import execute_query, parse_rows

# Thread-safe bounded LRU user cache to avoid repeated Turso HTTP lookups
from collections import OrderedDict
_USER_CACHE_TTL = 300  # 5 minutes
_USER_CACHE_MAX_SIZE = 500
_user_cache_lock = threading.Lock()
_user_cache: OrderedDict = OrderedDict()  # email -> {"ts": float, "data": dict}

def invalidate_user_cache(email: str) -> None:
    """Remove a user from the auth cache so the next request fetches fresh data."""
    with _user_cache_lock:
        _user_cache.pop(email, None)

from app.models.user import User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Token blacklist is now DB-backed via token_blacklist_service
# See: app/services/token_blacklist_service.py


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    if isinstance(hashed_password, bytes):
        hashed_password = hashed_password.decode('utf-8')
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


class UserProxy:
    """Lightweight user object from Turso query results"""
    def __init__(self, row: dict):
        self.id = row.get('id')
        self.email = row.get('email')
        self.hashed_password = row.get('hashed_password')
        self.is_active = bool(row.get('is_active', 0))
        self.is_verified = bool(row.get('is_verified', 0))
        self.email_verified = bool(row.get('email_verified', 0))
        self.name = row.get('name')
        self.first_name = row.get('first_name')
        self.last_name = row.get('last_name')
        self.user_type = (row.get('user_type') or row.get('role', 'client')).lower()
        self.role = (row.get('role') or row.get('user_type', 'client')).lower()
        self.bio = row.get('bio')
        self.skills = row.get('skills')
        self.hourly_rate = row.get('hourly_rate', 0)
        self.profile_image_url = row.get('profile_image_url')
        self.location = row.get('location')
        self.profile_data = row.get('profile_data')
        self.two_factor_enabled = bool(row.get('two_factor_enabled', 0))
        self.headline = row.get('headline')
        self.experience_level = row.get('experience_level')
        self.languages = row.get('languages')
        self.joined_at = row.get('joined_at')
        self.created_at = row.get('created_at')
        self.account_balance = row.get('account_balance', 0.0)
        self.seller_level = row.get('seller_level')
        self.availability_status = row.get('availability_status')

    def __getitem__(self, key):
        return getattr(self, key)

    def get(self, key, default=None):
        return getattr(self, key, default)


def authenticate_user(email: str, password: str) -> Optional[Any]:
    """Authenticate user - check credentials and return user if valid
    
    Uses Turso HTTP API directly to ensure consistency with registration.
    """
    try:
        # Normalize email to lowercase
        email_lower = email.lower().strip()
        
        # Query user by email using Turso HTTP API
        result = execute_query(
            """SELECT id, email, hashed_password, is_active, is_verified, 
                      name, user_type, role, bio, skills, hourly_rate,
                      profile_image_url, location, profile_data, 
                      two_factor_enabled, joined_at, headline, experience_level, languages
               FROM users WHERE email = ?""",
            [email_lower]
        )
        
        rows = parse_rows(result)
        
        if not rows or len(rows) == 0:
            logger.warning(f"Login attempt with non-existent email: {email}")
            return None
        
        user_data = rows[0]
        
        # Get hashed password (handle bytes if returned)
        hashed_pw = user_data.get('hashed_password')
        if isinstance(hashed_pw, bytes):
            hashed_pw = hashed_pw.decode('utf-8')
        
        if not hashed_pw or not verify_password(password, hashed_pw):
            logger.warning(f"Failed login attempt for user: {email}")
            return None
        
        if not user_data.get('is_active', True):
            logger.warning(f"Login attempt for inactive user: {email}")
            return None
        
        logger.info(f"Successful authentication for user: {email}")
        return UserProxy(user_data)
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


def _create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    """Create JWT token with expiry and unique token ID (jti)"""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    
    import uuid
    # Add token metadata — jti enables per-token revocation
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": token_type,
        "jti": str(uuid.uuid4()),
    })
    
    token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return token


def create_access_token(subject: str, expires_delta_minutes: Optional[int] = None, custom_claims: Optional[dict] = None) -> str:
    """Create access token"""
    settings = get_settings()
    if expires_delta_minutes is None:
        expires_delta_minutes = settings.access_token_expire_minutes
    
    data = {"sub": subject}
    if custom_claims:
        data.update(custom_claims)
    
    return _create_token(
        data,
        timedelta(minutes=expires_delta_minutes),
        "access"
    )


def create_refresh_token(subject: str, custom_claims: Optional[dict] = None) -> str:
    """Create refresh token"""
    settings = get_settings()
    data = {"sub": subject}
    if custom_claims:
        data.update(custom_claims)
    
    return _create_token(
        data,
        timedelta(minutes=settings.refresh_token_expire_minutes),
        "refresh"
    )


def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError as e:
        logger.warning(f"Invalid token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def add_token_to_blacklist(token: str, expiry: datetime) -> None:
    """Add token to persistent blacklist (Turso DB-backed)"""
    from app.services.token_blacklist_service import add_token_to_blacklist as _add
    _add(token, expiry, reason="logout")


def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted (Turso DB-backed with memory cache)"""
    from app.services.token_blacklist_service import is_token_blacklisted as _check
    return _check(token)


def get_current_user(token: str = Depends(oauth2_scheme)) -> Union[User, UserProxy]:
    """Get current authenticated user from JWT token.
    
    Returns a UserProxy (lightweight dict wrapper) from Turso queries,
    not the full SQLAlchemy User model.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    # Check if token is blacklisted
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )

    try:
        # decode_token validates expiry via python-jose automatically
        payload = decode_token(token)
        
        # Validate token type
        token_type = payload.get("type")
        if token_type != "access":
            logger.warning(f"Invalid token type: {token_type}")
            raise credentials_exception
        
        email: Optional[str] = payload.get("sub")
        if not email:
            raise credentials_exception
            
    except HTTPException:
        raise
    except JWTError:
        raise credentials_exception

    try:
        # Check bounded LRU user cache first (thread-safe)
        with _user_cache_lock:
            cached = _user_cache.get(email)
            if cached and time.time() - cached["ts"] < _USER_CACHE_TTL:
                _user_cache.move_to_end(email)
                return UserProxy(cached["data"])
            elif cached:
                del _user_cache[email]

        # Fetch user from Turso database using HTTP API
        result = execute_query(
            """SELECT id, email, name, hashed_password, role, user_type, is_active, is_verified, 
                      bio, skills, hourly_rate, profile_image_url, location, profile_data,
                      two_factor_enabled, joined_at, headline, experience_level, languages FROM users WHERE email = ?""",
            [email]
        )
        rows = parse_rows(result)
        
        if not rows:
            logger.warning(f"User not found for email: {email}")
            raise credentials_exception
        
        row = rows[0]
        # Store in bounded LRU cache
        with _user_cache_lock:
            if email in _user_cache:
                _user_cache.move_to_end(email)
            elif len(_user_cache) >= _USER_CACHE_MAX_SIZE:
                _user_cache.popitem(last=False)  # Evict LRU entry
            _user_cache[email] = {"ts": time.time(), "data": row}
        return UserProxy(row)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user from Turso: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user"
        )


def get_current_user_from_token(token: str = Depends(oauth2_scheme)) -> dict:
    """Get user info directly from token without database lookup"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = decode_token(token)
        
        # Validate token type
        if payload.get("type") != "access":
            raise credentials_exception
        
        # Alias user_id as id for backward compatibility
        if "user_id" in payload and "id" not in payload:
            payload["id"] = payload["user_id"]
        
        # Note: expiry is already validated by jwt.decode() in decode_token()
        return payload
        
    except HTTPException:
        raise
    except JWTError:
        raise credentials_exception


def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """Get user info from token, but don't fail if not provided - returns None if no valid token"""
    if not token:
        return None
    
    try:
        return get_current_user_from_token(token)
    except HTTPException:
        return None


def get_current_active_user(current_user: Union[User, UserProxy] = Depends(get_current_user)) -> Union[User, UserProxy]:
    """Ensure user is active"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return current_user


def require_admin(current_user: Union[User, UserProxy] = Depends(get_current_active_user)) -> Union[User, UserProxy]:
    """Require admin role — use as FastAPI Depends() for admin-only endpoints"""
    from app.services.db_utils import get_user_role
    if get_user_role(current_user) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def check_admin_role(user: Union[User, UserProxy]) -> None:
    """Check if user has admin role, raise 403 if not"""
    from app.services.db_utils import get_user_role
    if get_user_role(user) != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


def require_role(required_role: str):
    """Generic role requirement"""
    def role_checker(current_user: Union[User, UserProxy] = Depends(get_current_active_user)) -> Union[User, UserProxy]:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )
        return current_user
    return role_checker


def get_user_by_email(email: str) -> Optional[UserProxy]:
    """Get user by email via Turso HTTP API"""
    try:
        result = execute_query(
            "SELECT id, email, hashed_password, is_active, is_verified, name, user_type, role, "
            "bio, skills, hourly_rate, profile_image_url, location, profile_data, "
            "two_factor_enabled, joined_at, created_at, account_balance, seller_level, "
            "availability_status, headline, experience_level, languages FROM users WHERE email = ?",
            [email.lower().strip()]
        )
        rows = parse_rows(result)
        if rows:
            return UserProxy(rows[0])
        return None
    except Exception as e:
        logger.error(f"Error getting user by email: {e}")
        return None


def get_user_by_id(user_id: int) -> Optional[UserProxy]:
    """Get user by ID via Turso HTTP API"""
    try:
        result = execute_query(
            "SELECT id, email, hashed_password, is_active, is_verified, name, user_type, role, "
            "bio, skills, hourly_rate, profile_image_url, location, profile_data, "
            "two_factor_enabled, joined_at, created_at, account_balance, seller_level, "
            "availability_status, headline, experience_level, languages FROM users WHERE id = ?",
            [user_id]
        )
        rows = parse_rows(result)
        if rows:
            return UserProxy(rows[0])
        return None
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        return None


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """Validate password against configured policy. Returns (is_valid, list_of_errors)."""
    settings = get_settings()
    errors = []
    
    if len(password) < settings.password_min_length:
        errors.append(f"Password must be at least {settings.password_min_length} characters")
    if len(password) > settings.password_max_length:
        errors.append(f"Password must be at most {settings.password_max_length} characters")
    if settings.password_require_uppercase and not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")
    if settings.password_require_lowercase and not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")
    if settings.password_require_digit and not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")
    if settings.password_require_special and not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
        errors.append("Password must contain at least one special character")
    
    # Common password check (top 20 most common)
    common_passwords = {
        'password', '123456', '12345678', 'qwerty', 'abc123',
        'password1', '111111', '1234567', 'letmein', 'admin',
        'welcome', 'monkey', 'master', 'dragon', 'login',
        'princess', 'football', 'shadow', 'sunshine', 'trustno1'
    }
    if password.lower() in common_passwords:
        errors.append("Password is too common. Please choose a stronger password.")
    
    return (len(errors) == 0, errors)


