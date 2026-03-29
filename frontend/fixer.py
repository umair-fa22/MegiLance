import os
from pathlib import Path

replacements = {
    "from '@/app/components/Loading/Loading'": "from '@/app/components/atoms/Loading/Loading'",
    "import Loading from '@/app/components/Loading/Loading'": "import Loading from '@/app/components/atoms/Loading/Loading'",
    "import MegaLoader from '../components/Loading/MegaLoader'": "import MegaLoader from '@/app/components/atoms/Loading/MegaLoader'",
    "from '@/app/components/Loading/MegaLoader'": "from '@/app/components/atoms/Loading/MegaLoader'",
    "'@/components/Animations'": "'@/app/components/Animations'",
    "from '@/components/pricing/PricingCard/PricingCard'": "from '@/app/components/organisms/PricingCard/PricingCard'",
    "from '@/app/components/Select/Select'": "from '@/app/components/molecules/Select/Select'",
    "import Select from '@/app/components/Select/Select'": "import Select from '@/app/components/molecules/Select/Select'",
}

fixes = 0
for root, dirs, files in os.walk(r'E:\MegiLance\frontend'):
    if 'node_modules' in root or '.next' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = Path(root) / file
            try:
                content = path.read_text(encoding='utf-8')
                new_content = content
                for old, new in replacements.items():
                    new_content = new_content.replace(old, new)
                
                new_content = new_content.replace("'@/app/components/Loading/Loading'", "'@/app/components/atoms/Loading/Loading'")
                new_content = new_content.replace('"@/app/components/Loading/Loading"', '"@/app/components/atoms/Loading/Loading"')
                new_content = new_content.replace("'@/app/components/Loading/MegaLoader'", "'@/app/components/atoms/Loading/MegaLoader'")
                new_content = new_content.replace("'@/app/components/Select/Select'", "'@/app/components/molecules/Select/Select'")
                new_content = new_content.replace('"@/app/components/Select/Select"', '"@/app/components/molecules/Select/Select"')

                if new_content != content:
                    path.write_text(new_content, encoding='utf-8')
                    fixes += 1
            except Exception as e:
                pass

print(f'Fixed {fixes} files!')
