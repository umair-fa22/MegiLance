import re

with open('backend/app/services/ai_writing.py', 'r', encoding='utf-8') as f:
    text = f.read()

# exact substring replacements
block1_old = 'prompt += f"\nMake sure to highlight these points: {\', \'.join(highlight_points)}"'
block1_new = 'prompt += f"""\\nMake sure to highlight these points: {\', \'.join(highlight_points)}"""'

block2_old = 'generated_content = f"Dear Client,\n\nI am excited to submit my proposal for \'{project_title}\'..."'
block2_new = 'generated_content = f"""Dear Client,\\n\\nI am excited to submit my proposal for \'{project_title}\'..."""'

block3_old = 'generated_content = f"I am a {role} experienced in {skills_str} providing {tone.value} services."'
block3_new = 'generated_content = f"""I am a {role} experienced in {skills_str} providing {tone.value} services."""'

block4_old = 'prompt = f"Write a detailed project description based on these requirements: {requirements}\n\nProject Category: {category}\nDesired Tone: {tone.value}"'
block4_new = 'prompt = f"""Write a detailed project description based on these requirements: {requirements}\\n\\nProject Category: {category}\\nDesired Tone: {tone.value}"""'

block5_old = 'generated_content = f"Project: {requirements[:50]}... needs a skilled professional."'
block5_new = 'generated_content = f"""Project: {requirements[:50]}... needs a skilled professional."""'

text = text.replace(block1_old, block1_new)
text = text.replace(block2_old, block2_new)
text = text.replace(block3_old, block3_new)
text = text.replace(block4_old, block4_new)
text = text.replace(block5_old, block5_new)

with open('backend/app/services/ai_writing.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Block replaces done")
