import os

with open("backend/app/services/ai_writing.py", "r", encoding="utf-8") as f:
    text = f.read()

import re

# Refactor `generate_profile_bio`
bio_pattern = r'def generate_profile_bio(.*?)return \{'
# We will use Python scripting to update the file instead of regex hell.

