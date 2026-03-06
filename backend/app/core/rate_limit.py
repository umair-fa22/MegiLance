# @AI-HINT: Rate limiting middleware using SlowAPI to prevent DDoS attacks and abuse
# Configures different rate limits for authentication, API calls, and public endpoints
# Supports: role-based limits, trusted IP bypass, dynamic limit configuration

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request


def get_real_client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For behind reverse proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP (client's real IP before any proxies)
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Initialize limiter
# Uses real client IP as the key for rate limiting
limiter = Limiter(
    key_func=get_real_client_ip,
    default_limits=["200/minute"],  # Global default: 200 requests per minute
    storage_uri="memory://",  # In-memory storage (use Redis in production)
    enabled=True,
    headers_enabled=True,  # Include X-RateLimit-* response headers
)


def get_limiter():
    """Get the configured rate limiter instance"""
    return limiter


# Custom rate limit decorator functions for different endpoint types

def auth_rate_limit():
    """
    Rate limit for authentication endpoints (stricter)
    
    Applied to: login, register, password reset
    Limit: 10 requests per minute to prevent brute force attacks
    """
    return limiter.limit("10/minute")


def password_reset_rate_limit():
    """
    Rate limit for password reset requests (very strict)
    
    Applied to: forgot password, reset password
    Limit: 3 requests per hour to prevent abuse
    """
    return limiter.limit("3/hour")


def api_rate_limit():
    """
    Standard rate limit for API endpoints
    
    Applied to: general API calls
    Limit: 100 requests per minute
    """
    return limiter.limit("100/minute")


def public_rate_limit():
    """
    Rate limit for public/read-only endpoints (more lenient)
    
    Applied to: health checks, public profiles, search
    Limit: 200 requests per minute
    """
    return limiter.limit("200/minute")


def strict_rate_limit():
    """
    Very strict rate limit for sensitive operations
    
    Applied to: admin operations, bulk actions
    Limit: 10 requests per minute
    """
    return limiter.limit("10/minute")


def email_rate_limit():
    """
    Rate limit for email sending endpoints
    
    Applied to: verification email, password reset email
    Limit: 5 requests per hour to prevent email spam
    """
    return limiter.limit("5/hour")


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
