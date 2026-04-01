import asyncio
from app.api.v1.ai.ai_matching import get_project_recommendations
from app.models.user import User
from app.db.turso_http import execute_query

async def main():
    try:
        from datetime import datetime, timezone
        res = execute_query("SELECT id, email, user_type FROM users LIMIT 1")
        if not res or not "rows" or len(res["rows"]) == 0:
            print("No user")
            return
        uid = res["rows"][0][0]
        
        class MockUser:
            def __init__(self, id):
                self.id = id
                
        user = MockUser(id=uid)
        res = await get_project_recommendations(limit=5, min_score=0.5, current_user=user)
        print("Success!", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
