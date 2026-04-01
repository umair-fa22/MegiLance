import asyncio
from app.api.v1.identity.users import get_profile_completeness
from app.db.turso_http import execute_query

def main():
    try:
        from datetime import datetime, timezone
        res = execute_query("SELECT * FROM users WHERE email='client1@example.com'")
        if res and "rows" in res and len(res["rows"]) > 0:
            from app.db.turso_http import parse_rows
            rows = parse_rows(res)
            user = rows[0]
            print(type(user))
            res = get_profile_completeness(current_user=user)
            print("Success!", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
