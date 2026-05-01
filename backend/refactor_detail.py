import os
import glob
import re

search_dirs = [
    'E:/MegiLance/backend/app/api',
    'E:/MegiLance/backend/app/services'
]

# We want to catch instances of:
# except Exception as e:
#     ... maybe some logger
#     raise HTTPException(status_code=500, detail=str(e))
#
# Also those without logger.

target_patterns = [
    re.compile(r'except Exception as e:\s*(?:logger\.[\w]+\([^\)]+\)\s*)?raise HTTPException\(status_code=500,\s*detail=(?:str\(e\)|f"\{e\}"|f"\{str\(e\)\}")\)', re.MULTILINE),
    re.compile(r'except Exception as e:\s*(?:logger\.[\w]+\([^\)]+\)\s*)?.*raise HTTPException\([^)]*detail=[^)]*e[^)]*\)', re.MULTILINE | re.DOTALL)
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
                
                # Check for bad patterns manually
                # We specifically want to fix exceptions that pass `e` into the HTTPException detail
                
                lines = content.split('\n')
                new_lines = []
                i = 0
                changed = False
                
                while i < len(lines):
                    line = lines[i]
                    if 'except Exception as e:' in line:
                        # Scan next few lines for raise HTTPException with detail=str(e)
                        j = i + 1
                        found_raise = False
                        
                        while j < len(lines) and j <= i + 5:
                            if 'except' in lines[j] or 'def ' in lines[j]:
                                break
                            
                            # Let's just simply replace detail=str(e) with detail="Internal server error"
                            if 'raise HTTPException' in lines[j] and ('str(e)' in lines[j] or '{e}' in lines[j]):
                                lines[j] = re.sub(r'detail=(?:str\(e\)|f"[^"]*\{e\}[^"]*"|f"[^"]*\{str\(e\)\}[^"]*")', 'detail="Internal server error"', lines[j])
                                lines[j] = re.sub(r'detail=e', 'detail="Internal server error"', lines[j])
                                changed = True
                            j += 1
                            
                    new_lines.append(lines[i])
                    i += 1

                if changed:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write('\n'.join(new_lines))
                    total_replacements += 1
                    print(f"Patched {filepath}")

print(f"Total files patched: {total_replacements}")

