# @AI-HINT: Database initialization - LEGACY/DEAD CODE with Turso HTTP
# Since MegiLance uses Turso HTTP API exclusively, engine is always None
# and this function returns immediately. Tables are managed via turso_schema.sql.
# Kept for SQLAlchemy model registration side-effects (imports).
import logging
from sqlalchemy import Engine, inspect
from app.db.base import Base
from app.models import user, project, proposal, contract, portfolio, payment  # noqa: F401  ensure models are imported
# Import all other models to ensure they're registered with Base
logger = logging.getLogger(__name__)


def init_db(engine: Engine) -> None:
    """Initialize database: create tables if they don't exist.
    
    If engine is None, skip SQLAlchemy table creation (using Turso HTTP API).
    """
    
    if engine is None:
        logger.info("[INFO] SQLAlchemy engine not available - using Turso HTTP API (tables managed externally)")
        return
    
    try:
        # Check if critical tables exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        # List of critical tables that MUST exist
        critical_tables = ['users', 'projects', 'proposals', 'contracts', 'payments', 'skills', 'categories']
        missing_critical = [t for t in critical_tables if t not in existing_tables]
        
        if missing_critical:
            logger.info(f"[INFO] Missing critical tables: {missing_critical}")
            logger.info("[INFO] Creating database tables...")
            Base.metadata.create_all(bind=engine)
            logger.info("[OK] Database tables created successfully")
        else:
            logger.info(f"[OK] Database already initialized ({len(existing_tables)} tables found)")
            
    except Exception as e:
        logger.info(f"[WARNING] Database initialization error: {e}")
        logger.info("[WARNING] Attempting to create tables anyway...")
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("[OK] Database tables created")
        except Exception as create_error:
            logger.info(f"[ERROR] Failed to create tables: {create_error}")