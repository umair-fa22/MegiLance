import re

filename = r"e:\MegiLance\backend\app\services\ai_writing.py"
with open(filename, "r", encoding="utf-8") as f:
    text = f.read()

# Replace generate_proposal
old_generate_proposal = r'''async def generate_proposal(.*?)-> Dict\[str, Any\]:.*?return \{.*?\}'''
new_generate_proposal = '''async def generate_proposal\\1-> Dict[str, Any]:
        """Generate a proposal for a project using LLM."""
        await self._ensure_tables()
        
        prompt = f"Write a professional freelancer proposal for a project titled '{project_title}'.\\n\\nProject Description:\\n{project_description}\\n\\nMy Skills: {', '.join(user_skills)}\\nMy Experience: {user_experience or 'Experienced professional.'}\\n\\nPlease make the tone {tone.value}."
        if highlight_points:
            prompt += f"\\nMake sure to highlight these points: {', '.join(highlight_points)}"
            
        generated_content = await llm_gateway.generate_text(prompt, system_message="You are an expert freelancer writing a high-converting proposal.")
        
        if not generated_content or len(generated_content) < 20:
             # Fallback
             generated_content = f"Dear Client,\\n\\nI am excited to submit my proposal for '{project_title}'..."
             
        word_count = len(generated_content.split())
        
        # Log the generation
        await self._log_generation(
            user_id,
            WritingContentType.PROPOSAL,
            prompt,
            generated_content,
            {"tone": tone.value}
        )
        
        return {
            "content": generated_content,
            "word_count": word_count,
            "tone": tone.value,
            "suggestions": ["Consider adding a question to engage the client at the end."]
        }'''
text = re.sub(old_generate_proposal, new_generate_proposal, text, flags=re.DOTALL)


# Replace generate_project_description
old_generate_project_description = r'''async def generate_project_description(.*?)-> Dict\[str, Any\]:.*?return \{.*?\}'''
new_generate_project_description = '''async def generate_project_description\\1-> Dict[str, Any]:
        """Generate a project description using LLM."""
        await self._ensure_tables()
        
        prompt = f"Write a detailed project description based on these requirements: {requirements}\\n\\nProject Category: {category}\\nDesired Tone: {tone.value}"
        generated_content = await llm_gateway.generate_text(prompt, system_message="You are an expert project manager writing clear, comprehensive project descriptions.")
        
        if not generated_content:
            generated_content = f"Project Requirements: {requirements}"
            
        word_count = len(generated_content.split())
        
        await self._log_generation(user_id, WritingContentType.PROJECT_DESCRIPTION, prompt, generated_content, {"category": category})
        
        return {
            "content": generated_content,
            "word_count": word_count,
            "formatting_suggestions": ["Use bullet points for deliverables"]
        }'''
text = re.sub(old_generate_project_description, new_generate_project_description, text, flags=re.DOTALL)

with open(filename, "w", encoding="utf-8") as f:
    f.write(text)

print("Injected AI Writing")
