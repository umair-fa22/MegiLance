import os
import re

files = [
    r'E:\MegiLance\frontend\app\components\organisms\Header\Header.tsx',
    r'E:\MegiLance\frontend\app\components\organisms\Sidebar\Sidebar.tsx',
    r'E:\MegiLance\frontend\app\components\organisms\Footer\Footer.tsx',
    r'E:\MegiLance\frontend\app\components\templates\Layout\PublicHeader\PublicHeader.tsx',
    r'E:\MegiLance\frontend\app\components\templates\Layout\PublicFooter\PublicFooter.tsx'
]

# We will just write a general transformation function or see what's in the files first.
for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        print(f'-- {os.path.basename(file)} --')
        print(f.read()[:500])

