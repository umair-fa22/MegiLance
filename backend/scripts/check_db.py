"""Check database tables and connection"""
import sys
sys.path.insert(0, ".")
from app.db.turso_http import get_turso_http

turso = get_turso_http()

# List all tables
r = turso.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
rows = r.get("results", [{}])[0].get("response", {}).get("result", {}).get("rows", [])
print(f"Tables ({len(rows)}):")
for row in rows:
    val = row[0]
    name = val.get("value") if isinstance(val, dict) else val
    print(f"  {name}")
