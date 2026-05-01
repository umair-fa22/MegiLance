import asyncio
from app.services.ai_chatbot import get_chatbot_service

async def main():
    svc = get_chatbot_service()
    try:
        result = await asyncio.wait_for(svc.start_conversation(user_id=None, context=None), timeout=10)
        print("OK:", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("FAILED:", type(e).__name__, e)

asyncio.run(main())
