"""
@AI-HINT: Database session management - Turso HTTP API primary, SQLAlchemy fallback (DEAD CODE)
ARCHITECTURE NOTE: sqlalchemy-libsql is never installed in production — get_engine() always
returns None. All runtime DB operations use Turso HTTP API (turso_http.py).
The SQLAlchemy code paths below are kept as reference / Alembic compatibility only.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.core.config import get_settings
import logging
from typing import Generator

logger = logging.getLogger(__name__)
settings = get_settings()

# Lazy engine creation to avoid blocking on startup
_engine = None
_SessionLocal = None
_engine_available = None  # None = not checked, True/False = result


def get_engine():
    """
    Create and return database engine.
    
    Uses SQLAlchemy with sqlalchemy-libsql driver if available.
    Falls back to Turso HTTP API if driver is not installed.
    """
    global _engine, _engine_available
    
    if _engine_available is False:
        return None
    
    if _engine is not None:
        return _engine
    
    # Validate Turso configuration
    if not settings.turso_database_url or not settings.turso_auth_token:
        error_msg = (
            "CRITICAL ERROR: Turso database not configured.\n"
            "Required environment variables:\n"
            "  - TURSO_DATABASE_URL\n"
            "  - TURSO_AUTH_TOKEN\n"
            "Please set these in your .env file or environment."
        )
        logger.error(error_msg)
        logger.info(f"\n{'='*70}\n{error_msg}\n{'='*70}\n")
        _engine_available = False
        return None
    
    try:
        # Check if sqlalchemy-libsql is installed
        try:
            import sqlalchemy_libsql
        except ImportError:
            logger.warning("sqlalchemy-libsql not installed - using Turso HTTP API only")
            logger.info("[INFO] sqlalchemy-libsql not installed - using Turso HTTP API for all database operations")
            _engine_available = False
            return None
        
        # Construct Turso URL with auth token
        base_url = settings.turso_database_url
        auth_token = settings.turso_auth_token
        
        # Add auth token as query parameter if not already present
        if "authToken" not in base_url and "?" not in base_url:
            db_url = f"{base_url}?authToken={auth_token}"
        elif "authToken" not in base_url:
            db_url = f"{base_url}&authToken={auth_token}"
        else:
            db_url = base_url
        
        logger.info(f"[TURSO] Connecting to: {base_url.split('?')[0]}")
        logger.info(f"[TURSO] Connecting to: {base_url.split('?')[0]}")
        
        _engine = create_engine(
            db_url,
            connect_args={},
            poolclass=QueuePool,
            echo=settings.debug,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        
        _engine_available = True
        logger.info("[TURSO] Database engine created successfully")
        logger.info("[TURSO] Database engine created successfully")
        
    except Exception as e:
        logger.warning(f"Failed to create Turso database engine: {e} - using HTTP API")
        logger.info(f"[INFO] Using Turso HTTP API (SQLAlchemy engine not available: {e})")
        _engine_available = False
        return None

    return _engine


def get_session_local():
    """Get or create session factory"""
    global _SessionLocal
    
    engine = get_engine()
    if engine is None:
        return None
    
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine,
            expire_on_commit=False,
        )
    return _SessionLocal


def get_db() -> Generator:
    """Dependency for getting database sessions.
    
    Returns a SQLAlchemy session if available, otherwise yields None.
    Endpoints should handle None db and use Turso HTTP API directly.
    """
    session_factory = get_session_local()
    
    if session_factory is None:
        # SQLAlchemy not available - yield None, endpoints should use Turso HTTP API
        yield None
        return
    
    db = None
    try:
        db = session_factory()
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        if db:
            db.rollback()
        raise
    finally:
        if db:
            db.close()


# Legacy compatibility
engine = None
SessionLocal = None


def get_turso_client():
    """Get Turso HTTP client"""
    if not settings.turso_database_url or not settings.turso_auth_token:
        logger.warning("Turso client not available - missing credentials")
        return None
    try:
        from app.db.turso_http import get_turso_http
        return get_turso_http()
    except Exception as e:
        logger.warning(f"Failed to get Turso client: {e}")
        return None


def execute_query(query: str, params: list = None):
    """Execute a raw SQL query using Turso.
    
    Returns turso_http format: {"columns": [...], "rows": [...]} where rows are
    positional lists. The SQLAlchemy fallback (unreachable) returns list of dicts.
    """
    try:
        # Try Turso HTTP client first
        turso_client = get_turso_client()
        if turso_client:
            result = turso_client.execute(query, params or [])
            return result
    except Exception as e:
        logger.warning(f"Turso HTTP query failed: {e}, falling back to engine")
    
    # Fallback to SQLAlchemy engine
    engine = get_engine()
    with engine.connect() as conn:
        if params:
            result = conn.execute(text(query), params)
        else:
            result = conn.execute(text(query))
        conn.commit()
        
        # Return results if it's a SELECT query
        if query.strip().upper().startswith('SELECT'):
            return [dict(row) for row in result.mappings()]
        return result
