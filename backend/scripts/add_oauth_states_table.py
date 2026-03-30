import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.turso_http import execute_query

def run_migration():
    print("Creating oauth_states table...")
    execute_query('''
    CREATE TABLE IF NOT EXISTS oauth_states (
        state TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        user_id TEXT,
        portal_area TEXT,
        intent TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    ''')
    print("Table created successfully.")

if __name__ == "__main__":
    run_migration()
