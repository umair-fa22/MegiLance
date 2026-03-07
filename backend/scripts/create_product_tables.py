"""
Create all missing tables for full product implementation.
Migrates in-memory stores to persistent Turso DB tables.
"""
from app.db.turso_http import execute_query

TABLES = [
    # ============================================================
    # API Keys Service
    # ============================================================
    """CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        scopes TEXT NOT NULL DEFAULT '[]',
        tier TEXT NOT NULL DEFAULT 'free',
        rate_limits TEXT NOT NULL DEFAULT '{}',
        ip_whitelist TEXT NOT NULL DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        last_used_at TEXT,
        total_requests INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT,
        revoked_at TEXT,
        rotated_from TEXT,
        pending_revocation INTEGER NOT NULL DEFAULT 0,
        revocation_time TEXT
    )""",
    "CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)",
    "CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active)",

    """CREATE TABLE IF NOT EXISTS api_key_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_hash TEXT NOT NULL REFERENCES api_keys(key_hash),
        requests_today INTEGER NOT NULL DEFAULT 0,
        requests_this_minute INTEGER NOT NULL DEFAULT 0,
        minute_window_start TEXT,
        day_window_start TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_api_key_usage_hash ON api_key_usage(key_hash)",

    # ============================================================
    # Reports Service
    # ============================================================
    """CREATE TABLE IF NOT EXISTS generated_reports (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'pdf',
        user_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        date_from TEXT,
        date_to TEXT,
        filters TEXT NOT NULL DEFAULT '{}',
        data TEXT,
        file_url TEXT,
        file_size INTEGER,
        error TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT
    )""",
    "CREATE INDEX IF NOT EXISTS idx_reports_user ON generated_reports(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_reports_status ON generated_reports(status)",

    """CREATE TABLE IF NOT EXISTS scheduled_reports (
        id TEXT PRIMARY KEY,
        report_type TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'pdf',
        user_id INTEGER NOT NULL REFERENCES users(id),
        schedule TEXT NOT NULL,
        email_to TEXT,
        filters TEXT NOT NULL DEFAULT '{}',
        enabled INTEGER NOT NULL DEFAULT 1,
        last_run TEXT,
        next_run TEXT,
        run_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_sched_reports_user ON scheduled_reports(user_id)",

    # ============================================================
    # AI Chatbot Service
    # ============================================================
    """CREATE TABLE IF NOT EXISTS chatbot_conversations (
        id TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        state TEXT NOT NULL DEFAULT 'active',
        context TEXT NOT NULL DEFAULT '{}',
        intents_detected TEXT NOT NULL DEFAULT '[]',
        sentiment_history TEXT NOT NULL DEFAULT '[]',
        ticket_id TEXT,
        escalated INTEGER NOT NULL DEFAULT 0,
        resolution TEXT,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_activity TEXT NOT NULL DEFAULT (datetime('now')),
        closed_at TEXT
    )""",
    "CREATE INDEX IF NOT EXISTS idx_chatbot_conv_user ON chatbot_conversations(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_chatbot_conv_state ON chatbot_conversations(state)",

    """CREATE TABLE IF NOT EXISTS chatbot_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL REFERENCES chatbot_conversations(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        intent TEXT,
        sentiment TEXT,
        intent_matched TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_chatbot_msg_conv ON chatbot_messages(conversation_id)",

    """CREATE TABLE IF NOT EXISTS chatbot_tickets (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        conversation_id TEXT REFERENCES chatbot_conversations(id),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        category TEXT NOT NULL DEFAULT 'general',
        status TEXT NOT NULL DEFAULT 'open',
        intents_detected TEXT NOT NULL DEFAULT '[]',
        sentiment_summary TEXT,
        conversation_summary TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_chatbot_tickets_user ON chatbot_tickets(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_chatbot_tickets_status ON chatbot_tickets(status)",

    # ============================================================
    # Integrations Service
    # ============================================================
    """CREATE TABLE IF NOT EXISTS user_integrations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        integration_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'connected',
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TEXT,
        workspace_name TEXT,
        connected_at TEXT NOT NULL DEFAULT (datetime('now')),
        settings TEXT NOT NULL DEFAULT '{}',
        last_synced_at TEXT
    )""",
    "CREATE INDEX IF NOT EXISTS idx_user_integrations_user ON user_integrations(user_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_integrations_unique ON user_integrations(user_id, integration_type)",

    # ============================================================
    # Pakistan Payments Service
    # ============================================================
    """CREATE TABLE IF NOT EXISTS pk_wallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        wallet_address TEXT NOT NULL,
        network TEXT NOT NULL DEFAULT 'polygon',
        is_verified INTEGER NOT NULL DEFAULT 0,
        connected_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_pk_wallets_user ON pk_wallets(user_id)",

    """CREATE TABLE IF NOT EXISTS pk_transactions (
        id TEXT PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        provider TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        amount TEXT NOT NULL,
        amount_pkr TEXT,
        fee TEXT,
        net_amount TEXT,
        receiving_address TEXT,
        merchant_code TEXT,
        network TEXT,
        is_testnet INTEGER NOT NULL DEFAULT 0,
        chain_id INTEGER,
        tx_hash TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        confirmed_at TEXT
    )""",
    "CREATE INDEX IF NOT EXISTS idx_pk_tx_user ON pk_transactions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_pk_tx_status ON pk_transactions(status)",

    # ============================================================
    # Video Interview Service
    # ============================================================
    """CREATE TABLE IF NOT EXISTS interviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL UNIQUE,
        client_id INTEGER NOT NULL REFERENCES users(id),
        freelancer_id INTEGER NOT NULL REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        title TEXT,
        description TEXT,
        scheduled_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        end_time TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        timezone TEXT NOT NULL DEFAULT 'UTC',
        client_token TEXT,
        freelancer_token TEXT,
        recording_url TEXT,
        notes TEXT,
        started_at TEXT,
        completed_at TEXT,
        cancelled_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_interviews_client ON interviews(client_id)",
    "CREATE INDEX IF NOT EXISTS idx_interviews_freelancer ON interviews(freelancer_id)",
    "CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status)",
    "CREATE INDEX IF NOT EXISTS idx_interviews_room ON interviews(room_id)",

    # ============================================================
    # User Feedback Service
    # ============================================================
    """CREATE TABLE IF NOT EXISTS user_feedback (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL DEFAULT 'general',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        priority TEXT NOT NULL DEFAULT 'medium',
        metadata TEXT NOT NULL DEFAULT '{}',
        votes INTEGER NOT NULL DEFAULT 0,
        admin_response TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status)",
    "CREATE INDEX IF NOT EXISTS idx_feedback_type ON user_feedback(type)",

    """CREATE TABLE IF NOT EXISTS feedback_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id TEXT NOT NULL REFERENCES user_feedback(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        vote INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_votes_unique ON feedback_votes(feedback_id, user_id)",

    """CREATE TABLE IF NOT EXISTS surveys (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        questions TEXT NOT NULL DEFAULT '[]',
        target_audience TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id),
        is_active INTEGER NOT NULL DEFAULT 1,
        response_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT
    )""",
    "CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active)",

    """CREATE TABLE IF NOT EXISTS survey_responses (
        id TEXT PRIMARY KEY,
        survey_id TEXT NOT NULL REFERENCES surveys(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        responses TEXT NOT NULL DEFAULT '{}',
        submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_survey_resp_survey ON survey_responses(survey_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_resp_unique ON survey_responses(survey_id, user_id)",

    # ============================================================
    # Subscription Billing Service 
    # ============================================================
    """CREATE TABLE IF NOT EXISTS billing_invoices (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        tier TEXT NOT NULL,
        billing_cycle TEXT NOT NULL DEFAULT 'monthly',
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'paid',
        description TEXT,
        period_start TEXT,
        period_end TEXT,
        paid_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_billing_inv_user ON billing_invoices(user_id)",

    """CREATE TABLE IF NOT EXISTS feature_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        usage_type TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_usage_unique ON feature_usage(user_id, usage_type, period_start)",

    # ============================================================
    # Push Notifications Service
    # ============================================================
    """CREATE TABLE IF NOT EXISTS push_devices (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        token_hash TEXT NOT NULL,
        platform TEXT NOT NULL,
        device_info TEXT NOT NULL DEFAULT '{}',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_used_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_push_devices_user ON push_devices(user_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_push_devices_token ON push_devices(token_hash)",

    # ============================================================
    # Legal Document Audit Trail
    # ============================================================
    """CREATE TABLE IF NOT EXISTS document_audit_trail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '{}',
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )""",
    "CREATE INDEX IF NOT EXISTS idx_doc_audit_doc ON document_audit_trail(document_id)",
    "CREATE INDEX IF NOT EXISTS idx_doc_audit_user ON document_audit_trail(user_id)",
]


def main():
    success = 0
    failed = 0
    for sql in TABLES:
        try:
            execute_query(sql)
            # Extract table name for display
            if "CREATE TABLE" in sql:
                name = sql.split("CREATE TABLE IF NOT EXISTS ")[1].split(" (")[0].strip()
                print(f"  [OK] Table: {name}")
            elif "CREATE" in sql and "INDEX" in sql:
                name = sql.split("IF NOT EXISTS ")[1].split(" ON")[0].strip()
                print(f"  [OK] Index: {name}")
            success += 1
        except Exception as e:
            print(f"  [FAIL] {sql[:60]}... -> {e}")
            failed += 1

    print(f"\nDone: {success} successful, {failed} failed")


if __name__ == "__main__":
    main()
