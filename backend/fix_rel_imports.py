import os
import re

source_dir = 'backend/app/api/v1'

def fix_imports(content):
    # Change from .... to app.
    content = re.sub(r'from \.\.\.\.', 'from app.', content)
    # Change from ... to app.
    content = re.sub(r'from \.\.\.', 'from app.', content)
    # Change from .. to app.api.
    content = re.sub(r'from \.\.', 'from app.api.', content)
    return content

fixes = 0
for root, dirs, files in os.walk(source_dir):
    for f in files:
        if f.endswith('.py'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            new_content = fix_imports(content)
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                fixes += 1

print(f"Fixed {fixes} files.")
