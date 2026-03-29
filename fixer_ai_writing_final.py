import re

with open('backend/app/services/ai_writing.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace any occurrence of single-quoted f-strings containing newlines in generate_proposal
old_prop = r'''prompt = f"Write a professional freelancer proposal.*?Please make the tone \{tone\.value\}\."'''
new_prop = '''prompt = f"""Write a professional freelancer proposal for a project titled '{project_title}'.\\n\\nProject Description:\\n{project_description}\\n\\nMy Skills: {', '.join(user_skills)}\\nMy Experience: {user_experience or 'Experienced professional.'}\\n\\nPlease make the tone {tone.value}."""'''
text = re.sub(old_prop, new_prop, text, flags=re.DOTALL)

# Replace any occurrence of single-quoted f-strings containing newlines in generate_project_description
old_desc = r'''prompt = f"Write a detailed project description based on these requirements: \{requirements\}(.*?)Desired Tone: \{tone\.value\}"'''
new_desc = '''prompt = f"""Write a detailed project description based on these requirements: {requirements}\\n\\nProject Category: {category}\\nDesired Tone: {tone.value}"""'''
text = re.sub(old_desc, new_desc, text, flags=re.DOTALL)

with open('backend/app/services/ai_writing.py', 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixer executed")
