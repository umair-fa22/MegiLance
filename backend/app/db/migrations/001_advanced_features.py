"""
@AI-HINT: Database migration script to apply advanced features schema
Creates 25+ new tables for MFA, multi-currency, AI, security, and video features
"""

import logging
import asyncio
from pathlib import Path
from app.db.database import get_db
logger = logging.getLogger(__name__)


async def apply_migration():
    """Apply advanced_schema.sql migration"""
    logger.info("🔄 Starting database migration for advanced features...")
    
    # Read schema file
    schema_path = Path(__file__).parent.parent / "db" / "advanced_schema.sql"
    
    if not schema_path.exists():
        logger.info(f"❌ Schema file not found: {schema_path}")
        return False
    
    logger.info(f"📄 Reading schema from: {schema_path}")
    schema_sql = schema_path.read_text(encoding="utf-8")
    
    # Get database connection
    async for db in get_db():
        try:
            logger.info("🔗 Connected to database")
            
            # Split SQL statements (Turso/SQLite executes one at a time)
            statements = []
            current_statement = []
            
            for line in schema_sql.split('\n'):
                # Skip comments
                if line.strip().startswith('--') or not line.strip():
                    continue
                
                current_statement.append(line)
                
                # Check if statement is complete
                if line.strip().endswith(';'):
                    stmt = '\n'.join(current_statement)
                    statements.append(stmt)
                    current_statement = []
            
            logger.info(f"📊 Found {len(statements)} SQL statements to execute")
            
            # Execute each statement
            success_count = 0
            for i, stmt in enumerate(statements, 1):
                try:
                    await db.execute(stmt)
                    success_count += 1
                    
                    # Extract table name for logging
                    if 'CREATE TABLE' in stmt:
                        table_name = stmt.split('CREATE TABLE IF NOT EXISTS')[1].split('(')[0].strip()
                        logger.info(f"  ✅ [{i}/{len(statements)}] Created table: {table_name}")
                    elif 'CREATE INDEX' in stmt:
                        index_name = stmt.split('CREATE INDEX IF NOT EXISTS')[1].split('ON')[0].strip()
                        logger.info(f"  ✅ [{i}/{len(statements)}] Created index: {index_name}")
                    else:
                        logger.info(f"  ✅ [{i}/{len(statements)}] Executed statement")
                        
                except Exception as e:
                    logger.info(f"  ⚠️ [{i}/{len(statements)}] Warning: {str(e)}")
                    # Continue on error (table might already exist)
                    continue
            
            await db.commit()
            
            logger.info(f"\n✅ Migration complete: {success_count}/{len(statements)} statements executed successfully")
            
            # Verify tables
            logger.info("\n🔍 Verifying created tables...")
            tables_to_verify = [
                'mfa_methods', 'mfa_backup_codes', 'security_events', 'ip_whitelist',
                'exchange_rates', 'transactions', 'crypto_wallets', 'crypto_transactions',
                'video_calls', 'video_participants', 'video_recordings', 'screen_share_sessions',
                'whiteboard_sessions', 'fraud_alerts', 'quality_assessments', 'skill_matches',
                'price_suggestions', 'user_sessions'
            ]
            
            verified_count = 0
            for table in tables_to_verify:
                try:
                    result = await db.execute(
                        f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'"
                    )
                    row = await result.fetchone()
                    if row:
                        logger.info(f"  ✅ Table verified: {table}")
                        verified_count += 1
                    else:
                        logger.info(f"  ❌ Table missing: {table}")
                except Exception as e:
                    logger.info(f"  ⚠️ Could not verify {table}: {e}")
            
            logger.info(f"\n📊 Verification: {verified_count}/{len(tables_to_verify)} tables confirmed")
            
            if verified_count == len(tables_to_verify):
                logger.info("\n🎉 All tables created successfully!")
                return True
            else:
                logger.info(f"\n⚠️ {len(tables_to_verify) - verified_count} tables missing")
                return False
                
        except Exception as e:
            logger.info(f"\n❌ Migration failed: {str(e)}")
            await db.rollback()
            return False


async def rollback_migration():
    """Rollback migration by dropping all advanced feature tables"""
    logger.info("🔄 Rolling back database migration...")
    
    tables_to_drop = [
        'user_sessions', 'price_suggestions', 'skill_matches', 'quality_assessments',
        'fraud_alerts', 'whiteboard_sessions', 'screen_share_sessions', 'video_recordings',
        'video_participants', 'video_calls', 'crypto_transactions', 'crypto_wallets',
        'transactions', 'exchange_rates', 'ip_whitelist', 'security_events',
        'mfa_backup_codes', 'mfa_methods'
    ]
    
    async for db in get_db():
        try:
            for table in tables_to_drop:
                try:
                    await db.execute(f"DROP TABLE IF EXISTS {table}")
                    logger.info(f"  ✅ Dropped table: {table}")
                except Exception as e:
                    logger.info(f"  ⚠️ Could not drop {table}: {e}")
            
            await db.commit()
            logger.info("\n✅ Rollback complete")
            return True
            
        except Exception as e:
            logger.info(f"\n❌ Rollback failed: {str(e)}")
            await db.rollback()
            return False


async def seed_development_data():
    """Seed development data for testing"""
    logger.info("\n🌱 Seeding development data...")
    
    async for db in get_db():
        try:
            # Seed exchange rates
            exchange_rates_data = [
                ('USD', 'EUR', 0.92),
                ('USD', 'GBP', 0.79),
                ('USD', 'JPY', 149.50),
                ('BTC', 'USD', 43500.00),
                ('ETH', 'USD', 2300.00),
                ('USDC', 'USD', 1.00),
                ('USDT', 'USD', 1.00)
            ]
            
            for from_curr, to_curr, rate in exchange_rates_data:
                await db.execute(
                    """INSERT OR IGNORE INTO exchange_rates 
                       (from_currency, to_currency, rate, provider, updated_at)
                       VALUES (?, ?, ?, 'seed', CURRENT_TIMESTAMP)""",
                    (from_curr, to_curr, rate)
                )
            
            await db.commit()
            logger.info("  ✅ Seeded exchange rates")
            
            logger.info("\n✅ Development data seeded successfully")
            return True
            
        except Exception as e:
            logger.info(f"\n❌ Seeding failed: {str(e)}")
            await db.rollback()
            return False


async def main():
    """Main migration runner"""
    import sys
    
    command = sys.argv[1] if len(sys.argv) > 1 else 'apply'
    
    if command == 'apply':
        success = await apply_migration()
        if success:
            # Ask if user wants to seed data
            logger.info("\n📦 Would you like to seed development data? (y/n): ", end='')
            choice = input().lower()
            if choice == 'y':
                await seed_development_data()
    
    elif command == 'rollback':
        success = await rollback_migration()
    
    elif command == 'seed':
        success = await seed_development_data()
    
    else:
        logger.info("❌ Unknown command. Use: apply, rollback, or seed")
        success = False
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
