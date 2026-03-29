filepath = r'e:\MegiLance\backend\app\services\advanced_ai.py'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i, line in enumerate(lines[573:592], start=574):
        print(f'{i}: {line.strip()}')
