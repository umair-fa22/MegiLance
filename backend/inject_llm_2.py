import os

with open('backend/app/services/ai_writing.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Inject into generate_project_description
old_desc = '''        description = f"""# {project_type}'''

new_desc = '''        # Try real LLM first
        prompt = f"Write a comprehensive project description (RFP) for a {project_type}. Key features: {', '.join(key_features)}. Target audience: {target_audience}. Budget range: {budget_range}. Tone: {tone}."
        llm_response = await llm_gateway.generate_text(prompt, system_message="You are an expert technical product manager writing a project spec (RFP) to hire freelancers.")
        
        if llm_response:
            description = llm_response
        else:
            description = f"""# {project_type}'''

content = content.replace(old_desc, new_desc)

with open('backend/app/services/ai_writing.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Injected LLM logic into ai_writing.py part 2')
