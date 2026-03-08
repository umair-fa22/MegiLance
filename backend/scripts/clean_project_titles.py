"""Clean project titles by removing external service ID suffixes"""
import re
import sys
sys.path.insert(0, ".")
from app.db.turso_http import get_turso_http

turso = get_turso_http()

# Find projects with external ID patterns in title
result = turso.execute(
    "SELECT id, title FROM projects WHERE title LIKE '%(Freelancer.com%' OR title LIKE '%(RemoteOK%' OR title LIKE '%(Remotive%'"
)

rows_data = result.get("results", [{}])[0].get("response", {}).get("result", {})
rows = rows_data.get("rows", [])
cols = rows_data.get("cols", [])
col_names = [c.get("name") for c in cols] if cols else ["id", "title"]

print(f"Found {len(rows)} projects with external IDs in titles")

# Pattern to strip: " (Freelancer.com #12345)" or " (RemoteOK #abc)" etc
pattern = re.compile(r'\s*\((?:Freelancer\.com|RemoteOK|Remotive)\s*#[^)]*\)\s*$')

updated = 0
for row in rows:
    vals = [c.get("value") if isinstance(c, dict) else c for c in row]
    pid = vals[0]
    title = vals[1]
    new_title = pattern.sub('', title).strip()
    if new_title != title:
        print(f"  [{pid}] '{title[:60]}' -> '{new_title[:60]}'")
        turso.execute("UPDATE projects SET title = ? WHERE id = ?", [new_title, pid])
        updated += 1

print(f"\nUpdated {updated} project titles")
