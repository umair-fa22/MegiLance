from app.db.turso_http import execute_query; res=execute_query("SELECT name FROM sqlite_master WHERE type='table'"); print([r[0]["value"] for r in res["rows"]])
