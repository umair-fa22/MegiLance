import re
filepath = r'e:\MegiLance\backend\app\services\ai_chatbot.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'async def _generate_ai_response\(self, prompt: str\) -> Optional\[str\]:.*?return None\n        except Exception as e:\n            logger\.error\(f"AI generation failed: \{e\}"\)\n            return None'

new_func = '''async def _generate_ai_response(self, prompt: str) -> Optional[str]:
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

new_content, count = re.subn(pattern, new_func, content, flags=re.DOTALL)
if count > 0:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Replaced Regex Successfully')
else:
    print('Regex failed to match')
