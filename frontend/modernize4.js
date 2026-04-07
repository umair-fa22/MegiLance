const fs = require('fs');

const badges = [
  'E:/MegiLance/frontend/app/components/atoms/Badge/Badge.tsx', 
  'E:/MegiLance/frontend/components/ui/StatusBadge.tsx'
];

badges.forEach(f => {
  if (fs.existsSync(f)) {
    let str = fs.readFileSync(f, 'utf8');
    if (!str.includes('framer-motion')) {
      str = str.replace(/import React/, "import React\nimport { motion } from 'framer-motion'");
      str = str.replace(/<span\b/g, '<motion.span whileHover={{ scale: 1.05 }} transition={{ type: "spring" as const }}');
      str = str.replace(/<\/span>/g, '</motion.span>');
      fs.writeFileSync(f, str, 'utf-8');
    }
  }
});

const tables = [
  'E:/MegiLance/frontend/app/components/molecules/Table/Table.tsx', 
  'E:/MegiLance/frontend/components/ui/DataTable.tsx'
];

tables.forEach(f => {
  if (fs.existsSync(f)) {
    let str = fs.readFileSync(f, 'utf8');
    if (!str.includes('framer-motion')) {
      str = str.replace(/import React/, "import React\nimport { motion } from 'framer-motion'");
      str = str.replace(/<tr\b/g, '<motion.tr initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring" as const }}');
      str = str.replace(/<\/tr>/g, '</motion.tr>');
      fs.writeFileSync(f, str, 'utf-8');
    }
  }
});
console.log('Update done');
