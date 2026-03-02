from app.db.turso_http import execute_query
result = execute_query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in result.get("rows", [])]
for t in tables:
    print(t)
