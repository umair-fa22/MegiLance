import re

with open("frontend/app/globals.css", "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "/* Project-wide popup, dialog, popover, and chat overlay hardening."
end_marker = "/* Skip link for keyboard users */"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + "/* Global popup config removed to rely on custom 3-file CSS modules */\n\n" + content[end_idx:]
    with open("frontend/app/globals.css", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully patched globals.css")
else:
    print(f"Could not find boundaries. Start: {start_idx}, End: {end_idx}")
