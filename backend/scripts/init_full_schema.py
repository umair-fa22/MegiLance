"""Initialize Turso database with full schema including all enhanced columns"""
import sys
sys.path.insert(0, ".")
from app.db.turso_http import get_turso_http
from pathlib import Path

turso = get_turso_http()

schema_path = Path("scripts/sql/turso_schema.sql")
if not schema_path.exists():
    print(f"Schema file not found: {schema_path}")
    sys.exit(1)

sql_content = schema_path.read_text()
statements = [s.strip() for s in sql_content.split(";") if s.strip()]

print(f"Applying {len(statements)} statements from turso_schema.sql...")
success = 0
skipped = 0
errors = 0

for stmt in statements:
    if not stmt or stmt.startswith("--"):
        continue
    try:
        turso.execute(stmt)
        success += 1
    except Exception as e:
        if "already exists" in str(e).lower():
            skipped += 1
        else:
            print(f"  ERROR: {str(e)[:100]}")
            print(f"  STMT: {stmt[:80]}...")
            errors += 1

print(f"\nBase schema: {success} OK, {skipped} skipped, {errors} errors")

# Now add enhanced columns that exist in SQLAlchemy models but not in base schema
# These are safe to run even if columns already exist (we catch the error)
alter_statements = [
    # User enhanced fields
    "ALTER TABLE users ADD COLUMN seller_level VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN tagline VARCHAR(200)",
    "ALTER TABLE users ADD COLUMN languages TEXT",
    "ALTER TABLE users ADD COLUMN timezone VARCHAR(50)",
    "ALTER TABLE users ADD COLUMN availability_status VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN last_active_at DATETIME",
    "ALTER TABLE users ADD COLUMN profile_slug VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN headline VARCHAR(300)",
    "ALTER TABLE users ADD COLUMN experience_level VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN years_of_experience INTEGER",
    "ALTER TABLE users ADD COLUMN education TEXT",
    "ALTER TABLE users ADD COLUMN certifications TEXT",
    "ALTER TABLE users ADD COLUMN work_history TEXT",
    "ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN github_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN website_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN twitter_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN dribbble_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN behance_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN stackoverflow_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN phone_number VARCHAR(30)",
    "ALTER TABLE users ADD COLUMN video_intro_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN resume_url VARCHAR(500)",
    "ALTER TABLE users ADD COLUMN availability_hours VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN preferred_project_size VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN industry_focus TEXT",
    "ALTER TABLE users ADD COLUMN tools_and_technologies TEXT",
    "ALTER TABLE users ADD COLUMN achievements TEXT",
    "ALTER TABLE users ADD COLUMN testimonials_enabled BOOLEAN DEFAULT 1",
    "ALTER TABLE users ADD COLUMN contact_preferences TEXT",
    "ALTER TABLE users ADD COLUMN profile_views INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'public'",
    # Project enhanced fields
    "ALTER TABLE projects ADD COLUMN visibility VARCHAR(20) DEFAULT 'public'",
    "ALTER TABLE projects ADD COLUMN is_featured BOOLEAN DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN is_urgent BOOLEAN DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN attachments TEXT",
    "ALTER TABLE projects ADD COLUMN screening_questions TEXT",
    "ALTER TABLE projects ADD COLUMN preferred_qualifications TEXT",
    "ALTER TABLE projects ADD COLUMN max_proposals INTEGER",
    "ALTER TABLE projects ADD COLUMN proposals_count INTEGER DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN views_count INTEGER DEFAULT 0",
    "ALTER TABLE projects ADD COLUMN deadline DATETIME",
    # Contract enhanced fields
    "ALTER TABLE contracts ADD COLUMN contract_type VARCHAR(20) DEFAULT 'fixed'",
    "ALTER TABLE contracts ADD COLUMN currency VARCHAR(10) DEFAULT 'USD'",
    "ALTER TABLE contracts ADD COLUMN hourly_rate FLOAT",
    "ALTER TABLE contracts ADD COLUMN retainer_amount FLOAT",
    "ALTER TABLE contracts ADD COLUMN retainer_frequency VARCHAR(20)",
]

added = 0
existed = 0
for stmt in alter_statements:
    try:
        turso.execute(stmt)
        added += 1
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            existed += 1
        else:
            print(f"  ALTER warning: {str(e)[:100]} - {stmt}")

print(f"Enhanced columns: {added} added, {existed} already existed")

# Create indexes
indexes = [
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)",
    "CREATE INDEX IF NOT EXISTS ix_users_is_active ON users (is_active)",
    "CREATE INDEX IF NOT EXISTS ix_users_user_type ON users (user_type)",
    "CREATE INDEX IF NOT EXISTS ix_users_profile_slug ON users (profile_slug)",
    "CREATE INDEX IF NOT EXISTS ix_projects_status ON projects (status)",
    "CREATE INDEX IF NOT EXISTS ix_projects_client_id ON projects (client_id)",
    "CREATE INDEX IF NOT EXISTS ix_proposals_project_id ON proposals (project_id)",
    "CREATE INDEX IF NOT EXISTS ix_proposals_freelancer_id ON proposals (freelancer_id)",
    "CREATE INDEX IF NOT EXISTS ix_contracts_project_id ON contracts (project_id)",
    "CREATE INDEX IF NOT EXISTS ix_contracts_client_id ON contracts (client_id)",
    "CREATE INDEX IF NOT EXISTS ix_contracts_freelancer_id ON contracts (freelancer_id)",
    "CREATE INDEX IF NOT EXISTS ix_contracts_status ON contracts (status)",
    "CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages (conversation_id)",
    "CREATE INDEX IF NOT EXISTS ix_messages_sender_id ON messages (sender_id)",
    "CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id)",
]

idx_ok = 0
for idx in indexes:
    try:
        turso.execute(idx)
        idx_ok += 1
    except Exception:
        pass

print(f"Indexes: {idx_ok} created/verified")

# Verify
r = turso.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
rows = r.get("results", [{}])[0].get("response", {}).get("result", {}).get("rows", [])
print(f"\nFinal table count: {len(rows)}")
for row in rows:
    val = row[0]
    name = val.get("value") if isinstance(val, dict) else val
    print(f"  {name}")
