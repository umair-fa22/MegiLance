"""
@AI-HINT: Turso HTTP API client for synchronous database queries
This module provides a simple HTTP-based interface to Turso/libSQL database
without using async/await to avoid event loop issues in FastAPI sync contexts.
Turso remote database ONLY - no local fallback.
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Optional, List, Dict, Any
from collections import OrderedDict
import time
import threading
import logging
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Thread-safe LRU TTL cache for read queries
_QUERY_CACHE_TTL = 30  # 30 seconds
_QUERY_CACHE_MAX = 500
_cache_lock = threading.Lock()


class _LRUTTLCache:
    """Thread-safe LRU cache with TTL expiry for query results."""

    def __init__(self, max_size: int = _QUERY_CACHE_MAX, ttl: float = _QUERY_CACHE_TTL):
        self._max_size = max_size
        self._ttl = ttl
        self._data: OrderedDict[str, tuple] = OrderedDict()  # key -> (result, timestamp)
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            item = self._data.get(key)
            if item is None:
                return None
            result, ts = item
            if time.time() - ts > self._ttl:
                del self._data[key]
                return None
            # Move to end (most recently used)
            self._data.move_to_end(key)
            return result

    def put(self, key: str, value: Any) -> None:
        with self._lock:
            if key in self._data:
                self._data.move_to_end(key)
                self._data[key] = (value, time.time())
            else:
                if len(self._data) >= self._max_size:
                    self._data.popitem(last=False)  # Evict least recently used
                self._data[key] = (value, time.time())

    def invalidate_all(self) -> None:
        with self._lock:
            self._data.clear()

    def __len__(self) -> int:
        with self._lock:
            return len(self._data)


_query_cache = _LRUTTLCache()


class TursoHTTP:
    """Thread-safe synchronous HTTP client for Turso remote database.
    
    Uses a singleton pattern with thread-safe initialization via double-checked
    locking. The underlying requests.Session uses connection pooling with retries.
    """
    
    _instance: Optional['TursoHTTP'] = None
    _init_lock = threading.Lock()
    
    def __init__(self, url: str, token: str):
        self._url = url
        self._token = token
        # Thread-safe requests.Session with connection pool and retry
        self._session = requests.Session()
        from app.core.config import get_settings
        _settings = get_settings()
        adapter = HTTPAdapter(
            pool_connections=_settings.turso_pool_connections,
            pool_maxsize=_settings.turso_pool_maxsize,
            max_retries=Retry(
                total=2,
                backoff_factor=0.3,
                status_forcelist=[502, 503, 504],
                allowed_methods=["POST"],
            ),
        )
        self._session.mount("https://", adapter)
        self._session.mount("http://", adapter)
        self._session.headers.update({
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        })
    
    @classmethod
    def reset_instance(cls):
        """Reset singleton instance - used when settings change"""
        with cls._init_lock:
            if cls._instance is not None:
                try:
                    cls._instance._session.close()
                except Exception:
                    pass
                cls._instance = None
            _query_cache.invalidate_all()
    
    @classmethod
    def get_instance(cls) -> 'TursoHTTP':
        """Get singleton instance with thread-safe double-checked locking."""
        if cls._instance is not None:
            return cls._instance
        
        with cls._init_lock:
            # Double-check after acquiring lock
            if cls._instance is not None:
                return cls._instance
            
            settings = get_settings()
            
            if not settings.turso_database_url or not settings.turso_auth_token:
                raise RuntimeError(
                    "Turso database not configured. "
                    "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables."
                )
            
            if "CHANGE_ME" in (settings.turso_auth_token or "") or len(settings.turso_auth_token or "") < 50:
                raise RuntimeError(
                    "Invalid Turso auth token. "
                    "Please set a valid TURSO_AUTH_TOKEN in environment variables."
                )
            
            url = settings.turso_database_url.replace("libsql://", "https://")
            if not url.endswith("/"):
                url += "/"
            
            cls._instance = cls(url, settings.turso_auth_token)
            logger.info(f"Turso HTTP client initialized: {url[:50]}...")
            
        return cls._instance
    
    def execute(self, sql: str, params: Optional[List[Any]] = None) -> Dict[str, Any]:
        """Execute a SQL query. SELECT queries are cached with LRU+TTL."""
        if params is None:
            params = []
        
        sql_upper = sql.strip().upper()
        is_read = sql_upper.startswith("SELECT") or sql_upper.startswith("WITH")
        
        if is_read:
            cache_key = f"{sql}:{params}"
            cached = _query_cache.get(cache_key)
            if cached is not None:
                return cached
        
        result = self._execute_remote(sql, params)
        
        if is_read:
            _query_cache.put(cache_key, result)
        else:
            # Write query — invalidate read cache to avoid stale data
            _query_cache.invalidate_all()
        
        return result

    def _execute_remote(self, sql: str, params: List[Any]) -> Dict[str, Any]:
        """Execute query against Turso HTTP API with proper timeout."""
        response = self._session.post(
            self._url,
            json={
                "statements": [{
                    "q": sql,
                    "params": params
                }]
            },
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"Turso HTTP error: {response.status_code} - {response.text[:500]}")
        
        data = response.json()
        if not data or len(data) == 0:
            return {"columns": [], "rows": []}
        
        result = data[0].get("results", {})
        return {
            "columns": result.get("columns", []),
            "rows": result.get("rows", [])
        }
    
    def execute_many(self, statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Execute multiple statements in a batch against Turso."""
        response = self._session.post(
            self._url,
            json={"statements": statements},
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"Turso HTTP error: {response.status_code} - {response.text[:500]}")
        
        data = response.json()
        results = []
        for item in data:
            result = item.get("results", {})
            results.append({
                "columns": result.get("columns", []),
                "rows": result.get("rows", [])
            })
        _query_cache.invalidate_all()
        return results
    
    def fetch_one(self, sql: str, params: Optional[List[Any]] = None) -> Optional[List[Any]]:
        """Execute query and return first row or None"""
        result = self.execute(sql, params)
        rows = result.get("rows", [])
        return rows[0] if rows else None
    
    def fetch_all(self, sql: str, params: Optional[List[Any]] = None) -> List[List[Any]]:
        """Execute query and return all rows"""
        result = self.execute(sql, params)
        return result.get("rows", [])
    
    def fetch_scalar(self, sql: str, params: Optional[List[Any]] = None) -> Any:
        """Execute query and return single value"""
        row = self.fetch_one(sql, params)
        return row[0] if row else None


