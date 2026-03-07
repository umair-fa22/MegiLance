import re, os
from PIL import Image

with open("create_docx.py") as f:
    content = f.read()

# Extract zephyr function
start = content.find("def create_zephyr_assignment")
func_code = content[start:]

# Find all screenshot filenames
matches = re.findall(r'["\']([\w\-]+\.png)["\']\)', func_code)

print("=== Screenshots referenced in create_zephyr_assignment() ===")
missing = []
bad = []
for m in matches:
    path = os.path.join("screenshots", m)
    if not os.path.exists(path):
        print(f"  [MISSING] {m}")
        missing.append(m)
        continue
    sz = os.path.getsize(path)
    try:
        img = Image.open(path)
        w, h = img.size
        print(f"  [OK] {m:40s} {sz//1024:>4d}KB  {w}x{h}")
        if sz < 10240:  # < 10KB likely bad
            bad.append((m, "too small"))
        if w < 200 or h < 100:
            bad.append((m, f"tiny dimensions {w}x{h}"))
    except Exception as e:
        print(f"  [BAD] {m:40s} {e}")
        bad.append((m, str(e)))

print(f"\nTotal referenced: {len(matches)}")
print(f"Missing: {len(missing)}")
print(f"Bad quality: {len(bad)}")
if missing:
    print("MISSING:", missing)
if bad:
    print("BAD:", bad)
