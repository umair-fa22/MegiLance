# @AI-HINT: API key management service - developer API key generation and management (DB-backed)
"""API Keys Service - Developer API Key Management. Persisted to Turso DB."""

import uuid
import hashlib
import secrets
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class APIKeyService:
    """Service for managing developer API keys. All data persisted to DB."""

    SCOPES = {
        "read": "Read-only access to public resources",
        "write": "Create and update resources",
        "delete": "Delete resources",
        "admin": "Full administrative access",
        "projects": "Access project endpoints",
        "users": "Access user endpoints",
        "payments": "Access payment endpoints",
        "analytics": "Access analytics endpoints",
        "webhooks": "Manage webhooks"
    }

    TIER_LIMITS = {
        "free": {"requests_per_minute": 60, "requests_per_day": 1000},
        "basic": {"requests_per_minute": 300, "requests_per_day": 10000},
        "premium": {"requests_per_minute": 1000, "requests_per_day": 100000},
        "enterprise": {"requests_per_minute": 5000, "requests_per_day": 1000000}
    }

    KEY_PREFIX = "megilance_"

    def __init__(self):
        # Transient rate-limit windows only (reset on restart is acceptable)
        self._usage_cache: Dict[str, Dict] = {}
    
    def _generate_api_key(self) -> tuple:
        key = self.KEY_PREFIX + secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        return key, key_hash

    def _hash_key(self, api_key: str) -> str:
        return hashlib.sha256(api_key.encode()).hexdigest()

    def _parse_key_row(self, row: Dict) -> Dict:
        """Parse a DB row into a key data dict."""
        row["scopes"] = json.loads(row.get("scopes") or "[]")
        row["rate_limits"] = json.loads(row.get("rate_limits") or "{}")
        row["ip_whitelist"] = json.loads(row.get("ip_whitelist") or "[]")
        row["is_active"] = bool(int(row.get("is_active", 0)))
        row["pending_revocation"] = bool(int(row.get("pending_revocation", 0)))
        row["total_requests"] = int(row.get("total_requests", 0))
        return row

    async def _get_key_by_hash(self, key_hash: str) -> Optional[Dict]:
        result = await execute_query("SELECT * FROM api_keys WHERE key_hash = ?", [key_hash])
        rows = parse_rows(result)
        return self._parse_key_row(rows[0]) if rows else None

    async def _get_key_by_id(self, key_id: str, user_id: str) -> Optional[Dict]:
        result = await execute_query(
            "SELECT * FROM api_keys WHERE id = ? AND user_id = ?", [key_id, str(user_id)]
        )
        rows = parse_rows(result)
        return self._parse_key_row(rows[0]) if rows else None

    async def create_api_key(
        self, user_id: str, name: str, scopes: List[str],
        tier: str = "free", expires_in_days: Optional[int] = 365,
        ip_whitelist: Optional[List[str]] = None, description: Optional[str] = None
    ) -> Dict[str, Any]:
        invalid_scopes = [s for s in scopes if s not in self.SCOPES]
        if invalid_scopes:
            raise ValueError(f"Invalid scopes: {invalid_scopes}")
        if tier not in self.TIER_LIMITS:
            raise ValueError(f"Invalid tier. Must be one of: {list(self.TIER_LIMITS.keys())}")

        result = await execute_query(
            "SELECT COUNT(*) as cnt FROM api_keys WHERE user_id = ? AND is_active = 1",
            [str(user_id)]
        )
        rows = parse_rows(result)
        if rows and int(rows[0].get("cnt", 0)) >= 10:
            raise ValueError("Maximum API key limit (10) reached")

        api_key, key_hash = self._generate_api_key()
        now = datetime.now(timezone.utc).isoformat()
        expires_at = None
        if expires_in_days:
            expires_at = (datetime.now(timezone.utc) + timedelta(days=expires_in_days)).isoformat()

        key_id = str(uuid.uuid4())
        key_prefix = api_key[:20] + "..."

        await execute_query(
            """INSERT INTO api_keys
               (id, key_hash, key_prefix, user_id, name, description, scopes, tier,
                rate_limits, ip_whitelist, is_active, total_requests, created_at, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)""",
            [key_id, key_hash, key_prefix, str(user_id), name, description,
             json.dumps(scopes), tier, json.dumps(self.TIER_LIMITS[tier]),
             json.dumps(ip_whitelist or []), now, expires_at]
        )

        await execute_query(
            """INSERT INTO api_key_usage (key_hash, requests_today, requests_this_minute,
               minute_window_start, day_window_start, updated_at) VALUES (?, 0, 0, ?, ?, ?)""",
            [key_hash, now, datetime.now(timezone.utc).date().isoformat(), now]
        )

        return {
            "success": True,
            "api_key": api_key,
            "key_data": {
                "id": key_id, "name": name, "scopes": scopes,
                "tier": tier, "expires_at": expires_at, "key_prefix": key_prefix
            },
            "warning": "Save this API key securely. It won't be shown again!"
        }

    async def get_user_keys(
        self, user_id: str, include_inactive: bool = False
    ) -> Dict[str, Any]:
        sql = "SELECT * FROM api_keys WHERE user_id = ?"
        params: list = [str(user_id)]
        if not include_inactive:
            sql += " AND is_active = 1"
        sql += " ORDER BY created_at DESC"
        result = await execute_query(sql, params)
        rows = parse_rows(result)

        keys = []
        for row in rows:
            keys.append({
                "id": row["id"], "name": row["name"],
                "description": row.get("description"), "key_prefix": row["key_prefix"],
                "scopes": json.loads(row.get("scopes") or "[]"),
                "tier": row["tier"],
                "is_active": bool(int(row.get("is_active", 0))),
                "last_used_at": row.get("last_used_at"),
                "total_requests": int(row.get("total_requests", 0)),
                "created_at": row["created_at"], "expires_at": row.get("expires_at")
            })

        return {
            "api_keys": keys, "total": len(keys),
            "active": len([k for k in keys if k["is_active"]])
        }

    async def validate_api_key(
        self, api_key: str,
        required_scope: Optional[str] = None, client_ip: Optional[str] = None
    ) -> Dict[str, Any]:
        key_hash = self._hash_key(api_key)
        key_data = await self._get_key_by_hash(key_hash)

        if not key_data:
            return {"valid": False, "error": "Invalid API key"}
        if not key_data["is_active"]:
            return {"valid": False, "error": "API key is inactive"}
        if key_data.get("expires_at"):
            if datetime.now(timezone.utc) > datetime.fromisoformat(key_data["expires_at"]):
                return {"valid": False, "error": "API key has expired"}
        if key_data["ip_whitelist"] and client_ip:
            if client_ip not in key_data["ip_whitelist"]:
                return {"valid": False, "error": "IP address not whitelisted"}
        if required_scope and required_scope not in key_data["scopes"]:
            return {"valid": False, "error": f"API key lacks required scope: {required_scope}"}

        rate_result = await self._check_rate_limit(key_hash, key_data["tier"])
        if not rate_result["allowed"]:
            return {"valid": False, "error": rate_result["error"],
                    "retry_after": rate_result.get("retry_after")}

        now = datetime.now(timezone.utc).isoformat()
        await execute_query(
            "UPDATE api_keys SET last_used_at = ?, total_requests = total_requests + 1 WHERE key_hash = ?",
            [now, key_hash]
        )

        return {
            "valid": True, "user_id": key_data["user_id"],
            "scopes": key_data["scopes"], "tier": key_data["tier"],
            "rate_limits": {
                "remaining_per_minute": rate_result["remaining_per_minute"],
                "remaining_per_day": rate_result["remaining_per_day"]
            }
        }

    async def _check_rate_limit(self, key_hash: str, tier: str) -> Dict[str, Any]:
        limits = self.TIER_LIMITS[tier]
        usage = self._usage_cache.get(key_hash, {})
        now = datetime.now(timezone.utc)

        minute_start = usage.get("minute_window_start")
        if minute_start:
            if (now - datetime.fromisoformat(minute_start)).total_seconds() >= 60:
                usage["requests_this_minute"] = 0
                usage["minute_window_start"] = now.isoformat()
        else:
            usage["minute_window_start"] = now.isoformat()

        day_start = usage.get("day_window_start")
        if day_start and day_start != now.date().isoformat():
            usage["requests_today"] = 0
            usage["day_window_start"] = now.date().isoformat()
        elif not day_start:
            usage["day_window_start"] = now.date().isoformat()

        rpm = usage.get("requests_this_minute", 0)
        rpd = usage.get("requests_today", 0)

        if rpm >= limits["requests_per_minute"]:
            return {"allowed": False, "error": "Rate limit exceeded (per minute)",
                    "retry_after": 60, "remaining_per_minute": 0,
                    "remaining_per_day": limits["requests_per_day"] - rpd}
        if rpd >= limits["requests_per_day"]:
            return {"allowed": False, "error": "Rate limit exceeded (per day)",
                    "retry_after": 86400, "remaining_per_minute": 0, "remaining_per_day": 0}

        usage["requests_this_minute"] = rpm + 1
        usage["requests_today"] = rpd + 1
        self._usage_cache[key_hash] = usage

        return {
            "allowed": True,
            "remaining_per_minute": limits["requests_per_minute"] - usage["requests_this_minute"],
            "remaining_per_day": limits["requests_per_day"] - usage["requests_today"]
        }

    async def revoke_api_key(self, user_id: str, key_id: str) -> Dict[str, Any]:
        key_data = await self._get_key_by_id(key_id, user_id)
        if not key_data:
            raise ValueError("API key not found")
        now = datetime.now(timezone.utc).isoformat()
        await execute_query(
            "UPDATE api_keys SET is_active = 0, revoked_at = ? WHERE id = ? AND user_id = ?",
            [now, key_id, str(user_id)]
        )
        return {"success": True, "message": f"API key '{key_data['name']}' has been revoked"}

    async def rotate_api_key(self, user_id: str, key_id: str) -> Dict[str, Any]:
        key_data = await self._get_key_by_id(key_id, user_id)
        if not key_data:
            raise ValueError("API key not found")

        scopes = key_data["scopes"] if isinstance(key_data["scopes"], list) else json.loads(key_data["scopes"])
        ip_wl = key_data["ip_whitelist"] if isinstance(key_data["ip_whitelist"], list) else json.loads(key_data["ip_whitelist"])

        new_key_result = await self.create_api_key(
            user_id=user_id, name=f"{key_data['name']} (rotated)",
            scopes=scopes, tier=key_data["tier"], expires_in_days=365,
            ip_whitelist=ip_wl, description=key_data.get("description")
        )

        revocation_time = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        await execute_query(
            "UPDATE api_keys SET pending_revocation = 1, revocation_time = ? WHERE id = ?",
            [revocation_time, key_id]
        )
        new_key_hash = self._hash_key(new_key_result["api_key"])
        await execute_query("UPDATE api_keys SET rotated_from = ? WHERE key_hash = ?", [key_id, new_key_hash])

        return {
            "success": True, "new_api_key": new_key_result["api_key"],
            "new_key_data": new_key_result["key_data"],
            "old_key_valid_until": revocation_time,
            "warning": "Old key will be revoked in 24 hours. Migrate to the new key."
        }

    async def update_api_key(
        self, user_id: str, key_id: str, updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        key_data = await self._get_key_by_id(key_id, user_id)
        if not key_data:
            raise ValueError("API key not found")

        allowed_updates = ["name", "description", "scopes", "ip_whitelist"]
        sets: list = []
        params: list = []
        for field, value in updates.items():
            if field in allowed_updates:
                if field == "scopes":
                    invalid = [s for s in value if s not in self.SCOPES]
                    if invalid:
                        raise ValueError(f"Invalid scopes: {invalid}")
                    sets.append("scopes = ?")
                    params.append(json.dumps(value))
                elif field == "ip_whitelist":
                    sets.append("ip_whitelist = ?")
                    params.append(json.dumps(value))
                else:
                    sets.append(f"{field} = ?")
                    params.append(value)

        if sets:
            params.extend([key_id, str(user_id)])
            await execute_query(f"UPDATE api_keys SET {', '.join(sets)} WHERE id = ? AND user_id = ?", params)

        updated = await self._get_key_by_id(key_id, user_id)
        return {
            "success": True,
            "key_data": {"id": updated["id"], "name": updated["name"],
                         "scopes": updated["scopes"], "ip_whitelist": updated["ip_whitelist"]}
        }

    async def get_key_usage(self, user_id: str, key_id: str) -> Dict[str, Any]:
        key_data = await self._get_key_by_id(key_id, user_id)
        if not key_data:
            raise ValueError("API key not found")

        usage = self._usage_cache.get(key_data["key_hash"], {})
        limits = self.TIER_LIMITS[key_data["tier"]]

        return {
            "key_id": key_id, "name": key_data["name"], "tier": key_data["tier"],
            "usage": {
                "total_requests": key_data["total_requests"],
                "requests_today": usage.get("requests_today", 0),
                "requests_this_minute": usage.get("requests_this_minute", 0),
                "last_used_at": key_data.get("last_used_at")
            },
            "limits": {
                "per_minute": limits["requests_per_minute"],
                "per_day": limits["requests_per_day"],
                "remaining_per_minute": limits["requests_per_minute"] - usage.get("requests_this_minute", 0),
                "remaining_per_day": limits["requests_per_day"] - usage.get("requests_today", 0)
            }
        }

    async def get_available_scopes(self) -> Dict[str, Any]:
        return {
            "scopes": self.SCOPES,
            "tiers": {
                tier: {"limits": limits,
                       "description": f"{limits['requests_per_minute']} req/min, {limits['requests_per_day']} req/day"}
                for tier, limits in self.TIER_LIMITS.items()
            }
        }


# Singleton instance
api_key_service = APIKeyService()
