"""Create all missing tables needed for the mock-to-real migration."""
from app.db.turso_http import execute_query

TABLES = [
    # review_responses - for business owner replies to reviews
    """CREATE TABLE IF NOT EXISTS review_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_id INTEGER NOT NULL REFERENCES reviews(id),
        responder_id INTEGER NOT NULL REFERENCES users(id),
        response_text TEXT NOT NULL,
        is_public BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(review_id)
    )""",

    # response_templates - for reusable review response templates
    """CREATE TABLE IF NOT EXISTS response_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        use_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # proposal_templates - for reusable proposal templates
    """CREATE TABLE IF NOT EXISTS proposal_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        tags TEXT,
        is_public BOOLEAN DEFAULT 0,
        use_count INTEGER DEFAULT 0,
        success_rate FLOAT DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # custom_statuses - for project/contract custom statuses
    """CREATE TABLE IF NOT EXISTS custom_statuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        entity_type VARCHAR(50) NOT NULL DEFAULT 'project',
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#6B7280',
        icon VARCHAR(50),
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # fraud_alerts - for admin fraud detection alerts
    """CREATE TABLE IF NOT EXISTS fraud_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) DEFAULT 'medium',
        description TEXT,
        details TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        resolved_by INTEGER REFERENCES users(id),
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # security_events - for user security event tracking
    """CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        event_type VARCHAR(50) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        details TEXT,
        risk_level VARCHAR(20) DEFAULT 'low',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # data_exports - for data analytics exports
    """CREATE TABLE IF NOT EXISTS data_exports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        export_type VARCHAR(50) NOT NULL,
        format VARCHAR(20) NOT NULL DEFAULT 'csv',
        status VARCHAR(20) DEFAULT 'pending',
        filters TEXT,
        file_path TEXT,
        file_size INTEGER,
        row_count INTEGER,
        error_message TEXT,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # notes - for user notes on entities
    """CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_private BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # entity_tags - linking tags to entities
    """CREATE TABLE IF NOT EXISTS entity_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_id INTEGER NOT NULL REFERENCES tags(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tag_id, entity_type, entity_id)
    )""",

    # availability_slots - for freelancer availability calendar
    """CREATE TABLE IF NOT EXISTS availability_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        day_of_week INTEGER NOT NULL,
        start_time VARCHAR(5) NOT NULL,
        end_time VARCHAR(5) NOT NULL,
        is_available BOOLEAN DEFAULT 1,
        slot_type VARCHAR(20) DEFAULT 'available',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # availability_exceptions - for specific date overrides
    """CREATE TABLE IF NOT EXISTS availability_exceptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        exception_date DATE NOT NULL,
        is_available BOOLEAN DEFAULT 0,
        start_time VARCHAR(5),
        end_time VARCHAR(5),
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",

    # rate_cards - for freelancer rate cards
    """CREATE TABLE IF NOT EXISTS rate_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        base_rate FLOAT NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        rate_type VARCHAR(20) DEFAULT 'hourly',
        packages TEXT,
        extras TEXT,
        is_default BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""",
]

def main():
    for sql in TABLES:
        table_name = sql.split("IF NOT EXISTS ")[1].split(" (")[0].strip()
        try:
            execute_query(sql)
            print(f"OK: {table_name}")
        except Exception as e:
            print(f"ERR: {table_name} - {e}")

if __name__ == "__main__":
    main()
