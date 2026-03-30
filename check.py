import os, re
broken = []
for root, dirs, files in os.walk('frontend'):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                matches = re.findall(r"import\s+\w+\s+from\s+['\"](\./[^'\"]+\.module\.css)['\"]", content)
                for css in matches:
                    css_path = os.path.normpath(os.path.join(root, css))
                    if not os.path.exists(css_path):
                        broken.append(f"{filepath} is missing {css}")
            except Exception as e:
                pass
for b in broken:
    print(b)
