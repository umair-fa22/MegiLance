import re

with open('backend/app/services/ai_writing.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'prompt += f"\\n' in lines[i]:
        lines[i] = lines[i].replace('f"\\n', 'f"""\\n')
        # find the next line and add """
        for j in range(i+1, min(i+5, len(lines))):
            if '}"' in lines[j]:
                lines[j] = lines[j].replace('}"', '}"""')
                break
    
    if 'generated_content = f"Dear Client,\\n' in lines[i]:
        lines[i] = lines[i].replace('f"', 'f"""')
        for j in range(i+1, min(i+5, len(lines))):
            if '..."' in lines[j]:
                lines[j] = lines[j].replace('..."', '..."""')
                break
                
    if 'generated_content = f"I am a {role}' in lines[i]:
        lines[i] = lines[i].replace('f"', 'f"""')
        for j in range(i+1, min(i+5, len(lines))):
            if 'services."' in lines[j]:
                lines[j] = lines[j].replace('services."', 'services."""')
                break
                
    if 'generated_content = f"Project: ' in lines[i]:
        lines[i] = lines[i].replace('f"', 'f"""')
        for j in range(i+1, min(i+5, len(lines))):
            if 'professional."' in lines[j]:
                lines[j] = lines[j].replace('professional."', 'professional."""')
                break

with open('backend/app/services/ai_writing.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)
    
print("Replaced f-strings with multiline quotes line-by-line")
