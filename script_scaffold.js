const fs = require('fs');
const path = require('path');

function scaffoldPage(dirPath, name) {
  fs.mkdirSync(dirPath, { recursive: true });
  
  fs.writeFileSync(path.join(dirPath, `${name}.common.module.css`), `.${name.toLowerCase()} { display: flex; flex-direction: column; padding: 4rem 2rem; min-height: 80vh; max-width: 1200px; margin: 0 auto; gap: 2rem; }`);
  fs.writeFileSync(path.join(dirPath, `${name}.light.module.css`), `.${name.toLowerCase()} { background: #ffffff; color: #0f172a; }`);
  fs.writeFileSync(path.join(dirPath, `${name}.dark.module.css`), `.${name.toLowerCase()} { background: transparent; color: #f8fafc; }`);
  
  const tsx = `// @AI-HINT: ${name} Page - Redesign from scratch. Uses rigorous 3-file CSS module system.
'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './${name}.common.module.css';
import lightStyles from './${name}.light.module.css';
import darkStyles from './${name}.dark.module.css';

export default function ${name}Page() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const themeStyles = (mounted && resolvedTheme === 'dark') ? darkStyles : lightStyles;

  return (
    <main className={cn(commonStyles.${name.toLowerCase()}, themeStyles.${name.toLowerCase()})}>
      <h1>${name} Explorer</h1>
      <div className="state-placeholder">
        <p>Awaiting live connection to the FastAPI layer...</p>
      </div>
    </main>
  );
}`;
  fs.writeFileSync(path.join(dirPath, `page.tsx`), tsx);
  console.log(`Created 3-file structure for ${name} at ${dirPath}`);
}

const pages = {
  'frontend/app/(main)/freelancers': 'Freelancers',
  'frontend/app/(main)/gigs': 'Gigs',
  'frontend/app/(main)/jobs': 'Jobs',
  'frontend/app/(main)/explore': 'Explore',
  'frontend/app/(main)/clients': 'Clients',
  'frontend/app/(main)/ai-matching': 'AIMatching',
  'frontend/app/(main)/cost-calculator': 'CostCalculator',
  'frontend/app/(main)/tools': 'Tools',
  'frontend/app/(main)/post-project': 'PostProject',
  'frontend/app/(main)/pricing': 'Pricing',
  'frontend/app/(main)/enterprise': 'Enterprise',
  'frontend/app/(main)/compare': 'Compare',
  'frontend/app/(main)/features': 'Features',
  'frontend/app/(main)/why-hire': 'WhyHire',
  'frontend/app/(main)/about': 'About',
  'frontend/app/(main)/contact': 'Contact',
  'frontend/app/(main)/faq': 'FAQ',
  'frontend/app/(main)/status': 'Status'
};

Object.entries(pages).forEach(([dir, name]) => scaffoldPage(path.resolve(__dirname, dir), name));
