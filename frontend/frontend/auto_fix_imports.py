import subprocess
import re
import os
from pathlib import Path

def find_file_in_components(basename):
    base = Path('E:/MegiLance/frontend/app/components')
    for p in base.rglob('*'):
        if p.is_file() and p.suffix in ['.tsx', '.ts', '.css']:
            if p.stem == basename or p.name == basename:
                rel = p.relative_to(Path('E:/MegiLance/frontend'))
                return f"@/{str(rel.parent).replace(chr(92), '/')}/{p.stem}"
    return None

def run_tsc():
    print('Running tsc...')
    result = subprocess.run(['npx', 'tsc', '--noEmit'], capture_output=True, text=True, cwd='E:/MegiLance/frontend', shell=True)
    return result.stdout

def fix_imports():
    output = run_tsc()
    error_pattern = re.compile(r"([^\(]+)\(\d+,\d+\): error TS2307: Cannot find module '([^']+)'")
    fixes = 0
    for line in output.splitlines():
        match = error_pattern.search(line)
        if match:
            filepath = match.group(1).strip()
            bad_module = match.group(2).strip()
            
            basename = bad_module.split('/')[-1]
            if not basename: continue
            
            good_module = find_file_in_components(basename)
            if good_module:
                full_path = Path('E:/MegiLance/frontend') / filepath
                try:
                    content = full_path.read_text(encoding='utf-8')
                    new_content = content.replace(f"'{bad_module}'", f"'{good_module}'")
                    new_content = new_content.replace(f'"{bad_module}"', f'"{good_module}"')
                    if content != new_content:
                        full_path.write_text(new_content, encoding='utf-8')
                        print(f'Fixed: {bad_module} -> {good_module} in {filepath}')
                        fixes += 1
                except Exception as e:
                    print(f'Error reading {full_path}: {e}')
    print(f'Made {fixes} fixes in this pass.')
    return fixes

while True:
    fixes = fix_imports()
    if fixes == 0:
        print('No more automated fixes could be made.')
        break
