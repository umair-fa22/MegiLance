const fs = require('fs');
const files = [
    'E:/MegiLance/frontend/app/(portal)/admin/dashboard/AdminDashboard.tsx',
    'E:/MegiLance/frontend/app/(portal)/client/dashboard/ClientDashboard.tsx',
    'E:/MegiLance/frontend/app/(portal)/freelancer/dashboard/Dashboard.tsx'
];
files.forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/import React(.*?);\nimport \{ motion \} from "framer-motion";\n\/\/ \s*from 'react';/, 'import React from "react";\nimport { motion } from "framer-motion";');
  fs.writeFileSync(p, c);
  console.log('Fixed', p);
});
