import os
import re

filepath = r'e:\MegiLance\backend\app\services\skill_analyzer_engine.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Make the methods async so they can call llm_gateway
text = text.replace('def validate_skill_relevance', 'async def validate_skill_relevance')
text = text.replace('def get_skill_recommendations', 'async def get_skill_recommendations')
text = text.replace('def analyze_project_skills', 'async def analyze_project_skills')

# Example of converting validate_skill_relevance
new_validate = '''async def validate_skill_relevance(
    skill: str,
    project_description: str,
    project_category: str
) -> Dict[str, Any]:
    """Validate skill relevance using Advanced AI Gateway."""
    from app.services.llm_gateway import llm_gateway
    import json
    
    prompt = f"Analyze if the skill '{skill}' is highly relevant to the following project description in the '{project_category}' category.\\n\\nProject Description:\\n{project_description}\\n\\nRespond purely in JSON format: {{\\"is_relevant\\": true|false, \\"relevance_score\\": 0-100, \\"reasoning\\": \\"string\\"}}"
    
    try:
        response = await llm_gateway.generate_text(prompt, system_message="You are an expert technical recruiter AI.")
        start = response.find("{")
        end = response.rfind("}") + 1
        if start != -1 and end != 0:
            data = json.loads(response[start:end])
            return {
                "skill": skill,
                "is_relevant": data.get("is_relevant", True),
                "relevance_score": data.get("relevance_score", 85),
                "context": data.get("reasoning", "Validated via DigitalOcean AI")
            }
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"AI skill validation failed: {e}")
        
    return {
        "skill": skill,
        "is_relevant": True,
        "relevance_score": 85,
        "context": "Fallback validation"
    }'''

text = re.sub(r'async def validate_skill_relevance\(.*?\) -> Dict\[str, Any\]:.*?(?=async def |def |$)', new_validate + '\n\n', text, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
print("Skill analyzer engine upgraded to AI gateway.")
