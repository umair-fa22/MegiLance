import os

with open('backend/app/services/fraud_detection.py', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "from app.services.llm_gateway import llm_gateway\n"
if "llm_gateway" not in content:
    content = content.replace('import re\n', 'import re\n' + import_stmt)

old_logic = "return {'error': 'Project not found'}\n            project = rows[0]\n\n            risk_score = 0"
new_logic = '''return {'error': 'Project not found'}
            project = rows[0]

            risk_score = 0
            
            # --- NEXT-GEN AI: LLM Semantic Context Analysis ---
            if llm_gateway.is_active:
                prompt_text = f"Analyze this job project for potential scam/fraud: Title: {project.get('title', '')} Desc: {project.get('description', '')[:500]} Budget: {project.get('budget', 0)}. Return ONLY a JSON block with keys 'score' (0-100 logic, 100=definitely scam) and 'reason'."
                ai_text = await llm_gateway.generate_text(prompt_text, system_message="You are a Trust & Safety automated AI Agent targeting freelance-platform fraud.")
                try:
                    import json
                    start = ai_text.find('{')
                    end = ai_text.rfind('}') + 1
                    doc = json.loads(ai_text[start:end])
                    # blend it
                    if doc.get('score', 0) > 60:
                        risk_score += 40
                        # Try inserting if signals list exists below
                except:
                    pass
            # ------------------------------------------------
'''
content = content.replace(old_logic, new_logic)

with open('backend/app/services/fraud_detection.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected ML Fraud checks")
