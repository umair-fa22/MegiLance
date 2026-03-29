# @AI-HINT: Persistent token blacklist service using Turso database
# Replaces in-memory Set-based blacklist with DB-backed persistence
# Tokens survive server restarts and scale across instances

import logging
from datetime import datetime, timezone

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)

# In-memory cache to avoid DB lookups for recently checked tokens
# This is a performance optimization, not the source of truth
_blacklist_cache: dict[str, float] = {}  # token_hash -> expiry_timestamp
_clean_cache: dict[str, float] = {}  # token_hash -> time_checked (negative cache)
_CACHE_MAX_SIZE = 1000
_CLEAN_CACHE_TTL = 300  # 5 min: non-blacklisted tokens cached this long


def _ensure_table_exists() -> None:
    """Create revoked_tokens table if it doesn't exist."""
    try:
        execute_query(
            """CREATE TABLE IF NOT EXISTS revoked_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                revoked_at TEXT NOT NULL DEFAULT (datetime('now')),
                reason TEXT DEFAULT 'logout'
            )"""
        )
        # Index for fast lookups and cleanup
        execute_query(
            "CREATE INDEX IF NOT EXISTS idx_revoked_tokens_hash ON revoked_tokens(token_hash)"
        )
        execute_query(
            "CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at)"
        )
    except Exception as e:
        logger.warning(f"Could not ensure revoked_tokens table: {e}")


def _hash_token(token: str) -> str:
    """Hash token for storage — we don't need to store the raw JWT."""
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()


def add_token_to_blacklist(token: str, expires_at: datetime, reason: str = "logout") -> None:
    """
    Add a token to the persistent blacklist.
    
    Args:
        token: The raw JWT token string
        expires_at: When the token naturally expires (for cleanup)
        reason: Why the token was revoked (logout, password_change, etc.)
    """
    token_hash = _hash_token(token)
    expires_str = expires_at.isoformat()
    
    try:
        _ensure_table_exists()
        execute_query(
            """INSERT OR IGNORE INTO revoked_tokens (token_hash, expires_at, reason)
               VALUES (?, ?, ?)""",
            [token_hash, expires_str, reason]
        )
        
        # Update cache
        _blacklist_cache[token_hash] = expires_at.timestamp()
        _clean_cache.pop(token_hash, None)  # Remove from negative cache
        _trim_cache()
        
        logger.info(f"Token blacklisted (reason={reason}), expires at {expires_str}")
    except Exception as e:
        logger.error(f"Failed to blacklist token: {e}")
        # Fallback: at least cache it in memory for this server instance
        _blacklist_cache[token_hash] = expires_at.timestamp()


def is_token_blacklisted(token: str) -> bool:
    """
    Check if a token has been revoked.
    Uses in-memory cache first, falls back to DB lookup.
    """
    import time as _time
    token_hash = _hash_token(token)
    
    # Check memory cache first (positive cache - token IS blacklisted)
    if token_hash in _blacklist_cache:
        expiry = _blacklist_cache[token_hash]
        if datetime.now(timezone.utc).timestamp() > expiry:
            del _blacklist_cache[token_hash]
            return False
        return True
    
    # Check negative cache (token was recently verified as NOT blacklisted)
    clean_ts = _clean_cache.get(token_hash)
    if clean_ts and _time.time() - clean_ts < _CLEAN_CACHE_TTL:
        return False
    
    # Check database
    try:
        result = execute_query(
            "SELECT expires_at FROM revoked_tokens WHERE token_hash = ?",
            [token_hash]
        )
        rows = parse_rows(result)
        
        if rows:
            expires_str = rows[0].get("expires_at", "")
            try:
                expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) > expires_at:
                    _cleanup_single(token_hash)
                    return False
                _blacklist_cache[token_hash] = expires_at.timestamp()
                _trim_cache()
                return True
            except (ValueError, TypeError):
                return True
        
        # Not blacklisted - cache this fact
        _clean_cache[token_hash] = _time.time()
        return False
    except Exception as e:
        logger.error(f"Failed to check token blacklist: {e}")
        # On DB error, check cache only
        return token_hash in _blacklist_cache


def cleanup_expired_tokens() -> int:
    """
    Remove expired tokens from the blacklist table.
    Call this periodically (e.g., on startup or via scheduled task).
    Returns the number of cleaned-up tokens.
    """
    try:
        _ensure_table_exists()
        now_str = datetime.now(timezone.utc).isoformat()
        
        # Count first
        result = execute_query(
            "SELECT COUNT(*) as cnt FROM revoked_tokens WHERE expires_at < ?",
            [now_str]
        )
        rows = parse_rows(result)
        count = int(rows[0].get("cnt", 0)) if rows else 0
        
        if count > 0:
            execute_query(
                "DELETE FROM revoked_tokens WHERE expires_at < ?",
                [now_str]
            )
            logger.info(f"Cleaned up {count} expired blacklisted tokens")
        
        # Also clean memory cache
        now_ts = datetime.now(timezone.utc).timestamp()
        expired_keys = [k for k, v in _blacklist_cache.items() if now_ts > v]
        for k in expired_keys:
            del _blacklist_cache[k]
        
        return count
    except Exception as e:
        logger.error(f"Failed to cleanup expired tokens: {e}")
        return 0


def _cleanup_single(token_hash: str) -> None:
    """Remove a single expired token from DB."""
    try:
        execute_query(
            "DELETE FROM revoked_tokens WHERE token_hash = ?",
            [token_hash]
        )
    except Exception:
        pass


def _trim_cache() -> None:
    """Keep the in-memory cache from growing unbounded."""
    if len(_blacklist_cache) > _CACHE_MAX_SIZE:
        # Remove oldest entries (by expiry time)
        sorted_keys = sorted(_blacklist_cache.keys(), key=lambda k: _blacklist_cache[k])
        for k in sorted_keys[:len(_blacklist_cache) - _CACHE_MAX_SIZE]:
            del _blacklist_cache[k]



    """Initialize the token blacklist table on startup."""
    try:
        _ensure_table_exists()
        cleaned = cleanup_expired_tokens()
        logger.info(f"Token blacklist initialized, cleaned {cleaned} expired entries")
    except Exception as e:
        logger.warning(f"Token blacklist init warning: {e}")

