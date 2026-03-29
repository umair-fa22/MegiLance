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

with open('backend/app/api/routers.py', 'r', encoding='utf-8') as f:
    routers_content = f.read()

# Replace from .v1 import ( health, users, ... ) with specific imports.
# It's easier to just recreate routers.py imports and router includes!

lines = routers_content.split('\n')
new_lines = []
import_section = False
for line in lines:
    if line.startswith('from .v1 import'):
        import_section = True
        continue
    if import_section:
        if ')' in line and not line.strip().startswith('#'):
            import_section = False
        continue
    new_lines.append(line)

new_content = '\n'.join(new_lines)

# Now we need to append the new imports.
imports = []
for mod, domain in domain_map.items():
    if domain != 'v1':
        imports.append(f'from .v1.{domain} import {mod}')
    else:
        imports.append(f'from .v1 import {mod}')

import_block = '\n'.join(imports)
new_content = new_content.replace('from fastapi import APIRouter', f'from fastapi import APIRouter\n{import_block}')

with open('backend/app/api/routers.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated routers.py successfully!")
