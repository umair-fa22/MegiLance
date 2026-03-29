import re

files_to_check = [
    r'e:\MegiLance\backend\app\services\proposal_writer_engine.py',
    r'e:\MegiLance\backend\app\services\skill_analyzer_engine.py',
    r'e:\MegiLance\backend\app\services\price_estimator_engine.py',
    r'e:\MegiLance\backend\app\services\matching_engine.py'
]

for filepath in files_to_check:
    print(f"--- {filepath[-30:]} ---")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
            if 'llm_gateway' in text:
                print("Already uses llm_gateway.")
            else:
                print("Missing llm_gateway. Methods:")
                for m in re.finditer(r'async def (\w+)', text):
                    print("  ", m.group(1))
    except Exception as e:
        print("Error:", e)
