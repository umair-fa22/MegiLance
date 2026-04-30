import re

with open("frontend/app/globals.css", "r", encoding="utf-8") as f:
    content = f.read()

# We will remove from "/* Project-wide popup" until the end of that specific popup section.
# The section seems to end right before "@theme {" or similar. Let's find the exact text.
startIndex = content.find("/* Project-wide popup, dialog, popover, and chat overlay hardening.")
endIndex = content.find("@theme {")

if startIndex != -1 and endIndex != -1:
    new_content = content[:startIndex] + "\n/* Global popup rules removed to respect CSS modules */\n\n" + content[endIndex:]
    with open("frontend/app/globals.css", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully removed conflicting popup rules.")
else:
    print("Could not find boundaries", startIndex, endIndex)