def get_turso_http() -> TursoHTTP:
    """Get Turso HTTP client instance"""
    client = TursoHTTP.get_instance()
    return client


# ============ Simple helper functions for direct use ============

def execute_query(sql: str, params: List[Any] = None) -> Optional[Dict[str, Any]]:
    """
    Execute a SQL query and return the result.
    """
    try:
        client = TursoHTTP.get_instance()
        result = client.execute(sql, params)
        
        # Convert to the format expected by the frontend/helper (cols, rows with types)
        # This is a bit messy because the original execute_query returned a specific format
        # mimicking Turso's raw response structure for the frontend.
        
        columns = result.get("columns", [])
        rows_raw = result.get("rows", [])
        
        cols = [{"name": col} for col in columns]
        
        rows = []
        for row in rows_raw:
            row_data = []
            for val in row:
                if val is None:
                    row_data.append({"type": "null", "value": None})
                else:
                    row_data.append({"type": "text", "value": val})
            rows.append(row_data)
            
        return {
            "cols": cols,
            "rows": rows
        }

    except Exception as e:
        logger.info(f"[DB] execute_query error: {e}")
        return None


def parse_rows(result: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Parse Turso result rows into list of dicts"""
    if not result:
        return []
    
    cols = result.get("cols", [])
    rows = result.get("rows", [])
    
    parsed = []
    for row in rows:
        item = {}
        for i, col in enumerate(cols):
            col_name = col.get("name", f"col_{i}")
            if i < len(row):
                cell = row[i]
                if cell.get("type") == "null":
                    item[col_name] = None
                else:
                    item[col_name] = cell.get("value")
            else:
                item[col_name] = None
        parsed.append(item)
    return parsed


def to_str(value: Any) -> Optional[str]:
    """Convert value to string, handling bytes and Turso dict format"""
    if value is None:
        return None
    # Handle Turso format: {"type": "text", "value": "..."}
    if isinstance(value, dict):
        if value.get("type") == "null":
            return None
        value = value.get("value")
        if value is None:
            return None
    if isinstance(value, bytes):
        return value.decode('utf-8')
    return str(value)


def to_int(value: Any) -> Optional[int]:
    """Convert value to integer, handling Turso dict format"""
    if value is None:
        return None
    # Handle Turso format: {"type": "integer", "value": 123}
    if isinstance(value, dict):
        if value.get("type") == "null":
            return None
        value = value.get("value")
        if value is None:
            return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def to_float(value: Any) -> Optional[float]:
    """Convert value to float, handling Turso dict format"""
    if value is None:
        return None
    # Handle Turso format: {"type": "float"|"real", "value": 123.45}
    if isinstance(value, dict):
        if value.get("type") == "null":
            return None
        value = value.get("value")
        if value is None:
            return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def parse_date(value: Any) -> Optional[Any]:
    """Parse date value safely"""
    if value is None:
        return None
    # Handle Turso format: {"type": "text", "value": "..."}
    if isinstance(value, dict):
        if value.get("type") == "null":
            return None
        value = value.get("value")
        if value is None:
            return None
    if isinstance(value, bytes):
        value = value.decode('utf-8')
    # Try to parse as datetime if it's a string
    if isinstance(value, str):
        from datetime import datetime
        try:
            # Handle ISO format
            if 'T' in value:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            # Handle date-only format
            return datetime.strptime(value[:19], '%Y-%m-%d %H:%M:%S')
        except (ValueError, TypeError):
            try:
                return datetime.strptime(value[:10], '%Y-%m-%d')
            except (ValueError, TypeError):
                return value
    return value
