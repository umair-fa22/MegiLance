import re

filepath = r'e:\MegiLance\backend\app\services\ai_writing.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# I will find the lines with `prompt = f"Write a professional...` and replace the f-string quotes with triple quotes.
# the simplest way: replace `prompt = f"Write a professional` with `prompt = f"""Write a professional` and its matching unescaped double quote.

text = text.replace(
'''prompt = f"Write a professional freelancer proposal for a project titled '{project_title}'.\\n\\nProject Description:\\n{project_description}\\n\\nMy Skills: {', '.join(user_skills)}\\nMy Experience: {user_experience or 'Experienced professional.'}\\n\\nPlease make the tone {tone.value}."''',
'''prompt = f"""Write a professional freelancer proposal for a project titled '{project_title}'.

Project Description:
{project_description}

My Skills: {', '.join(user_skills)}
My Experience: {user_experience or 'Experienced professional.'}

Please make the tone {tone.value}."""'''
)
text = text.replace(
'''prompt += f"\\nMake sure to highlight these points: {', '.join(highlight_points)}"''',
'''prompt += f"\\nMake sure to highlight these points: {', '.join(highlight_points)}"'''
) # This one is single line so it might just be fine or need no change. But it had `\\n` manually typed.

text = text.replace(
'''prompt = f"Write a detailed project description based on these requirements: {requirements}\\n\\nProject Category: {category}\\nDesired Tone: {tone.value}"''',
'''prompt = f"""Write a detailed project description based on these requirements: {requirements}

Project Category: {category}
Desired Tone: {tone.value}"""'''
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
    
print("Fixed ai_writing syntax")
