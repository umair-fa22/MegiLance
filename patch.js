const fs = require('fs');
const files = [
    'E:/MegiLance/frontend/app/(portal)/admin/dashboard/AdminDashboard.tsx',
    'E:/MegiLance/frontend/app/(portal)/client/dashboard/ClientDashboard.tsx',
    'E:/MegiLance/frontend/app/(portal)/freelancer/dashboard/Dashboard.tsx'
];
const variants = 
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};
;
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('from "framer-motion"')) {
    c = c.replace('import React', 'import React from "react";\\nimport { motion } from "framer-motion";\\n//');
  }
  if (!c.includes('const containerVariants =')) {
    c = c.replace(/(\\n\\s*const \\w+\\s*=\\s*\\(\\)\\s*=>|\\n\\s*const \\w+\\s*:\\s*React\\.FC.*?=>)/, variants + '');
  }
  c = c.replace(/<StaggerContainer(.*?)>/g, '<motion.div variants={containerVariants} initial="hidden" animate="show" >');
  c = c.replace(/<\/StaggerContainer>/g, '</motion.div>');
  c = c.replace(/<StaggerItem(.*?)>/g, '<motion.div variants={itemVariants} className={commonStyles.cardHover} >');
  c = c.replace(/<\/StaggerItem>/g, '</motion.div>');
  fs.writeFileSync(f, c);
  console.log('Updated', f);
});
