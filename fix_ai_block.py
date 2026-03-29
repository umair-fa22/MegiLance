import re

filepath = r'e:\MegiLance\backend\app\services\advanced_ai.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# I will cleanly re-inject _assess_code_quality and _assess_content_quality

# They are defined starting with `async def _assess_code_quality`
pattern = r'async def _assess_code_quality.*?\)\]\)\n'

replacement = '''async def _assess_code_quality(self, work_id: int, code: str) -> QualityAssessment:
        """Assess code quality using advanced LLM models."""
        prompt = f"""Analyze the following code snippet and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).

Code:
{code[:3000]}"""
        try:
            from app.services.llm_gateway import llm_gateway
            response = await llm_gateway.generate_text(prompt=prompt, system_message="You are an expert code reviewer.")
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end != 0:
                import json
                data = json.loads(response[start:end])
                score = float(data.get("score", 70.0))
                issues = data.get("issues", [])
                suggestions = data.get("suggestions", [])
            else:
                raise ValueError("No JSON found")
        except Exception as e:
            logger.error(f"LLM Code Assessment failed: {e}")
            score = 70.0
            issues = [{"severity": "warning", "message": "Automated code assessment failed. Falling back to default."}]
            suggestions = ["Review code manually for best results."]

        return QualityAssessment(
            work_id=work_id,
            work_type="code",
            quality_score=min(100.0, max(0.0, score)),
            assessment_details={"assessor": "DigitalOcean AI", "method": "deep_analysis"},
            issues=issues,
            suggestions=suggestions
        )

    async def _assess_content_quality(self, work_id: int, content: str) -> QualityAssessment:
        """Assess content quality using advanced LLM models."""
        prompt = f"""Analyze the following content and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).

Content:
{content[:3000]}"""
        try:
            from app.services.llm_gateway import llm_gateway
            response = await llm_gateway.generate_text(prompt=prompt, system_message="You are an expert editor and content reviewer.")
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end != 0:
                import json
                data = json.loads(response[start:end])
                score = float(data.get("score", 70.0))
                issues = data.get("issues", [])
                suggestions = data.get("suggestions", [])
            else:
                raise ValueError("No JSON found")
        except Exception as e:
            logger.error(f"LLM Content Assessment failed: {e}")
            score = 70.0
            issues = [{"severity": "warning", "message": "Automated content assessment failed. Falling back to default."}]
            suggestions = ["Review content manually for best results."]

        return QualityAssessment(
            work_id=work_id,
            work_type="content",
            quality_score=min(100.0, max(0.0, score)),
            assessment_details={"assessor": "DigitalOcean AI", "method": "deep_analysis"},
            issues=issues,
            suggestions=suggestions
        )'''

# Let's extract the exact region to be completely safe
start_idx = text.find('async def _assess_code_quality')
end_idx = text.find('def _get_project_details')

if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + replacement + '\n\n    ' + text[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Replaced safely.")
else:
    print(f"Could not find boundaries: start_idx={start_idx} end_idx={end_idx}")

