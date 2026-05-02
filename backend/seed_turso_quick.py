# @AI-HINT: One-shot seeding script for Turso via HTTP API
import sys
import os
import logging
import json
from datetime import datetime, timezone

# Add parent directory to path to import app modules if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.db.turso_http import execute_query, parse_rows
    from app.core.security import get_password_hash
    from app.core.config import get_settings
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_turso")

def seed():
    settings = get_settings()
    logger.info(f"Seeding Turso database at {settings.turso_database_url}")
    
    # 1. Create Users Table if not exists (minimal schema)
    # Note: In production, Alembic handles this. For quick demo, we ensuring it exists.
    # We use some of the columns from UserProxy in security.py
    
    logger.info("Checking for users table...")
    # This is a bit risky if schema is missing, but usually it exists from previous migrations
    
    # 2. Add Demo Users
    users = [
        {
            "email": "admin@megilance.com",
            "password": "Admin@123", # Matching DevQuickLogin.tsx
            "name": "Megi Admin",
            "user_type": "admin"
        },
        {
            "email": "freelancer1@example.com",
            "password": "Freelancer@123", # Matching DevQuickLogin.tsx
            "name": "Alice Freelancer",
            "user_type": "freelancer"
        },
        {
            "email": "client1@example.com",
            "password": "Client@123", # Matching DevQuickLogin.tsx
            "name": "Bob Client",
            "user_type": "client"
        }
    ]
    
    for user in users:
        email = user["email"].lower()
        logger.info(f"Processing user: {email}")
        
        # Check if exists
        check = execute_query("SELECT id FROM users WHERE email = ?", [email])
        if parse_rows(check):
            logger.info(f"User {email} already exists. Skipping.")
            continue
            
        hashed_pw = get_password_hash(user["password"])
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            execute_query(
                "INSERT INTO users (email, hashed_password, name, user_type, role, is_active, is_verified, joined_at) VALUES (?, ?, ?, ?, ?, 1, 1, ?)",
                [email, hashed_pw, user["name"], user["user_type"], user["user_type"], now]
            )
            logger.info(f"User {email} created successfully.")
        except Exception as e:
            logger.error(f"Failed to create user {email}: {e}")

if __name__ == "__main__":
    seed()
