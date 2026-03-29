import os

with open('backend/app/services/skill_analyzer_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()
    start = text.find('def analyze_skills')
    if start != -1:
        print(text[start:start+1000])
