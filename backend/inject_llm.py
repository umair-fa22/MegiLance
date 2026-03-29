import os

with open('backend/app/services/ai_writing.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "from app.services.llm_gateway import llm_gateway\n"
if "llm_gateway" not in content:
    content = content.replace('from collections import Counter\n', 'from collections import Counter\n' + import_stmt)

# Inject into generate_proposal
old_proposal_logic = '''        proposal = f"""Dear Client,

I was excited to come across your project for a {project_title}. This aligns perfectly with my expertise.

{experience_text}

{highlight_section}
Here is how I plan to approach your project:
1. **Initial Consultation**: Understand your exact requirements and vision.
2. **Implementation Strategy**: Utilize my skills in {skills_text} to deliver high-quality results.
3. **Review & Refine**: Close collaboration to ensure the final product exceeds your expectations.

I am confident in my ability to deliver excellent results for this project. I'm available for a quick chat to discuss this further.

Best regards,
[Your Name]"""'''

new_proposal_logic = '''        # Try real LLM first
        prompt = f"Write a professional freelance proposal for a project titled '{project_title}'. Project description: {project_description}. My skills are {skills_text}. My experience: {experience_text}. Tone should be {tone}. Highlights: {highlight_section}"
        llm_response = await llm_gateway.generate_text(prompt, system_message="You are an expert freelance proposal writer. Keep it concise, persuasive, and directly address the client's needs.")
        
        if llm_response:
            proposal = llm_response
        else:
            # Fallback
            proposal = f"""Dear Client,

I was excited to come across your project for a {project_title}. This aligns perfectly with my expertise.

{experience_text}

{highlight_section}
Here is how I plan to approach your project:
1. **Initial Consultation**: Understand your exact requirements and vision.
2. **Implementation Strategy**: Utilize my skills in {skills_text} to deliver high-quality results.
3. **Review & Refine**: Close collaboration to ensure the final product exceeds your expectations.

I am confident in my ability to deliver excellent results for this project. I'm available for a quick chat to discuss this further.

Best regards,
[Your Name]"""'''

content = content.replace(old_proposal_logic, new_proposal_logic)

with open('backend/app/services/ai_writing.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Injected LLM logic into ai_writing.py')
