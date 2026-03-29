import re

filepath = r'e:\MegiLance\backend\app\services\ai_writing.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Instead of blindly doing string replace, I will use re to substitute the single-quoted f-strings that contain literal newlines.
print("Replacing single f-string with triple double quotes.")

pattern1 = r'prompt = f"Write a professional freelancer proposal for a project titled \'{project_title}\'\.(.*?tone \{tone\.value\}\.)"'
text = re.sub(pattern1, lambda m: f'prompt = f"""Write a professional freelancer proposal for a project titled \'{project_title}\'.{m.group(1)}"""', text, flags=re.DOTALL)

pattern2 = r'prompt = f"Write a detailed project description based on these requirements: \{requirements\}(.*?)Desired Tone: \{tone\.value\}"'
text = re.sub(pattern2, lambda m: f'prompt = f"""Write a detailed project description based on these requirements: {{requirements}}{m.group(1)}Desired Tone: {{tone.value}}"""', text, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
    
print("Done")