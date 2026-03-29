import os

filepath = r'e:\MegiLance\backend\app\services\ai_chatbot.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_func = '''    async def _generate_ai_response(self, prompt: str) -> Optional[str]:
        """Generate response using local AI service."""
        import httpx
        import os
        
        ai_service_url = os.getenv("AI_SERVICE_URL", "http://localhost:8001")
        try:
            async with httpx.AsyncClient() as client:
                # Add context to the prompt to keep it focused
                context_prompt = f"You are MegiBot, a helpful AI assistant for a freelancing platform called MegiLance. Answer the following user question politely and concisely: {prompt}"
                
                response = await client.post(
                    f"{ai_service_url}/ai/generate",
                    json={
                        "prompt": context_prompt,
                        "max_length": 150
                    },
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("text")
                return None
        except Exception as e:
            logger.warning(f"Error calling AI service: {e}")
            return None'''

new_func = '''    async def _generate_ai_response(self, prompt: str) -> Optional[str]:
        """Generate response using Advanced LLM Gateway."""
        from app.services.llm_gateway import llm_gateway
        try:
            system_message = "You are MegiBot, the official helpful AI support assistant for the freelancing platform MegiLance. Be polite, concise, and helpful."
            response = await llm_gateway.generate_text(
                prompt=prompt,
                system_message=system_message,
                max_tokens=250,
                temperature=0.6
            )
            if response:
                return response
            return None
        except Exception as e:
            logger.warning(f"Error calling Advanced AI Gateway for chatbot: {e}")
            return None'''

if old_func in content:
    content = content.replace(old_func, new_func)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Failed to find old target in ai_chatbot.py')
