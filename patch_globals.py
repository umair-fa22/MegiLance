import re

with open("frontend/app/globals.css", "r", encoding="utf-8") as f:
    content = f.read()

# Instead of regex that might miss due to newlines, let's process lines
lines = content.split('\n')
new_lines = []
skip = False
for line in lines:
    if "Project-wide popup, dialog, popover, and chat overlay hardening" in line:
        skip = True
    
    # End skipping when we reach the dark theme section
    if skip and "@theme {" in line:
        skip = False
        
    if not skip:
        new_lines.append(line)

with open("frontend/app/globals.css", "w", encoding="utf-8") as f:
    f.write('\n'.join(new_lines))
    
print("done")
