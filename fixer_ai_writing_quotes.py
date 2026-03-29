import re

with open('backend/app/services/ai_writing.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('prompt += f"\\nMake sure to highlight these points: {\\', \\'.join(highlight_points)}"',
                    'prompt += f"\\nMake sure to highlight these points: {\\', \\'.join(highlight_points)}"')

# wait, simpler string replace or just sub
def replace_func(m):
    return m.group(0).replace('f"\\n', 'f"""\\n').replace('}"', '}"""').replace('\'"', '\\'"""')

text = re.sub(r'prompt \+= f"\nMake sure to highlight these points: \{.*?\}"', lambda m: m.group(0).replace('f"', 'f"""').replace(', \'.join(highlight_points)}"', ', \'.join(highlight_points)}"""'), text)

text = re.sub(r'generated_content = f"Dear Client,\n\nI am excited to submit my proposal for \'.*?\'\.\.\."', lambda m: m.group(0).replace('f"', 'f"""').replace('..."', '..."""'), text)

# Just plain replace for the problem areas
text = text.replace('prompt += f"\\nMake sure to highlight these points', 'prompt += f"""\\nMake sure to highlight these points')
text = text.replace('highlight_points}"\\n', 'highlight_points}"""\\n')

text = text.replace('generated_content = f"Dear Client,\\n\\nI am excited to submit my proposal for \'{project_title}\'..."', 'generated_content = f"""Dear Client,\\n\\nI am excited to submit my proposal for \'{project_title}\'..."""')

# Look for similar issues in generate_profile_bio
text = text.replace('generated_content = f"I am a {role} experienced in {skills_str}', 'generated_content = f"""I am a {role} experienced in {skills_str}')
text = text.replace('providing {tone.value} services."', 'providing {tone.value} services."""')

text = text.replace('generated_content = f"Project: {requirements[:50]}', 'generated_content = f"""Project: {requirements[:50]}')
text = text.replace('needs a skilled professional."', 'needs a skilled professional."""')

with open('backend/app/services/ai_writing.py', 'w', encoding='utf-8') as f:
    f.write(text)
print("Quotes fixed")
