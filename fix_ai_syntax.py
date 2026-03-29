import re

filepath = r'e:\MegiLance\backend\app\services\advanced_ai.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix code quality prompt
text = text.replace(
'''prompt = f"Analyze the following code snippet and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).

Code:
{code[:3000]}"''',
'''prompt = f"""Analyze the following code snippet and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).

Code:
{code[:3000]}"""'''
)

# Fix content quality prompt
text = text.replace(
'''prompt = f"Analyze the following content and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).

Content:
{content[:3000]}"''',
'''prompt = f"""Analyze the following content and provide a quality assessment. Return a JSON with 'score' (0-100), 'issues' (list of {{'severity': str, 'message': str}}), and 'suggestions' (list of strings).

Content:
{content[:3000]}"""'''
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed f-string syntax in advanced_ai.py")
