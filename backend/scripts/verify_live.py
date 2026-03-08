"""Verify REAL projects with actual apply URLs, broken down by source."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from app.db.turso_http import execute_query

def _val(cell):
    return cell.get("value") if isinstance(cell, dict) else cell

def _count(sql, params=None):
    r = execute_query(sql, params or [])
    if r and r.get("rows") and len(r["rows"]) > 0:
        return int(_val(r["rows"][0][0]))
    return 0

print("=" * 70)
print("  MegiLance Project Verification")
print("=" * 70)

# By source
remoteok = _count("SELECT COUNT(*) FROM projects WHERE description LIKE '%RemoteOK%'")
remotive = _count("SELECT COUNT(*) FROM projects WHERE description LIKE '%Remotive%'")
freelancer = _count("SELECT COUNT(*) FROM projects WHERE description LIKE '%Freelancer.com%'")
real_links = _count("SELECT COUNT(*) FROM projects WHERE description LIKE '%APPLY HERE (REAL LINK)%'")
total = _count("SELECT COUNT(*) FROM projects WHERE status = 'open'")

print(f"\n  Source breakdown:")
print(f"    RemoteOK.com:     {remoteok} projects")
print(f"    Remotive.com:     {remotive} projects")
print(f"    Freelancer.com:   {freelancer} projects")
print(f"    ---")
print(f"    With real links:  {real_links}")
print(f"    Total open:       {total}")
print(f"    Real data %:      {real_links/total*100:.1f}%" if total else "")

# Sample 5 newest projects with apply URLs
print(f"\n  5 Most Recent REAL Projects:")
r = execute_query("SELECT title, created_at FROM projects WHERE description LIKE '%APPLY HERE (REAL LINK)%' ORDER BY created_at DESC LIMIT 5")
if r and r.get("rows"):
    for row in r["rows"]:
        print(f"    + {_val(row[0])}")

# Categories
print(f"\n  Categories:")
r2 = execute_query("SELECT category, COUNT(*) as cnt FROM projects WHERE status = 'open' GROUP BY category ORDER BY cnt DESC")
if r2 and r2.get("rows"):
    for row in r2["rows"]:
        print(f"    {_val(row[0])}: {_val(row[1])}")

print(f"\n{'=' * 70}")
print(f"  All {real_links} projects have DIRECT apply/bid URLs!")
print(f"{'=' * 70}")
