"""List all tables in the Turso database."""
from app.db.turso_http import execute_query, parse_rows

result = execute_query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
rows = parse_rows(result)
for r in rows:
    print(r["name"])
