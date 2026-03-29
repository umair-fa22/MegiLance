import os
import re
from pathlib import Path

pattern = re.compile(r"(from\s+['\"])(@/[^'\"]+)(['\"])")
pattern2 = re.compile(r"(import\s+[^'\"]+from\s+['\"])(@/[^'\"]+)(['\"])")

def fix_imports(content):
    new_content = content
    
    def replacer(match):
        prefix = match.group(1)
        path = match.group(2)
        suffix = match.group(3)
        return prefix + path.replace('\\\\', '/').replace('\\', '/') + suffix

    new_content = pattern.sub(replacer, new_content)
    new_content = pattern2.sub(replacer, new_content)
    return new_content

fixes = 0
for root, dirs, files in os.walk('E:/MegiLance/frontend/app'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = Path(root) / f
            try:
                content = path.read_text(encoding='utf-8')
                new_content = fix_imports(content)
                if content != new_content:
                    path.write_text(new_content, encoding='utf-8')
                    fixes += 1
            except Exception:
                pass
print(f'Fixed {fixes} files!')
