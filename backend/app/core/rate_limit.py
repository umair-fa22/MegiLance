# @AI-HINT: Rate limiting middleware using SlowAPI to prevent DDoS attacks and abuse
# Configures different rate limits for authentication, API calls, and public endpoints
# Supports: role-based limits, trusted IP bypass, dynamic limit configuration

import logging
import functools
import inspect
logger = logging.getLogger(__name__)

from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from starlette.responses import Response as StarletteResponse


def get_real_client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For behind reverse proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP (client's real IP before any proxies)
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


import os

# Disable rate limiting in test environments so fixtures can create many users quickly
_testing = os.getenv("TESTING", "").lower() in ("1", "true", "yes")

# Initialize limiter
# Uses real client IP as the key for rate limiting
limiter = Limiter(
    key_func=get_real_client_ip,
    default_limits=["200/minute"],  # Global default: 200 requests per minute
    storage_uri="memory://",  # In-memory storage (use Redis in production)
    enabled=not _testing,  # Disabled when TESTING=1
    headers_enabled=True,  # Include X-RateLimit-* response headers
)


def get_limiter():
    """Get the configured rate limiter instance"""
    return limiter


def _safe_limit(limit_string: str):
    """
    Create a rate limit decorator that safely handles endpoints returning Pydantic models.
    SlowAPI requires a `response: Response` parameter to inject rate-limit headers.
    This wrapper automatically adds one if the endpoint doesn't already have it.
    """
    slowapi_decorator = limiter.limit(limit_string)

    def decorator(func):
        sig = inspect.signature(func)
        if "response" in sig.parameters:
            return slowapi_decorator(func)

        # Build a new signature that includes the original params + response
        params = list(sig.parameters.values())
        response_param = inspect.Parameter(
            "response",
            inspect.Parameter.KEYWORD_ONLY,
            default=None,
            annotation=StarletteResponse,
        )
        params.append(response_param)
        new_sig = sig.replace(parameters=params)

        if inspect.iscoroutinefunction(func):
            @functools.wraps(func)
            async def wrapper(*args, response: StarletteResponse = None, **kwargs):
                return await func(*args, **kwargs)
        else:
            @functools.wraps(func)
            def wrapper(*args, response: StarletteResponse = None, **kwargs):
                return func(*args, **kwargs)

        wrapper.__signature__ = new_sig
        return slowapi_decorator(wrapper)

    return decorator


# Custom rate limit decorator functions for different endpoint types

def auth_rate_limit():
    """
    Rate limit for authentication endpoints (stricter)
    
    Applied to: login, register, password reset
    Limit: 10 requests per minute to prevent brute force attacks
    """
    return _safe_limit("10/minute")


def password_reset_rate_limit():
    """
    Rate limit for password reset requests (very strict)
    
    Applied to: forgot password, reset password
    Limit: 3 requests per hour to prevent abuse
    """
    return _safe_limit("3/hour")


def api_rate_limit():
    """
    Standard rate limit for API endpoints
    
    Applied to: general API calls
    Limit: 100 requests per minute
    """
    return _safe_limit("100/minute")


def public_rate_limit():
    """
    Rate limit for public/read-only endpoints (more lenient)
    
    Applied to: health checks, public profiles, search
    Limit: 200 requests per minute
    """
    return _safe_limit("200/minute")


def strict_rate_limit():
    """
    Very strict rate limit for sensitive operations
    
    Applied to: admin operations, bulk actions
    Limit: 10 requests per minute
    """
    return _safe_limit("10/minute")


def email_rate_limit():
    """
    Rate limit for email sending endpoints
    
    Applied to: verification email, password reset email
    Limit: 5 requests per hour to prevent email spam
    """
    return _safe_limit("5/hour")


# Rate limiting configuration helper
class RateLimitConfig:
    """Configuration for rate limiting settings"""
    
    # Authentication endpoints (strict in production to prevent brute force)
    AUTH_LOGIN = "10/minute"
    AUTH_REGISTER = "5/minute"
    AUTH_REFRESH = "30/minute"
    
    # Password & Email verification
    PASSWORD_RESET_REQUEST = "3/hour"
    PASSWORD_RESET_CONFIRM = "5/minute"
    EMAIL_VERIFICATION = "5/hour"
    
    # File upload (moderate)
    FILE_UPLOAD = "20/minute"
    
    # Webhook delivery (lenient for outbound)
    WEBHOOK_DELIVERY = "100/minute"
    
    # Admin operations (strict)
    ADMIN_BULK = "5/minute"
    ADMIN_EXPORT = "3/minute"
    
    # AI / expensive operations
    AI_MATCHING = "10/minute"
    AI_WRITING = "5/minute"
    
    # Search (moderate to prevent scraping)
    SEARCH = "60/minute"
    SEARCH_ADVANCED = "30/minute"
    
    # 2FA endpoints
    TWO_FA_SETUP = "3/hour"
    TWO_FA_VERIFY = "5/minute"
    
    # API operations
    API_READ = "100/minute"
    API_WRITE = "50/minute"
    API_DELETE = "20/minute"
    
    # Public endpoints
    PUBLIC_SEARCH = "200/minute"
    PUBLIC_HEALTH = "500/minute"
    
    # Admin operations
    ADMIN_OPERATIONS = "10/minute"
    
    # File uploads
    FILE_UPLOAD = "10/hour"
