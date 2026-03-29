"""
@AI-HINT: Caching infrastructure with Redis and in-memory fallback
Provides caching for API responses, database queries, and computed values
"""

from typing import Any, Optional, Callable, TypeVar, Dict
from functools import wraps
from dataclasses import dataclass
from collections import OrderedDict
import asyncio
import json
import hashlib
import time
import logging

logger = logging.getLogger(__name__)

T = TypeVar("T")

# ============================================================================
# Cache Configuration
# ============================================================================

@dataclass
class CacheConfig:
    """Cache configuration settings"""
    default_ttl: int = 300  # 5 minutes
    max_size: int = 1000  # Max items in memory cache
    redis_url: Optional[str] = None
    prefix: str = "megilance:"
    serialize: bool = True


# Default TTLs for different data types
CACHE_TTLS = {
    "user_profile": 300,  # 5 min
    "project_list": 60,  # 1 min
    "search_results": 120,  # 2 min
    "freelancer_list": 60,  # 1 min
    "statistics": 600,  # 10 min
    "settings": 3600,  # 1 hour
    "skills": 86400,  # 24 hours
    "categories": 86400,  # 24 hours
}


# ============================================================================
# LRU Memory Cache
# ============================================================================

class LRUCache:
    """Thread-safe LRU cache with TTL support"""
    
    def __init__(self, max_size: int = 1000):
        self._cache: OrderedDict = OrderedDict()
        self._max_size = max_size
        self._lock = asyncio.Lock()
        self._hits = 0
        self._misses = 0
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache"""
        async with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            
            value, expires_at = self._cache[key]
            
            # Check expiration
            if expires_at and time.time() > expires_at:
                del self._cache[key]
                self._misses += 1
                return None
            
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self._hits += 1
            return value
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> None:
        """Set a value in cache"""
        async with self._lock:
            expires_at = time.time() + ttl if ttl else None
            
            # Remove oldest if at capacity
            while len(self._cache) >= self._max_size:
                self._cache.popitem(last=False)
            
            self._cache[key] = (value, expires_at)
            self._cache.move_to_end(key)
    
    async def delete(self, key: str) -> bool:
        """Delete a value from cache"""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    async def clear(self) -> int:
        """Clear all cache entries"""
        async with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count
    
    async def exists(self, key: str) -> bool:
        """Check if key exists and is not expired"""
        return await self.get(key) is not None
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": f"{hit_rate:.1f}%",
        }


# ============================================================================
# Redis Cache
# ============================================================================

class RedisCache:
    """Redis-based cache for distributed systems"""
    
    def __init__(self, redis_url: str, prefix: str = "cache:"):
        self._redis = None
        self._redis_url = redis_url
        self._prefix = prefix
        self._connected = False
    
    async def connect(self) -> bool:
        """Connect to Redis"""
        try:
            import redis.asyncio as redis
            self._redis = await redis.from_url(
                self._redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self._redis.ping()
            self._connected = True
            logger.info("Connected to Redis cache")
            return True
        except ImportError:
            logger.warning("redis package not installed")
            return False
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self._redis:
            await self._redis.close()
            self._connected = False
    
    def _key(self, key: str) -> str:
        """Generate prefixed key"""
        return f"{self._prefix}{key}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache"""
        if not self._connected:
            return None
        
        try:
            value = await self._redis.get(self._key(key))
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Set a value in cache"""
        if not self._connected:
            return False
        
        try:
            serialized = json.dumps(value)
            if ttl:
                await self._redis.setex(self._key(key), ttl, serialized)
            else:
                await self._redis.set(self._key(key), serialized)
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete a value from cache"""
        if not self._connected:
            return False
        
        try:
            result = await self._redis.delete(self._key(key))
            return result > 0
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        if not self._connected:
            return 0
        
        try:
            keys = await self._redis.keys(self._key(pattern))
            if keys:
                return await self._redis.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis clear error: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self._connected:
            return False
        
        try:
            return await self._redis.exists(self._key(key)) > 0
        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return False


# ============================================================================
# Cache Manager
# ============================================================================

