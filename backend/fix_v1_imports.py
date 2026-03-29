import os
import re

source_dir = 'backend/app/api/v1'
domain_map = {}
for root, dirs, files in os.walk(source_dir):
    for f in files:
        if f.endswith('.py') and f != '__init__.py':
            domain = os.path.basename(root)
            mod_name = f[:-3]
            domain_map[mod_name] = domain

def fix_imports(content):
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        match = re.search(r'from\s+app\.api\.v1\.([a-zA-Z0-9_]+)\s+import', line)
        if match:
            mod = match.group(1)
            if mod in domain_map:
                domain = domain_map[mod]
                line = line.replace(f'from app.api.v1.{mod} import', f'from app.api.v1.{domain}.{mod} import')
        
        # also match generic import app.api.v1.mod
        match2 = re.search(r'import\s+app\.api\.v1\.([a-zA-Z0-9_]+)', line)
        if match2:
            mod = match2.group(1)
            if mod in domain_map:
                domain = domain_map[mod]
                line = line.replace(f'import app.api.v1.{mod}', f'import app.api.v1.{domain}.{mod}')
        
        new_lines.append(line)
        
    return '\n'.join(new_lines)

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
