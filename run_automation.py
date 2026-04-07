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
.header, .sidebar, .footer, .publicHeader, .publicFooter {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.sidebar { border-right: 1px solid rgba(255,255,255,0.1); border-bottom: none; }
'''

css_glass_light = '''
.header, .sidebar, .footer, .publicHeader, .publicFooter {
    background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.7) 100%);
    border-color: rgba(226,232,240,0.5);
}
'''

css_glass_dark = '''
.header, .sidebar, .footer, .publicHeader, .publicFooter {
    background: linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(2,6,23,0.95) 100%);
    border-color: rgba(255,255,255,0.08);
}
'''

for tsx_path in files:
    if not os.path.exists(tsx_path): continue
    
    with open(tsx_path, 'r', encoding='utf-8') as f:
        content = f.read()

    already_has_framer = 'framer-motion' in content
    
    if not already_has_framer:
        if 'import React' in content:
            content = content.replace("import React", "import React\nimport { motion, AnimatePresence } from 'framer-motion';")
        else:
            content = "import { motion, AnimatePresence } from 'framer-motion';\n" + content

    # Add motion HTML tags
    # Ensure we use 'type: "spring" as const' ALWAYS to fulfill instructions literally
    
    # 1. Header 
    if '<header ' in content and '<motion.header ' not in content:
        content = content.replace('<header ', '<motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" as const, stiffness: 300, damping: 30 }} ')
        content = content.replace('</header>', '</motion.header>')
        
    # 2. Sidebar
    if '<aside ' in content and '<motion.aside ' not in content:
        content = content.replace('<aside\n', '<aside ')
        content = content.replace('<aside', '<motion.aside initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}')
        content = content.replace('</aside>', '</motion.aside>')

    # 3. Footer
    if '<footer ' in content and '<motion.footer ' not in content:
        content = content.replace('<footer ', '<motion.footer initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring" as const, stiffness: 300, damping: 30 }} ')
        content = content.replace('</footer>', '</motion.footer>')
        
    # Floating/interactive feel for Links and Anchors
    # We'll use split/join trick or regex if safe
    def wrap_link_text(m):
        link_open = m.group(1)
        text = m.group(2)
        link_close = m.group(3)
        if '<motion.span' in text or '<' in text:
            return m.group(0) # Keep unchanged if there's html inside
        return f'{link_open}<motion.span whileHover={{ y: -2, scale: 1.05 }} transition={{ type: "spring" as const, stiffness: 400, damping: 10 }}>{text}</motion.span>{link_close}'
    
    # Regex to wrap inner pure text of links
    content = re.sub(r'(<Link.*?>)\s*([^<]+?)\s*(</Link>)', wrap_link_text, content)
    content = re.sub(r'(<a.*?>)\s*([^<]+?)\s*(</a>)', wrap_link_text, content)
    
    with open(tsx_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    d = os.path.dirname(tsx_path)
    name = os.path.basename(tsx_path).replace('.tsx', '')
    
    def inject_css(css_path, append_str):
        if not os.path.exists(css_path):
            return
        with open(css_path, 'r', encoding='utf-8') as cf:
            c = c_text = cf.read()
        if 'blur(12px)' not in c_text and '180deg' not in c_text:
            with open(css_path, 'a', encoding='utf-8') as cf:
                cf.write('\\n' + append_str)
                
    inject_css(os.path.join(d, f'{name}.common.module.css'), css_glass_common)
    inject_css(os.path.join(d, f'{name}.light.module.css'), css_glass_light)
    inject_css(os.path.join(d, f'{name}.dark.module.css'), css_glass_dark)

print("Done")
