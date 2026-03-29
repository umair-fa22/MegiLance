import os

filepath = r'e:\MegiLance\backend\app\services\fraud_detection.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_func = '''    async def _analyze_content_patterns(self, user_id: int) -> Dict[str, Any]:
        """Analyze proposals/projects for suspicious content patterns."""
        score = 0
        flags = []

        # Check recent proposals for suspicious patterns
        result = execute_query(
            "SELECT cover_letter FROM proposals WHERE freelancer_id = ? ORDER BY created_at DESC LIMIT 20",
            [user_id]
        )'''

new_func = '''    async def _analyze_content_patterns(self, user_id: int) -> Dict[str, Any]:
        """Analyze proposals/projects for suspicious content patterns."""
        score = 0
        flags = []

        # Check recent proposals for suspicious patterns
        result = execute_query(
            "SELECT cover_letter FROM proposals WHERE freelancer_id = ? ORDER BY created_at DESC LIMIT 20",
            [user_id]
        )
        recent_proposals = parse_rows(result)

        cover_letters = [p["cover_letter"] for p in recent_proposals if p.get("cover_letter") and len(p["cover_letter"]) > 30]
        
        # --- DIGITALOCEAN AI DEEP FRAUD INSPECTION ---
        if cover_letters:
            all_text = " ".join(cover_letters[:2]) # Check latest 2 for AI to save tokens
            prompt = f"Analyze the following proposals for signs of freelancer fraud, scam, bot-automation, or malicious intent.\\n\\nProposals:\\n{all_text[:2000]}\\n\\nRespond with valid JSON: {{\\"fraud_score\\": 0-100, \\"flags\\": [\\"string\\"]}}"
            try:
                import json
                from app.services.llm_gateway import llm_gateway
                ai_response = await llm_gateway.generate_text(prompt, system_message="You are an expert platform security and fraud detection AI classifier.")
                start = ai_response.find("{")
                end = ai_response.rfind("}") + 1
                if start != -1 and end != 0:
                    data = json.loads(ai_response[start:end])
                    ai_score = data.get("fraud_score", 0)
                    ai_flags = data.get("flags", [])
                    if ai_score > 40:
                        score += int(ai_score * 0.4)
                        flags.extend(ai_flags)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"AI Fraud Detection Failed: {e}")
        # --- END AI ---'''

if old_func in content:
    content = content.replace(old_func, new_func)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Failed to find old target')
