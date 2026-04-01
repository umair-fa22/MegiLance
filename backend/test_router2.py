import asyncio
from app.api.v1.ai.ai_matching import get_project_recommendations
from app.db.turso_http import execute_query

async def main():
    try:
        res = execute_query("SELECT id FROM users WHERE email='freelancer1@example.com'")
        uid = res["rows"][0][0]
        if type(uid) == dict:
            uid = uid['value']
            
        class MockUser:
            def __init__(self, id):
                self.id = id
                
        user = MockUser(id=uid)
        res = await get_project_recommendations(limit=5, min_score=0.1, current_user=user)
        print("Success!", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(main())
