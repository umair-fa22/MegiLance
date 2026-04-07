import os
import re

files = [
    r'E:\MegiLance\frontend\app\components\atoms\Badge\Badge.tsx',
    r'E:\MegiLance\frontend\components\ui\StatusBadge.tsx',
    r'E:\MegiLance\frontend\app\components\molecules\Table\Table.tsx',
    r'E:\MegiLance\frontend\components\ui\DataTable.tsx'
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Add framer motion import if not present
        if 'from \"framer-motion\"' not in content and \"from 'framer-motion'\" not in content:
            content = content.replace(\"import React\", \"import React\\nimport { motion } from 'framer-motion';\")
        
        if 'Table' in f or 'DataTable' in f:
            content = re.sub(r'<tr([\s>])', r'<motion.tr initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ type: \'spring\' as const, duration: 0.4 }} viewport={{ once: true }}\\1', content)
            content = content.replace('</tr>', '</motion.tr>')
            
        if 'Badge' in f:
            content = re.sub(r'<span([\s>])', r'<motion.span whileHover={{ scale: 1.05, boxShadow: \"0 0 8px rgba(255,255,255,0.5)\" }} transition={{ type: \'spring\' as const, stiffness: 300 }}\\1', content)
            content = content.replace('</span>', '</motion.span>')
            
            content = re.sub(r'<div([\s>])', r'<motion.div whileHover={{ scale: 1.05, boxShadow: \"0 0 8px rgba(255,255,255,0.5)\" }} transition={{ type: \'spring\' as const, stiffness: 300 }}\\1', content)
            content = content.replace('</div>', '</motion.div>')

        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)

print('Updated successfully')
