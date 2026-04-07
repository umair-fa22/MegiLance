import os

components_dir = r"E:\MegiLance\frontend\app\components"
count = 0
for root, dirs, files in os.walk(components_dir):
    has_css = any(f.endswith('.css') for f in files)
    if has_css:
        has_common = any(f.endswith('.common.module.css') for f in files)
        has_light = any(f.endswith('.light.module.css') for f in files)
        has_dark = any(f.endswith('.dark.module.css') for f in files)
        
        if not (has_common and has_light and has_dark):
            print(f"Incomplete CSS module system in: {root}")
            count += 1
            if not has_common: print("  Missing: common")
            if not has_light: print("  Missing: light")
            if not has_dark: print("  Missing: dark")

print(f"Total incomplete components: {count}")
print("Done check.")
