import asyncio
from app.services.matching_engine import MatchingEngine
from app.db.turso_http import execute_query

def main():
    try:
        # just find an active freelancer ID to test with
        res = execute_query("SELECT id FROM users LIMIT 1")
        if res and "rows" in res and len(res["rows"]) > 0:
            freelancer_id = res["rows"][0][0]
            engine = MatchingEngine()
            print("testing with id:", freelancer_id)
            res = engine.get_recommended_projects(freelancer_id, 5, 0.5)
            print("Success")
        else:
            print("No users found.")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
