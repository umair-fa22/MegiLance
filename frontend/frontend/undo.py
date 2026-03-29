import os
from pathlib import Path
for root, dirs, files in os.walk('E:/MegiLance/frontend/app'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = Path(root) / f
            try:
                content = path.read_text(encoding='utf-8')
                new_content = content.replace('@/appcomponentsatoms', '@/app/components/atoms/')
                new_content = new_content.replace('@/appcomponentsmolecules', '@/app/components/molecules/')
                new_content = new_content.replace('@/appcomponentsorganisms', '@/app/components/organisms/')
                new_content = new_content.replace('@/appcomponentstemplates', '@/app/components/templates/')
                if content != new_content:
                    path.write_text(new_content, encoding='utf-8')
                    print(f'Fixed {path}')
            except Exception:
                pass
