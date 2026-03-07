# @AI-HINT: Advanced rate limiting service with tiered limits and analytics
"""Rate Limiting Pro Service - Advanced API rate limiting."""

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from collections import defaultdict
from enum import Enum

logger = logging.getLogger(__name__)


class RateLimitTier(str, Enum):
    """Rate limit tiers."""
    FREE = "free"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    ADMIN = "admin"


# Tier configurations (requests per minute)
TIER_LIMITS = {
    RateLimitTier.FREE: {
        "default": 30,
        "auth": 5,
        "search": 20,
        "upload": 5,
        "export": 2,
        "ai": 10
    },
    RateLimitTier.BASIC: {
        "default": 60,
        "auth": 10,
        "search": 40,
        "upload": 10,
        "export": 5,
        "ai": 20
    },
    RateLimitTier.PROFESSIONAL: {
        "default": 120,
        "auth": 20,
        "search": 100,
        "upload": 30,
        "export": 20,
        "ai": 50
    },
    RateLimitTier.ENTERPRISE: {
        "default": 500,
        "auth": 50,
        "search": 300,
        "upload": 100,
        "export": 50,
        "ai": 200
    },
    RateLimitTier.ADMIN: {
        "default": 1000,
        "auth": 100,
        "search": 500,
        "upload": 200,
        "export": 100,
        "ai": 500
    }
}

# Endpoint to category mapping
ENDPOINT_CATEGORIES = {
    "/api/auth/": "auth",
    "/api/v1/auth/": "auth",
    "/api/v1/search": "search",
    "/api/v1/projects/search": "search",
    "/api/v1/users/search": "search",
    "/api/v1/upload": "upload",
    "/api/v1/files": "upload",
    "/api/v1/export": "export",
    "/api/v1/ai/": "ai",
    "/api/v1/chatbot/": "ai",
    "/api/v1/recommendations/": "ai"
}


class RateLimitEntry:
    """Rate limit tracking entry."""
    def __init__(self, window_size: int = 60):
        self.window_size = window_size
        self.requests: List[float] = []
    
    def add_request(self) -> None:
        """Add a request timestamp."""
        now = time.time()
        self.requests.append(now)
        # Clean old requests
        cutoff = now - self.window_size
        self.requests = [t for t in self.requests if t > cutoff]
    
    def get_count(self) -> int:
        """Get request count in current window."""
        now = time.time()
        cutoff = now - self.window_size
        self.requests = [t for t in self.requests if t > cutoff]
        return len(self.requests)
    
    def get_reset_time(self) -> float:
        """Get seconds until window resets."""
        if not self.requests:
            return 0
        oldest = min(self.requests)
        reset_at = oldest + self.window_size
        return max(0, reset_at - time.time())


