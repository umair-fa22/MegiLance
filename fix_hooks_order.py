"""
Fix Rules of Hooks violations: move 'if (!resolvedTheme) return null;' 
to AFTER all hook calls in each component.
"""
import re, os

FRONTEND_ROOT = r'E:\MegiLance\frontend'
pattern_guard = re.compile(r'^(\s*)if\s*\(\s*!resolvedTheme\s*\)\s*return\s+null;\s*$')
# Match React hook calls (not useTheme/usePathname which are typically before)
pattern_hook = re.compile(r'\buse(State|Effect|Ref|Memo|Callback|Reducer|Context|LayoutEffect|ImperativeHandle)\s*[\(<]')

fixed = 0
skipped = []

for dirpath, dirnames, filenames in os.walk(FRONTEND_ROOT):
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
        
        # Find guard line index
        guard_idx = None
        for i, line in enumerate(lines):
            if pattern_guard.match(line):
                guard_idx = i
                break
        
        if guard_idx is None:
            continue
        
        # Find the last hook call AFTER the guard
        last_hook_idx = None
        for i in range(guard_idx + 1, len(lines)):
            stripped = lines[i].strip()
            if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*'):
                continue
            if pattern_hook.search(lines[i]) and 'useTheme' not in lines[i] and 'usePathname' not in lines[i]:
                last_hook_idx = i
        
        if last_hook_idx is None:
            # No hooks after guard - no violation
            continue
        
        # Now we need to handle multi-line hooks. 
        # After the last hook line, find where that statement ends (track brackets)
        # For simple cases, it's the same line or we look for the closing );
        insert_after = last_hook_idx
        
        # Check if line has balanced parens
        open_count = lines[last_hook_idx].count('(') - lines[last_hook_idx].count(')')
        j = last_hook_idx
        while open_count > 0 and j + 1 < len(lines):
            j += 1
            open_count += lines[j].count('(') - lines[j].count(')')
        insert_after = j
        
        # Also check for useEffect(() => {...}, []) which spans multiple lines
        # Look ahead for any more hooks after insert_after
        for i in range(insert_after + 1, len(lines)):
            stripped = lines[i].strip()
            if stripped.startswith('//') or stripped.startswith('*') or stripped.startswith('/*') or stripped == '':
                continue
            if pattern_hook.search(lines[i]) and 'useTheme' not in lines[i] and 'usePathname' not in lines[i]:
                last_hook_idx = i
                # Re-track brackets
                open_count = lines[i].count('(') - lines[i].count(')')
                k = i
                while open_count > 0 and k + 1 < len(lines):
                    k += 1
                    open_count += lines[k].count('(') - lines[k].count(')')
                insert_after = k
        
        # Extract the guard line (preserve indentation)
        guard_line = lines[guard_idx]
        indent = re.match(r'^(\s*)', guard_line).group(1)
        
        # Remove the guard from its original position
        new_lines = lines[:guard_idx] + lines[guard_idx + 1:]
        
        # Adjust insert_after since we removed a line before it
        insert_after -= 1  # because we removed the guard line which was before
        
        # Insert after the last hook
        new_lines.insert(insert_after + 1, indent + 'if (!resolvedTheme) return null;')
        
        new_content = '\n'.join(new_lines)
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        rel = os.path.relpath(fpath, FRONTEND_ROOT)
        fixed += 1
        
print(f'Fixed {fixed} files')
if skipped:
    print(f'Skipped {len(skipped)} files:')
    for s in skipped:
        print(f'  {s}')
