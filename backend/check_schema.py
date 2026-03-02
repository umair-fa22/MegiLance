from app.db.turso_http import execute_query

# Check schema of key tables
tables_to_check = ['reviews', 'support_tickets', 'tags']
for table in tables_to_check:
    print(f"\n=== {table} ===")
    result = execute_query(f"PRAGMA table_info({table})")
    for row in result.get("rows", []):
        print(f"  {row[1]} ({row[2]})")
