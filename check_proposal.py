import os

with open('backend/app/services/proposal_writer_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()
    start = text.find('def _compose_proposal')
    if start != -1:
        print(text[start:start+1500])
