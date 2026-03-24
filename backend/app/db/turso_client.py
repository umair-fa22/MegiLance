"""
@AI-HINT: Direct HTTP client for Turso database
Bypasses libsql_client due to bugs in 0.3.1 response parsing
"""
import logging
import aiohttp
import json
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
logger = logging.getLogger(__name__)


@dataclass
class TursoResult:
    """Result from a Turso query"""
    columns: List[str]
    rows: List[List[Any]]
    rows_read: int
    rows_written: int
    query_duration_ms: float


class TursoHttpClient:
    """Direct HTTP client for Turso database"""
    
    def __init__(self, url: str, auth_token: str):
        """
        Initialize Turso HTTP client
        
        Args:
            url: Database URL (libsql:// or https://)
            auth_token: Authentication token
        """
        # Convert libsql:// to https://
        self.url = url.replace('libsql://', 'https://')
        self.auth_token = auth_token
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def execute(self, sql: str, params: Optional[List[Any]] = None) -> TursoResult:
        """
        Execute a SQL query
        
        Args:
            sql: SQL query string
            params: Query parameters (optional)
            
        Returns:
            TursoResult with query results
            
        Raises:
            Exception: If query fails
        """
        session = await self._get_session()
        
        payload = {
            "statements": [{
                "q": sql,
                "params": params or []
            }]
        }
        
        async with session.post(
            self.url,
            headers={
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            },
            json=payload
        ) as response:
            if response.status != 200:
                text = await response.text()
                raise Exception(f"Turso HTTP error {response.status}: {text}")
            
            data = await response.json()
            
            # Check for errors
            if isinstance(data, list) and len(data) > 0:
                result = data[0]
                if "error" in result:
                    raise Exception(f"Turso SQL error: {result['error']}")
                
                if "results" in result:
                    results = result["results"]
                    return TursoResult(
                        columns=results.get("columns", []),
                        rows=results.get("rows", []),
                        rows_read=results.get("rows_read", 0),
                        rows_written=results.get("rows_written", 0),
                        query_duration_ms=results.get("query_duration_ms", 0.0)
                    )
            
            raise Exception(f"Unexpected Turso response format: {data}")
    
    async def close(self):
        """Close the HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
