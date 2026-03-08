import re, os

pattern_guard = re.compile(r'if\s*\(\s*!resolvedTheme\s*\)\s*return\s+null;')
pattern_hook = re.compile(r'\buse(State|Effect|Ref|Memo|Callback|Reducer|Context|LayoutEffect|ImperativeHandle)\s*[\(<]')

violations = []
root = r'E:\MegiLance\frontend'

for dirpath, dirnames, filenames in os.walk(root):
    # Skip node_modules and .next
    dirnames[:] = [d for d in dirnames if d not in ('node_modules', '.next', '__mocks__', 'test-results', 'playwright-report')]
    for fname in filenames:
        if not fname.endswith('.tsx'):
            continue
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue
        
        if 'if (!resolvedTheme) return null;' not in content:
            continue
            
        lines = content.split('\n')
        guard_line = None
        for i, line in enumerate(lines):
            if pattern_guard.search(line):
                guard_line = i
            if guard_line is not None and i > guard_line:
                if pattern_hook.search(line) and 'useTheme' not in line and 'usePathname' not in line:
                    stripped = line.strip()
                    if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
                        continue
                    rel = os.path.relpath(fpath, root)
                    violations.append((rel, guard_line + 1, i + 1, stripped[:100]))
                    break

print(f'Found {len(violations)} files with hooks AFTER guard (Rules of Hooks violation):')
for v in violations:
    print(f'  {v[0]}:{v[1]} guard -> {v[2]} hook: {v[3]}')