class CacheManager:
    """Unified cache manager with Redis and memory fallback"""
    
    def __init__(self, config: Optional[CacheConfig] = None):
        self._config = config or CacheConfig()
        self._memory = LRUCache(self._config.max_size)
        self._redis: Optional[RedisCache] = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize cache backends"""
        if self._initialized:
            return
        
        if self._config.redis_url:
            self._redis = RedisCache(
                self._config.redis_url,
                self._config.prefix
            )
            await self._redis.connect()
        
        self._initialized = True
        logger.info("Cache manager initialized")
    
    async def shutdown(self):
        """Shutdown cache backends"""
        if self._redis:
            await self._redis.disconnect()
    
    def _make_key(self, *parts: str) -> str:
        """Create a cache key from parts"""
        key = ":".join(str(p) for p in parts)
        return hashlib.sha256(key.encode()).hexdigest()[:32]
    
    async def get(
        self,
        key: str,
        default: Optional[T] = None
    ) -> Optional[T]:
        """Get a value from cache"""
        # Try Redis first
        if self._redis and self._redis._connected:
            value = await self._redis.get(key)
            if value is not None:
                # Also cache in memory for faster access
                await self._memory.set(key, value, 60)
                return value
        
        # Fall back to memory
        value = await self._memory.get(key)
        return value if value is not None else default
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Set a value in cache"""
        ttl = ttl or self._config.default_ttl
        
        # Set in memory
        await self._memory.set(key, value, ttl)
        
        # Set in Redis
        if self._redis and self._redis._connected:
            await self._redis.set(key, value, ttl)
        
        return True
    
    async def delete(self, key: str) -> bool:
        """Delete a value from cache"""
        await self._memory.delete(key)
        
        if self._redis and self._redis._connected:
            await self._redis.delete(key)
        
        return True
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        count = 0
        
        if self._redis and self._redis._connected:
            count = await self._redis.clear_pattern(pattern)
        
        # Also clear memory cache
        await self._memory.clear()
        
        return count
    
    async def get_or_set(
        self,
        key: str,
        factory: Callable[[], Any],
        ttl: Optional[int] = None
    ) -> Any:
        """Get from cache or compute and store"""
        value = await self.get(key)
        if value is not None:
            return value
        
        # Compute value
        if asyncio.iscoroutinefunction(factory):
            value = await factory()
        else:
            value = factory()
        
        await self.set(key, value, ttl)
        return value
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "memory": self._memory.stats(),
            "redis_connected": self._redis._connected if self._redis else False,
        }


# ============================================================================
# Global Instance
# ============================================================================

cache = CacheManager()


# ============================================================================
# Caching Decorator
# ============================================================================

def cached(
    ttl: int = 300,
    key_prefix: str = "",
    key_builder: Optional[Callable[..., str]] = None
):
    """
    Decorator to cache function results
    
    Usage:
        @cached(ttl=60, key_prefix="user_profile")
        async def get_user_profile(user_id: str):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default key builder
                key_parts = [key_prefix or func.__name__]
                key_parts.extend(str(a) for a in args)
                key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = ":".join(key_parts)
            
            # Try cache
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # Cache result
            await cache.set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(*patterns: str):
    """
    Decorator to invalidate cache patterns after function execution
    
    Usage:
        @invalidate_cache("user_profile:*", "user_list")
        async def update_user(user_id: str, data: dict):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Execute function
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # Invalidate patterns
            for pattern in patterns:
                # Replace placeholders with args
                resolved_pattern = pattern
                for i, arg in enumerate(args):
                    resolved_pattern = resolved_pattern.replace(f"${i}", str(arg))
                for key, value in kwargs.items():
                    resolved_pattern = resolved_pattern.replace(f"${key}", str(value))
                
                await cache.invalidate_pattern(resolved_pattern)
            
            return result
        
        return wrapper
    return decorator


# ============================================================================
# Cache API Router
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_active_user

cache_router = APIRouter()


@cache_router.get("/stats")
async def get_cache_stats(current_user: dict = Depends(get_current_active_user)):
    """Get cache statistics (admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return cache.stats()


@cache_router.post("/clear")
async def clear_cache(
    pattern: str = "*",
    current_user: dict = Depends(get_current_active_user)
):
    """Clear cache entries (admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    count = await cache.invalidate_pattern(pattern)
    return {"cleared": count, "pattern": pattern}
