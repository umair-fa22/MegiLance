import os
import re

# 1. Update proposal_writer.py
router_path = r'e:\MegiLance\backend\app\api\v1\core_domain\proposal_writer.py'
with open(router_path, 'r', encoding='utf-8') as f:
    router_text = f.read()

router_text = router_text.replace(
    'result = proposal_writer_engine.generate_proposal(',
    'result = await proposal_writer_engine.generate_proposal('
)

with open(router_path, 'w', encoding='utf-8') as f:
    f.write(router_text)

# 2. Update proposal_writer_engine.py
engine_path = r'e:\MegiLance\backend\app\services\proposal_writer_engine.py'
with open(engine_path, 'r', encoding='utf-8') as f:
    engine_text = f.read()

# Make generate_proposal async
engine_text = engine_text.replace('def generate_proposal(', 'async def generate_proposal(')
engine_text = engine_text.replace('def _compose_proposal(', 'async def _compose_proposal(')
engine_text = engine_text.replace(
    'proposal_text = _compose_proposal(',
    'proposal_text = await _compose_proposal('
)

# Overwrite _compose_proposal to use llm_gateway
old_compose = r'async def _compose_proposal\(.*?\) -> str:.*?return "\\n\\n"\.join\(sections\)'

new_compose = '''async def _compose_proposal(
    project_title: str,
    project_description: str,
    skills: List[str],
    skill_match: Dict,
    experience_level: str,
    tone: str,
    length: str,
    freelancer_name: Optional[str],
    years_experience: Optional[int],
    highlight_points: Optional[List[str]],
    proposed_rate: float,
    proposed_timeline: Optional[str],
    detected_type: Dict,
) -> str:
    """Compose the full proposal text using Advanced AI Gateway."""
    from app.services.llm_gateway import llm_gateway
    
    prompt = f"""
    Write a highly professional and winning freelancer proposal for the following project.
    
    Project Title: {project_title}
    Project Description: {project_description}
    
    Freelancer Details to include:
    - Skills: {', '.join(skills)}
    - Experience Level: {experience_level}
    - Years of Experience: {years_experience if years_experience else 'Not specified'}
    - Rate: {f"${proposed_rate}/hr" if proposed_rate else "Negotiable"}
    - Proposed Timeline: {proposed_timeline if proposed_timeline else "As soon as possible"}
    - Highlights: {', '.join(highlight_points) if highlight_points else "None specified"}
    
    Requirements:
    - Tone: {tone}
    - Length: {length}
    - Include a sign-off as "{freelancer_name if freelancer_name else 'Freelancer'}"
    """
    
    try:
        response = await llm_gateway.generate_text(
            prompt=prompt,
            system_message="You are an expert technical bid writer and freelancer coach. Generate only the written proposal with no metadata or commentary outside the text itself.",
            temperature=0.7,
            max_tokens=2000
        )
        if response:
            return response.strip()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"AI compose proposal failed: {e}")
        
    return "Hello,\\n\\nI am interested in this project and have the required skills.\\n\\nThank you."
'''

engine_text = re.sub(old_compose, new_compose, engine_text, flags=re.DOTALL)

with open(engine_path, 'w', encoding='utf-8') as f:
    f.write(engine_text)

print("Upgraded proposal_writer API and Engine")
