import re

filename = r"e:\MegiLance\backend\app\services\fraud_detection.py"
with open(filename, "r", encoding="utf-8") as f:
    text = f.read()

# Replace _analyze_content_patterns to include AI
old_analyze_content = r'''async def _analyze_content_patterns(.*?)-> Dict\[str, Any\]:.*?return \{(.*?)\}'''

new_analyze_content = '''async def _analyze_content_patterns\\1-> Dict[str, Any]:
        """Analyze proposals/projects for suspicious content patterns using Advanced AI."""
        score = 0
        flags = []

        # Check recent proposals for suspicious patterns
        result = execute_query(
            "SELECT cover_letter FROM proposals WHERE freelancer_id = ? ORDER BY created_at DESC LIMIT 5",
            [user_id]
        )
        recent_proposals = parse_rows(result)

        cover_letters = [p["cover_letter"] for p in recent_proposals if p.get("cover_letter")]
        
        if cover_letters:
            all_text = "\\n---\\n".join(cover_letters)
            
            # Use Advanced AI Gateway for deep fraud pattern detection
            prompt = f"Analyze the following user proposals for signs of freelancer fraud, scam, bot-like behavior, spam, or malicious intent.\\n\\nProposals:\\n{all_text[:3000]}\\n\\nRespond with a valid JSON strictly following this format: {{\\"fraud_score\\": 0-100, \\"flags\\": [\\"reason 1\\", \\"reason 2\\"]}}."
            
            try:
                import json
                ai_response = await llm_gateway.generate_text(prompt, system_message="You are an expert fraud detection AI agent.")
                start = ai_response.find("{")
                end = ai_response.rfind("}") + 1
                if start != -1 and end != 0:
                    data = json.loads(ai_response[start:end])
                    ai_score = data.get("fraud_score", 0)
                    ai_flags = data.get("flags", [])
                    
                    if ai_score > 40:
                        score += int(ai_score * 0.4) # weight AI score
                        flags.extend(ai_flags)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"AI Fraud Detection Failed: {e}")

        # Fallback basic checks
        if len(cover_letters) >= 3:
            duplicate_count = self._detect_duplicates(cover_letters)
            if duplicate_count >= 3:
                score += 15
                flags.append(f'Detected {duplicate_count} near-duplicate proposals (possible copy-paste spam)')

        return \\2'''

text = re.sub(old_analyze_content, new_analyze_content, text, flags=re.DOTALL)

with open(filename, "w", encoding="utf-8") as f:
    f.write(text)

print("Injected Fraud Detection AI")