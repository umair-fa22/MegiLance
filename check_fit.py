import os

with open('backend/app/services/matching_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()
    start = text.find('def _generate_fit_reason')
    if start != -1:
        print(text[start:start+1500])
