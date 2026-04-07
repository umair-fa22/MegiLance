const fs = require('fs');
const path = require('path');

const mainDir = path.join(__dirname, 'frontend/app/(main)');
const dirs = fs.readdirSync(mainDir).filter(f => fs.statSync(path.join(mainDir, f)).isDirectory());

dirs.forEach(d => {
  if (['about', 'ai-matching', 'careers', 'categories', 'clients', 'community', 'compare', 'contact', 'cost-calculator', 'enterprise', 'explore', 'faq', 'features', 'freelancers', 'gigs', 'jobs', 'post-project', 'press', 'pricing', 'status', 'tools', 'why-hire'].includes(d)) {
    
    const componentName = d.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    
    const commonPath = path.join(mainDir, d, `${componentName}.common.module.css`);
    const lightPath = path.join(mainDir, d, `${componentName}.light.module.css`);
    const darkPath = path.join(mainDir, d, `${componentName}.dark.module.css`);

    if (!fs.existsSync(commonPath)) fs.writeFileSync(commonPath, `.container { min-height: 100vh; }\n.header { padding: 4rem 1rem; }\n.title { font-weight: 700; }\n`, 'utf8');
    if (!fs.existsSync(lightPath)) fs.writeFileSync(lightPath, `.container { background-color: var(--theme-bg, #ffffff); color: var(--theme-text, #0f172a); }\n`, 'utf8');
    if (!fs.existsSync(darkPath)) fs.writeFileSync(darkPath, `.container { background-color: var(--theme-bg, #0f172a); color: var(--theme-text, #f8fafc); }\n`, 'utf8');
  }
});
console.log('Missing CSS files generated');
