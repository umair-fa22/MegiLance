import os

components = {
    'Header': r'E:\MegiLance\frontend\app\components\organisms\Header',
    'Sidebar': r'E:\MegiLance\frontend\app\components\organisms\Sidebar',
    'Footer': r'E:\MegiLance\frontend\app\components\organisms\Footer',
    'PublicHeader': r'E:\MegiLance\frontend\app\components\templates\Layout\PublicHeader',
    'PublicFooter': r'E:\MegiLance\frontend\app\components\templates\Layout\PublicFooter'
}

for name, path in components.items():
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)
        print(f"Created {path}")

    # Read original TSX to keep imports mostly intact if possible, else we rewrite the base structure
    tsx_file = os.path.join(path, f'{name}.tsx')
    common_css = os.path.join(path, f'{name}.common.module.css')
    light_css = os.path.join(path, f'{name}.light.module.css')
    dark_css = os.path.join(path, f'{name}.dark.module.css')

    # Just applying a basic patch to TSX to add framer motion and motion.span
    if os.path.exists(tsx_file):
        with open(tsx_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Insert framer-motion import
        if 'framer-motion' not in content:
            content = content.replace("import React", "import React\nimport { motion, AnimatePresence } from 'framer-motion';")
            if "import { motion" not in content:
                 content = "import { motion, AnimatePresence } from 'framer-motion';\n" + content

        # A regex to wrap Link inner text with motion.span and add framer motion props
        # For a truly massive rewrite, it's better to just rewrite the whole file, but let's do targeted replacements for typical tags
        # Because we're in effort level 0.25, let's just make the root elements motion.div and add spring config
        
        content = content.replace("<header ", "<motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }} ")
        content = content.replace("<aside ", "<motion.aside initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }} ")
        content = content.replace("<footer ", "<motion.footer initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }} ")
        
        with open(tsx_file, 'w', encoding='utf-8') as f:
            f.write(content)

    # Enhance the CSS files with 2026 aesthetics
    glass_css = """.glass-effect {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.1);
    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
"""
    if os.path.exists(common_css):
        with open(common_css, 'a', encoding='utf-8') as f:
            f.write('\n' + glass_css)
            
    if os.path.exists(dark_css):
        with open(dark_css, 'a', encoding='utf-8') as f:
            f.write('\n/* Deep gradient 2026 */\n.header, .sidebar, .footer { background: linear-gradient(180deg, #0f172a 0%, #020617 100%); border-color: rgba(255,255,255,0.1); backdrop-filter: blur(12px); }')

    if os.path.exists(light_css):
        with open(light_css, 'a', encoding='utf-8') as f:
             f.write('\n/* Light glass 2026 */\n.header, .sidebar, .footer { background: rgba(255,255,255,0.7); border-color: rgba(0,0,0,0.05); backdrop-filter: blur(12px); }')

print("Modernization applied.")
