#!/usr/bin/env python3
"""
Database reset script - WARNING: DELETES ALL DATA
This script clears all user-generated data (projects, proposals, messages, etc.)
but preserves system tables and indexes.

Use this before evaluation to start with a clean database.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def reset_database():
    """Reset the database by deleting all user data"""
    from app.db.session import get_session
    
    print("⚠️  DATABASE RESET - This will delete all user data!")
    print("Preserving: schemas, migrations, system tables")
    print("Deleting: users, projects, proposals, messages, contracts, reviews, payments")
    
    response = input("\n✋ Type 'RESET' to confirm: ").strip().upper()
    if response != "RESET":
        print("❌ Reset cancelled")
        return False
    
    try:
        db = get_session()
        
        # Delete tables in order (respecting foreign keys)
        tables_to_delete = [
            'chatbot_attachments',
            'chatbot_messages',
            'chatbot_conversations',
            'activity_feeds',
            'support_tickets',
            'reviews',
            'milestones',
            'payments',
            'contract_terms',
            'contracts',
            'proposals',
            'projects',
            'portfolio_items',
            'user_ratings',
            'user_skills',
            'user_certifications',
            'user_profiles',
            'user_preferences',
            'notifications',
            'contacts',
            'messages',
            'users',
        ]
        
        for table in tables_to_delete:
            try:
                db.execute(f"DELETE FROM {table}")
                print(f"✅ Cleared {table}")
            except Exception as e:
                # Table might not exist
                if "no such table" not in str(e).lower():
                    print(f"⚠️  {table}: {str(e)[:50]}")
        
        db.commit()
        print("\n✅ Database reset complete!")
        print("📝 All user data cleared - ready for fresh evaluation")
        return True
        
    except Exception as e:
        print(f"❌ Reset failed: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    reset_database()
