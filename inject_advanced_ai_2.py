import re
import os

text = open("backend/app/services/advanced_ai.py", "r", encoding="utf-8").read()

code_quality_pattern = r'async def _assess_code_quality\(self, work_id: int, code: str\) -> QualityAssessment:.*?return QualityAssessment\(\s*work_id=work_id,\s*work_type="code",\s*quality_score=max\(score, 0\)[^\)]*\)'
content_quality_pattern = r'async def _assess_content_quality\(self, work_id: int, content: str\) -> QualityAssessment:.*?return QualityAssessment\(\s*work_id=work_id,\s*work_type="content",\s*quality_score=max\(score, 0\)[^\)]*\)'

new_code_quality = """async def _assess_code_quality(self, work_id: int, code: str) -> QualityAssessment:
        \"\"\"Assess code quality using advanced LLM models.\"\"\"
        prompt = f"Analyze the following code snippet and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).\\n\\nCode:\\n{code[:3000]}"
        try:
            response = await llm_gateway.generate_text(prompt=prompt, system_message="You are an expert code reviewer.")
            # Basic parsing of JSON from the response
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end != 0:
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
        )"""

new_content_quality = """async def _assess_content_quality(self, work_id: int, content: str) -> QualityAssessment:
        \"\"\"Assess content quality using advanced LLM models.\"\"\"
        prompt = f"Analyze the following content and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).\\n\\nContent:\\n{content[:3000]}"
        try:
            response = await llm_gateway.generate_text(prompt=prompt, system_message="You are an expert editor and content reviewer.")
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end != 0:
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
        )"""

text = re.sub(code_quality_pattern, new_code_quality, text, flags=re.DOTALL)
text = re.sub(content_quality_pattern, new_content_quality, text, flags=re.DOTALL)

with open("backend/app/services/advanced_ai.py", "w", encoding="utf-8") as f:
    f.write(text)
print("Inject success")
