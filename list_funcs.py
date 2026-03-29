import os
import re

files = [
    'backend/app/services/skill_analyzer_engine.py',
    'backend/app/services/proposal_writer_engine.py',
    'backend/app/services/price_estimator_engine.py',
    'backend/app/services/matching_engine.py'
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            text = f.read()
            print(f"--- {file} ---")
            for m in re.finditer(r'def (\w+)\(', text):
                print("  " + m.group(1))
