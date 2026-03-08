"""Quick platform data audit"""
import sys
sys.path.insert(0, ".")
from app.db.turso_http import get_turso_http

turso = get_turso_http()

def count(sql):
    r = turso.execute(sql)
    rows = r.get("results", [{}])[0].get("response", {}).get("result", {}).get("rows", [])
    val = rows[0][0] if rows else 0
    return val.get("value") if isinstance(val, dict) else val

print(f"Total projects: {count('SELECT COUNT(*) FROM projects')}")
print(f"Open projects: {count(chr(39).join(['SELECT COUNT(*) FROM projects WHERE status = ', 'open', '']))}")
print(f"Total users: {count('SELECT COUNT(*) FROM users')}")
print(f"Total proposals: {count('SELECT COUNT(*) FROM proposals')}")
print(f"Total contracts: {count('SELECT COUNT(*) FROM contracts')}")

# Sample project
r = turso.execute("SELECT id, title, status FROM projects LIMIT 5")
rows = r.get("results", [{}])[0].get("response", {}).get("result", {}).get("rows", [])
print("\nSample projects:")
for row in rows:
    vals = [c.get("value") if isinstance(c, dict) else c for c in row]
    print(f"  [{vals[0]}] {vals[1][:60]} (status={vals[2]})")
