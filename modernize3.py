import os
import re

files = [
    r'E:\MegiLance\frontend\app\components\organisms\Header\Header.tsx',
    r'E:\MegiLance\frontend\app\components\organisms\Sidebar\Sidebar.tsx',
    r'E:\MegiLance\frontend\app\components\organisms\Footer\Footer.tsx',
    r'E:\MegiLance\frontend\app\components\templates\Layout\PublicHeader\PublicHeader.tsx',
    r'E:\MegiLance\frontend\app\components\templates\Layout\PublicFooter\PublicFooter.tsx'
]

css_glass_common = '''
/* 2026 Premium Aesthetics */
.header, .sidebar, .footer {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.sidebar { border-right: 1px solid rgba(255,255,255,0.1); border-bottom: none; }
'''

css_glass_light = '''
.header, .sidebar, .footer {
    background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.7) 100%);
    border-color: rgba(226,232,240,0.5);
}
'''

css_glass_dark = '''
.header, .sidebar, .footer {
    background: linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(2,6,23,0.95) 100%);
    border-color: rgba(255,255,255,0.08);
}
'''

for tsx_path in files:
    if not os.path.exists(tsx_path): continue
    
    with open(tsx_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Wrap inner text elements of links/anchors with motion.span 
    # Also add framer-motion type: 'spring' as const
    if 'from "framer-motion"' not in content and "from 'framer-motion'" not in content:
        content = content.replace("import React", "import React\nimport { motion, AnimatePresence } from 'framer-motion';")
        if "import { motion" not in content:
            content = "import { motion, AnimatePresence } from 'framer-motion';\n" + content

    # Upgrade native tags to motion tags
    content = re.sub(r'<header(\s)', r'<motion.header\1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: \'spring\' as const, stiffness: 200, damping: 20 }} ', content, count=1)
    content = re.sub(r'</header>', r'</motion.header>', content, count=1)
    
    content = re.sub(r'<aside(\s)', r'<motion.aside\1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: \'spring\' as const, stiffness: 200, damping: 20 }} ', content, count=1)
    content = re.sub(r'</aside>', r'</motion.aside>', content, count=1)
    
    content = re.sub(r'<footer(\s)', r'<motion.footer\1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: \'spring\' as const, stiffness: 200, damping: 20 }} ', content, count=1)
    content = re.sub(r'</footer>', r'</motion.footer>', content, count=1)

    # Add floating/interactive feel to Link/a
    content = re.sub(
        r'(<Link [^>]*?>)\s*([\w\s]+)\s*(</Link>)',
        r'\g<1><motion.span whileHover={{ y: -2, scale: 1.05 }} transition={{ type: \'spring\' as const, stiffness: 400, damping: 10 }}>\g<2></motion.span>\g<3>',
        content
    )
    content = re.sub(
        r'(<a [^>]*?>)\s*([\w\s]+)\s*(</a>)',
        r'\g<1><motion.span whileHover={{ y: -2, scale: 1.05 }} transition={{ type: \'spring\' as const, stiffness: 400, damping: 10 }}>\g<2></motion.span>\g<3>',
        content
    )

    with open(tsx_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    # Overwrite CSS specific lines
    d = os.path.dirname(tsx_path)
    name = os.path.basename(tsx_path).replace('.tsx', '')
    
    common = os.path.join(d, f'{name}.common.module.css')
    light = os.path.join(d, f'{name}.light.module.css')
    dark = os.path.join(d, f'{name}.dark.module.css')
    
    for css_path, append_css in [(common, css_glass_common), (light, css_glass_light), (dark, css_glass_dark)]:
        if os.path.exists(css_path):
            with open(css_path, 'r', encoding='utf-8') as f:
                c = f.read()
            if '/* 2026 Premium Aesthetics */' not in c and 'background: linear-gradient' not in c:
                with open(css_path, 'a', encoding='utf-8') as f:
                    f.write('\n' + append_css)

print("SUCCESS")