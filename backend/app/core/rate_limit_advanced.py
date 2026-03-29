"""
@AI-HINT: Rate limiting with Redis/memory backend for production-grade API protection
Implements tiered rate limiting based on user roles and endpoint sensitivity
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Optional, Tuple, Callable, Any
from dataclasses import dataclass, field
from collections import defaultdict
import asyncio
import time
import hashlib
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# Rate Limit Configuration
# ============================================================================

@dataclass
class RateLimitRule:
    """Configuration for a rate limit rule"""
    requests: int  # Number of requests allowed
    window: int  # Time window in seconds
    burst: int = 0  # Additional burst capacity
    key_prefix: str = ""  # Prefix for the rate limit key
    
    @property
    def window_ms(self) -> int:
        return self.window * 1000


@dataclass
class RateLimitTier:
    """Rate limit tiers for different user types"""
    anonymous: RateLimitRule = field(default_factory=lambda: RateLimitRule(30, 60))  # 30/min
    authenticated: RateLimitRule = field(default_factory=lambda: RateLimitRule(100, 60))  # 100/min
    premium: RateLimitRule = field(default_factory=lambda: RateLimitRule(300, 60))  # 300/min
    admin: RateLimitRule = field(default_factory=lambda: RateLimitRule(1000, 60))  # 1000/min


# Default tiers
DEFAULT_TIERS = RateLimitTier()

# Endpoint-specific overrides
ENDPOINT_LIMITS: Dict[str, RateLimitRule] = {
    # Auth endpoints (stricter)
    "/api/auth/login": RateLimitRule(5, 60, burst=2),  # 5/min
    "/api/auth/register": RateLimitRule(3, 60),  # 3/min
    "/api/auth/forgot-password": RateLimitRule(3, 300),  # 3/5min
    "/api/auth/reset-password": RateLimitRule(5, 300),  # 5/5min
    
    # Sensitive operations
    "/api/payments/withdraw": RateLimitRule(5, 3600),  # 5/hour
    "/api/payments/create": RateLimitRule(10, 60),  # 10/min
    
    # Search endpoints (heavier)
    "/api/search": RateLimitRule(20, 60),  # 20/min
    "/api/freelancers": RateLimitRule(30, 60),  # 30/min
    "/api/projects/search": RateLimitRule(30, 60),  # 30/min
    
    # File uploads
    "/api/files/upload": RateLimitRule(10, 60),  # 10/min
    
    # AI features (expensive)
    "/api/ai/match": RateLimitRule(5, 60),  # 5/min
    "/api/ai/generate": RateLimitRule(10, 60),  # 10/min
}


# ============================================================================
# Token Bucket Implementation
# ============================================================================

class TokenBucket:
    """Token bucket algorithm for rate limiting"""
    
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.tokens = capacity
        self.last_refill = time.time()
        self._lock = asyncio.Lock()
    
    async def consume(self, tokens: int = 1) -> Tuple[bool, float]:
        """
        Attempt to consume tokens
        Returns (success, wait_time_if_failed)
        """
        async with self._lock:
            now = time.time()
            
            # Refill tokens based on time passed
            time_passed = now - self.last_refill
            self.tokens = min(
                self.capacity,
                self.tokens + time_passed * self.refill_rate
            )
            self.last_refill = now
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True, 0
            else:
                # Calculate wait time
                tokens_needed = tokens - self.tokens
                wait_time = tokens_needed / self.refill_rate
                return False, wait_time
    
    def get_remaining(self) -> int:
        """Get remaining tokens"""
        return int(self.tokens)


# ============================================================================
# In-Memory Rate Limiter
# ============================================================================

class MemoryRateLimiter:
    """In-memory rate limiter using sliding window"""
    
    def __init__(self):
        # key -> list of timestamps
        self._requests: Dict[str, list] = defaultdict(list)
        # key -> token bucket
        self._buckets: Dict[str, TokenBucket] = {}
        # Cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
    
    async def start(self):
        """Start cleanup task"""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
    
    async def stop(self):
        """Stop cleanup task"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            self._cleanup_task = None
    
    async def _cleanup_loop(self):
        """Periodically clean up old entries"""
        while True:
            try:
                await asyncio.sleep(60)  # Cleanup every minute
                await self._cleanup()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Rate limiter cleanup error: {e}")
    
    async def _cleanup(self):
        """Remove expired entries"""
        async with self._lock:
            now = time.time()
            cutoff = now - 3600  # Keep last hour
            
            keys_to_remove = []
            for key, timestamps in self._requests.items():
                # Remove old timestamps
                self._requests[key] = [ts for ts in timestamps if ts > cutoff]
                if not self._requests[key]:
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self._requests[key]
                self._buckets.pop(key, None)
    
    async def is_allowed(
        self,
        key: str,
        rule: RateLimitRule
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if a request is allowed
        Returns (allowed, info_dict)
        """
        async with self._lock:
            now = time.time()
            window_start = now - rule.window
            
            # Get or create bucket for burst handling
            if key not in self._buckets:
                capacity = rule.requests + rule.burst
                refill_rate = rule.requests / rule.window
                self._buckets[key] = TokenBucket(capacity, refill_rate)
            
            bucket = self._buckets[key]
            
            # Try to consume from bucket
            allowed, wait_time = await bucket.consume()
            
            # Calculate sliding window stats
            timestamps = self._requests[key]
            recent = [ts for ts in timestamps if ts > window_start]
            
            info = {
                "limit": rule.requests,
                "remaining": bucket.get_remaining(),
                "reset": int(now + rule.window),
                "window": rule.window,
            }
            
            if allowed:
                self._requests[key] = recent + [now]
            else:
                info["retry_after"] = int(wait_time) + 1
            
            return allowed, info


# ============================================================================
# Redis Rate Limiter (for production)
# ============================================================================

class RedisRateLimiter:
    """Redis-based rate limiter for distributed systems"""
    
    def __init__(self, redis_url: Optional[str] = None):
        self._redis = None
        self._redis_url = redis_url
    
    async def connect(self):
        """Connect to Redis"""
        if self._redis_url:
            try:
                import redis.asyncio as redis
                self._redis = await redis.from_url(
                    self._redis_url,
                    encoding="utf-8",
                    decode_responses=True
                )
                logger.info("Connected to Redis for rate limiting")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}")
                self._redis = None
    
    async def is_allowed(
        self,
        key: str,
        rule: RateLimitRule
    ) -> Tuple[bool, Dict[str, Any]]:
        """Check if request is allowed using Redis"""
        if not self._redis:
            return True, {"limit": rule.requests, "remaining": rule.requests}
        
        try:
            full_key = f"ratelimit:{rule.key_prefix}:{key}"
            now = time.time()
            window_start = now - rule.window
            
            pipe = self._redis.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(full_key, 0, window_start)
            # Count current entries
            pipe.zcard(full_key)
            # Add new entry
            pipe.zadd(full_key, {str(now): now})
            # Set expiry
            pipe.expire(full_key, rule.window + 60)
            
            results = await pipe.execute()
            request_count = results[1]
            
            allowed = request_count < rule.requests + rule.burst
            
            info = {
                "limit": rule.requests,
                "remaining": max(0, rule.requests - request_count),
                "reset": int(now + rule.window),
                "window": rule.window,
            }
            
            if not allowed:
                # Calculate retry after
                oldest = await self._redis.zrange(full_key, 0, 0, withscores=True)
                if oldest:
                    retry_after = oldest[0][1] + rule.window - now
                    info["retry_after"] = int(retry_after) + 1
            
            return allowed, info
            
        except Exception as e:
            logger.error(f"Redis rate limit error: {e}")
            return True, {"limit": rule.requests, "remaining": rule.requests}


# ============================================================================
# Rate Limiter Manager
# ============================================================================

class RateLimiterManager:
    """Manages rate limiting across the application"""
    
    def __init__(self, redis_url: Optional[str] = None):
        self._memory = MemoryRateLimiter()
        self._redis = RedisRateLimiter(redis_url) if redis_url else None
        self._tiers = DEFAULT_TIERS
        self._endpoint_limits = ENDPOINT_LIMITS.copy()
    
    async def start(self):
        """Start the rate limiter"""
        await self._memory.start()
        if self._redis:
            await self._redis.connect()
    
    async def stop(self):
        """Stop the rate limiter"""
        await self._memory.stop()
    
    def _get_key(
        self,
        request: Request,
        user_id: Optional[str] = None
    ) -> str:
        """Generate rate limit key from request"""
        # Get client IP
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        # Include user ID if authenticated
        if user_id:
            key_parts = [user_id, request.url.path]
        else:
            key_parts = [ip, request.url.path]
        
        return hashlib.sha256(":".join(key_parts).encode()).hexdigest()[:32]
    
    def _get_rule(
        self,
        path: str,
        user_tier: str = "anonymous"
    ) -> RateLimitRule:
        """Get the rate limit rule for a path and user tier"""
        # Check endpoint-specific limits first
        for endpoint, rule in self._endpoint_limits.items():
            if path.startswith(endpoint):
                return rule
        
        # Fall back to tier-based limits
        if user_tier == "admin":
            return self._tiers.admin
        elif user_tier == "premium":
            return self._tiers.premium
        elif user_tier == "authenticated":
            return self._tiers.authenticated
        else:
            return self._tiers.anonymous
    
    async def check(
        self,
        request: Request,
        user_id: Optional[str] = None,
        user_tier: str = "anonymous"
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if a request should be rate limited
        Returns (allowed, info)
        """
        key = self._get_key(request, user_id)
        rule = self._get_rule(request.url.path, user_tier)
        
        # Try Redis first, fall back to memory
        if self._redis:
            return await self._redis.is_allowed(key, rule)
        else:
            return await self._memory.is_allowed(key, rule)
    
    def add_endpoint_limit(self, path: str, rule: RateLimitRule):
        """Add or update an endpoint-specific limit"""
        self._endpoint_limits[path] = rule


# ============================================================================
# Global Instance
# ============================================================================

rate_limiter = RateLimiterManager()


# ============================================================================
# Middleware
# ============================================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting"""
    
    def __init__(self, app, manager: RateLimiterManager):
        super().__init__(app)
        self.manager = manager
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths
        skip_paths = ["/health", "/api/health", "/docs", "/openapi.json"]
        if any(request.url.path.startswith(p) for p in skip_paths):
            return await call_next(request)
        
        # Get user info from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        user_tier = getattr(request.state, "user_tier", "anonymous")
        
        # Check rate limit
        allowed, info = await self.manager.check(request, user_id, user_tier)
        
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Too many requests",
                    "limit": info.get("limit"),
                    "retry_after": info.get("retry_after", 60),
                },
                headers={
                    "X-RateLimit-Limit": str(info.get("limit", 0)),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(info.get("reset", 0)),
                    "Retry-After": str(info.get("retry_after", 60)),
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(info.get("limit", 0))
        response.headers["X-RateLimit-Remaining"] = str(info.get("remaining", 0))
        response.headers["X-RateLimit-Reset"] = str(info.get("reset", 0))
        
        return response


# ============================================================================
# Decorator for route-specific limits
# ============================================================================

def rate_limit(requests: int, window: int = 60, burst: int = 0):
    """
    Decorator to apply rate limiting to a specific route
    
    Usage:
        @router.get("/expensive-operation")
        @rate_limit(requests=5, window=60)
        async def expensive_operation():
            ...
    """
    def decorator(func: Callable):
        func._rate_limit = RateLimitRule(requests, window, burst)
        return func
    return decorator
