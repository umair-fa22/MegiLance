const fs = require('fs');

const files = [
    'E:/MegiLance/frontend/app/(portal)/admin/dashboard/AdminDashboard.tsx',
    'E:/MegiLance/frontend/app/(portal)/client/dashboard/ClientDashboard.tsx',
    'E:/MegiLance/frontend/app/(portal)/freelancer/dashboard/Dashboard.tsx'
];

const variants = '\nconst containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };\nconst itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: \"spring\" as const, stiffness: 300, damping: 24 } } };\n';

for (let p of files) {
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes('from \"framer-motion\"')) {
     c = c.replace(/import React(.*?)(?=\n|;)/, 'import React;\nimport { motion } from \"framer-motion\";\n// ');
  }
  if (!c.includes('const containerVariants =')) {
     let m = c.match(/(\n\s*const [A-Z][a-zA-Z0-9_]*\s*=\s*\(\)\s*=>)/);
     if (m) c = c.replace(m[1], variants + m[1]);
     else {
        let m2 = c.match(/(\n\s*const [A-Z][a-zA-Z0-9_]*\s*:\s*React\.FC.*?>)/);
        if (m2) c = c.replace(m2[1], variants + m2[1]);
     }
  }
  c = c.replace(/<StaggerContainer([^>]*)>/g, '<motion.div variants={containerVariants} initial=\"hidden\" animate=\"show\" className={commonStyles.motionWrapper} >');
  c = c.replace(/<\/StaggerContainer>/g, '</motion.div>');
  c = c.replace(/<StaggerItem([^>]*)>/g, '<motion.div variants={itemVariants} className={commonStyles.cardHover} >');
  c = c.replace(/<\/StaggerItem>/g, '</motion.div>');
  fs.writeFileSync(p, c);
  console.log('Updated ' + p);
}
