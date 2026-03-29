import re
import os
from pathlib import Path

def find_actual_path(module_name):
    # Just hardcode the fixes we saw
    if module_name == '@/components/Animations':
        return '@/app/components/Animations'
    if module_name == '@/components/pricing/PricingCard/PricingCard':
        return '@/app/components/organisms/PricingCard/PricingCard' # let's check what it should be
    if module_name == '../components/organisms/PricingCard/PricingCard':
        return '@/app/components/organisms/PricingCard/PricingCard'
    if module_name == '../components/Loading/MegaLoader':
        return '../../app/components/organisms/Loading/MegaLoader'
    if module_name == '@/app/components/Loading/Loading':
        return '@/app/components/atoms/Loading/Loading'
    if module_name == '@/components/atoms/Loading/Loading':
        return '@/app/components/atoms/Loading/Loading'
    return None

error_pattern = re.compile(r"(.+?)\(\d+,\d+\): error TS2307: Cannot find module '([^']+)'")

corrections = {
    "@/components/Animations": "@/app/components/Animations",
    "../components/Loading/MegaLoader": "@/app/components/organisms/Loading/MegaLoader", # wait, where is mega loader? It's in Loader probably. We will find out.
    "@/app/components/Loading/Loading": "@/app/components/atoms/Loading/Loading",
}

def load_all_paths():
    base = Path(r"E:\MegiLance\frontend\app\components")
    paths = []
    for root, dirs, files in os.walk(base):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                paths.append(Path(root) / f)
    return paths

all_component_files = load_all_paths()
def search_in_components(filename):
    # e.g. "Loading.tsx"
    for p in all_component_files:
        if p.name == filename or p.stem == filename:
            # return relative path to 'app/components'
            rel = p.relative_to(Path(r"E:\MegiLance\frontend"))
            # e.g. app/components/atoms/Loading/Loading.tsx => @/app/components/atoms/Loading/Loading
            return f"@/{rel.parent}/{p.stem}".replace("\\", "/")
    return None

fixes_made = 0
with open("E:/MegiLance/frontend/tsc_errors.txt", "r", encoding="utf-8") as f:
    for line in f:
        match = error_pattern.search(line)
        if match:
            file_path = match.group(1).split("(")[0].strip()
            # on powershell, it might output app/(main)/...
            full_path = os.path.join(r"E:\MegiLance\frontend", file_path)
            bad_module = match.group(2)
            
            # Figure out replacement
            good_module = corrections.get(bad_module)
            if not good_module:
                # Try to fuzzy search What the path should be!
                # e.g. '@/components/Animations' -> search for 'Animations'
                parts = bad_module.split('/')
                target_file = parts[-1]
                found = search_in_components(target_file + ".tsx")
                if not found:
                    found = search_in_components(target_file + ".ts")
                if not found and target_file == 'Animations':
                    found = '@/app/components/Animations'

                if found:
                    good_module = found
                else:
                    # just change @/components/... to @/app/components/... as fallback
                    if bad_module.startswith("@/components/"):
                        good_module = bad_module.replace("@/components/", "@/app/components/")
                    else:
                        print(f"I don't know how to fix {bad_module} in {file_path}")
                        continue
            
            if good_module:
                # read file, replace
                try:
                    with open(full_path, "r", encoding="utf-8") as tf:
                        content = tf.read()
                    
                    # Exact string replace
                    new_content = content.replace(f"'{bad_module}'", f"'{good_module}'")
                    new_content = new_content.replace(f'"{bad_module}"', f'"{good_module}"')
                    
                    if content != new_content:
                        with open(full_path, "w", encoding="utf-8") as tf:
                            tf.write(new_content)
                        fixes_made += 1
                        print(f"Fixed {bad_module} -> {good_module} in {file_path}")
                except Exception as e:
                    print(f"Error touching {full_path}: {e}")

print(f"Made {fixes_made} fixes.")
