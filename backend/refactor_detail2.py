import os
import glob
import re

search_dirs = [
    'E:/MegiLance/backend/app/api',
    'E:/MegiLance/backend/app/services'
]

total_replacements = 0

for d in search_dirs:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                original_content = content
                
                # Global replace for detail=str(e) or detail=f"{e}" or detail=f"{str(e)}"
                new_content = re.sub(r'detail\s*=\s*str\(e\)', 'detail="Internal server error"', content)
                new_content = re.sub(r'detail\s*=\s*f"[^"]*\{e\}[^"]*"', 'detail="Internal server error"', new_content)
                new_content = re.sub(r'detail\s*=\s*f"[^"]*\{str\(e\)\}[^"]*"', 'detail="Internal server error"', new_content)
                
                if new_content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    total_replacements += 1
                    print(f"Patched {filepath}")

print(f"Total files patched: {total_replacements}")