class RateLimitingProService:
    """
    Advanced rate limiting service.
    
    Provides tiered rate limits, analytics,
    and protection against API abuse.
    """
    
    def __init__(self):
        # In-memory rate limit tracking
        # Format: {identifier: {category: RateLimitEntry}}
        self._limits: Dict[str, Dict[str, RateLimitEntry]] = defaultdict(dict)
        self._bypass_tokens: Dict[str, datetime] = {}
        self._blocked_ips: Dict[str, datetime] = {}
        self._analytics: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    
    async def check_rate_limit(
        self,
        identifier: str,
        endpoint: str,
        tier: RateLimitTier = RateLimitTier.FREE,
        bypass_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check if request is within rate limits.
        
        Args:
            identifier: User ID or IP address
            endpoint: API endpoint path
            tier: User's rate limit tier
            bypass_token: Optional bypass token
            
        Returns:
            Rate limit check result
        """
        # Check bypass token
        if bypass_token and self._validate_bypass_token(bypass_token):
            return {
                "allowed": True,
                "remaining": 999999,
                "limit": 999999,
                "reset_in": 0,
                "bypassed": True
            }
        
        # Check if IP is blocked
        if identifier in self._blocked_ips:
            block_until = self._blocked_ips[identifier]
            if datetime.now(timezone.utc) < block_until:
                return {
                    "allowed": False,
                    "remaining": 0,
                    "limit": 0,
                    "reset_in": (block_until - datetime.now(timezone.utc)).seconds,
                    "blocked": True,
                    "reason": "Too many requests - temporarily blocked"
                }
            else:
                del self._blocked_ips[identifier]
        
        # Determine category and limit
        category = self._get_endpoint_category(endpoint)
        tier_limits = TIER_LIMITS.get(tier, TIER_LIMITS[RateLimitTier.FREE])
        limit = tier_limits.get(category, tier_limits["default"])
        
        # Get or create rate limit entry
        if category not in self._limits[identifier]:
            self._limits[identifier][category] = RateLimitEntry()
        
        entry = self._limits[identifier][category]
        current_count = entry.get_count()
        
        # Check if within limit
        if current_count >= limit:
            # Track analytics for rate limit hit
            self._track_analytics(identifier, category, "blocked")
            
            # Check for abuse (repeated rate limit hits)
            abuse_count = self._analytics[identifier].get(f"{category}_blocked", 0)
            if abuse_count > 100:  # 100 blocked requests = temporary ban
                self._blocked_ips[identifier] = datetime.now(timezone.utc) + timedelta(hours=1)
            
            return {
                "allowed": False,
                "remaining": 0,
                "limit": limit,
                "reset_in": entry.get_reset_time(),
                "category": category,
                "tier": tier.value
            }
        
        # Allow request and track
        entry.add_request()
        self._track_analytics(identifier, category, "allowed")
        
        return {
            "allowed": True,
            "remaining": limit - current_count - 1,
            "limit": limit,
            "reset_in": entry.get_reset_time(),
            "category": category,
            "tier": tier.value
        }
    
    async def get_rate_limit_status(
        self,
        identifier: str,
        tier: RateLimitTier = RateLimitTier.FREE
    ) -> Dict[str, Any]:
        """Get current rate limit status for all categories."""
        tier_limits = TIER_LIMITS.get(tier, TIER_LIMITS[RateLimitTier.FREE])
        
        status = {}
        for category, limit in tier_limits.items():
            entry = self._limits.get(identifier, {}).get(category)
            if entry:
                count = entry.get_count()
                status[category] = {
                    "used": count,
                    "limit": limit,
                    "remaining": max(0, limit - count),
                    "reset_in": entry.get_reset_time()
                }
            else:
                status[category] = {
                    "used": 0,
                    "limit": limit,
                    "remaining": limit,
                    "reset_in": 60
                }
        
        return {
            "identifier": identifier,
            "tier": tier.value,
            "categories": status
        }
    
    async def get_tier_limits(
        self,
        tier: RateLimitTier
    ) -> Dict[str, Any]:
        """Get limits for a tier."""
        limits = TIER_LIMITS.get(tier, TIER_LIMITS[RateLimitTier.FREE])
        
        return {
            "tier": tier.value,
            "limits": limits,
            "window_seconds": 60,
            "categories": list(limits.keys())
        }
    
    async def create_bypass_token(
        self,
        valid_until: datetime
    ) -> str:
        """Create a rate limit bypass token."""
        import secrets
        token = secrets.token_urlsafe(32)
        self._bypass_tokens[token] = valid_until
        
        return token
    
    async def revoke_bypass_token(
        self,
        token: str
    ) -> bool:
        """Revoke a bypass token."""
        if token in self._bypass_tokens:
            del self._bypass_tokens[token]
            return True
        return False
    
    async def block_identifier(
        self,
        identifier: str,
        duration_minutes: int = 60,
        reason: str = "Manual block"
    ) -> Dict[str, Any]:
        """Block an identifier temporarily."""
        until = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)
        self._blocked_ips[identifier] = until
        
        logger.warning(f"Blocked identifier {identifier} until {until}: {reason}")
        
        return {
            "identifier": identifier,
            "blocked_until": until.isoformat(),
            "duration_minutes": duration_minutes,
            "reason": reason
        }
    
    async def unblock_identifier(
        self,
        identifier: str
    ) -> bool:
        """Unblock an identifier."""
        if identifier in self._blocked_ips:
            del self._blocked_ips[identifier]
            return True
        return False
    
    async def get_blocked_list(self) -> List[Dict[str, Any]]:
        """Get list of blocked identifiers."""
        now = datetime.now(timezone.utc)
        blocked = []
        
        for identifier, until in self._blocked_ips.items():
            if until > now:
                blocked.append({
                    "identifier": identifier,
                    "blocked_until": until.isoformat(),
                    "remaining_seconds": (until - now).seconds
                })
        
        return blocked
    
    async def get_analytics(
        self,
        identifier: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get rate limit analytics."""
        if identifier:
            data = dict(self._analytics.get(identifier, {}))
            return {
                "identifier": identifier,
                "analytics": data
            }
        
        # Aggregate analytics
        totals = defaultdict(int)
        for ident_analytics in self._analytics.values():
            for key, count in ident_analytics.items():
                totals[key] += count
        
        return {
            "total_requests": sum(totals.values()),
            "by_category": dict(totals),
            "unique_identifiers": len(self._analytics)
        }
    
    async def reset_limits(
        self,
        identifier: str
    ) -> Dict[str, Any]:
        """Reset rate limits for an identifier."""
        if identifier in self._limits:
            del self._limits[identifier]
        
        return {
            "identifier": identifier,
            "status": "reset"
        }
    
    async def get_abuse_report(self) -> Dict[str, Any]:
        """Get abuse detection report."""
        abusers = []
        
        for identifier, analytics in self._analytics.items():
            blocked_count = sum(
                count for key, count in analytics.items()
                if key.endswith("_blocked")
            )
            
            if blocked_count > 50:
                abusers.append({
                    "identifier": identifier,
                    "blocked_requests": blocked_count,
                    "is_blocked": identifier in self._blocked_ips
                })
        
        # Sort by blocked count
        abusers.sort(key=lambda x: x["blocked_requests"], reverse=True)
        
        return {
            "total_abusers": len(abusers),
            "abusers": abusers[:50],  # Top 50
            "currently_blocked": len(self._blocked_ips)
        }
    
    def _get_endpoint_category(self, endpoint: str) -> str:
        """Determine category for an endpoint."""
        for prefix, category in ENDPOINT_CATEGORIES.items():
            if endpoint.startswith(prefix):
                return category
        return "default"
    
    def _validate_bypass_token(self, token: str) -> bool:
        """Validate a bypass token."""
        if token not in self._bypass_tokens:
            return False
        
        valid_until = self._bypass_tokens[token]
        if datetime.now(timezone.utc) > valid_until:
            del self._bypass_tokens[token]
            return False
        
        return True
    
    def _track_analytics(
        self,
        identifier: str,
        category: str,
        action: str
    ) -> None:
        """Track analytics for rate limiting."""
        key = f"{category}_{action}"
        self._analytics[identifier][key] += 1


# Singleton instance
_rate_limit_service: Optional[RateLimitingProService] = None


def get_rate_limit_service() -> RateLimitingProService:
    """Get or create rate limiting service instance."""
    global _rate_limit_service
    if _rate_limit_service is None:
        _rate_limit_service = RateLimitingProService()
    return _rate_limit_service
