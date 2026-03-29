import glob
for filepath in glob.glob('backend/app/**/*.py', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
        if 'proposal_writer_engine' in text and not filepath.endswith('proposal_writer_engine.py'):
            print(f'{filepath} imports it')
