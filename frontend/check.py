import os, glob
for f in glob.glob('E:/MegiLance/backend/app/api/v1/**/*.py', recursive=True):
    if os.path.isfile(f):
        with open(f, encoding='utf-8') as file:
            for i, l in enumerate(file):
                if 'turso.execute' in l and ('f"' in l or "f'" in l):
                    print(f"{f}:{i+1} {l.strip()}")
