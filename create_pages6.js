const fs = require('fs');
const path = require('path');

const writePage = (dir, content) => {
  const file = path.join(__dirname, 'frontend/app/(main)', dir, 'page.tsx');
  fs.writeFileSync(file, content, 'utf8');
};

writePage('compare', `// @AI-HINT: Compare directory
import React from 'react';
import commonStyles from './Compare.common.module.css';

export default function ComparePage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem 4rem', background: '#f8fafc' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Platform Comparison</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Compare fees, matching technology, and infrastructure.
        </p>
      </header>
    </main>
  );
}
`);

writePage('cost-calculator', `// @AI-HINT: Cost Calculator directory
import React from 'react';
import commonStyles from './CostCalculator.common.module.css';

export default function CostCalculatorPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem', background: '#0f172a', color: 'white' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Estimate Cost</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Get instant estimates for projects.
        </p>
      </header>
    </main>
  );
}
`);

writePage('faq', `// @AI-HINT: FAQ directory
import React from 'react';
import commonStyles from './Faq.common.module.css';

export default function FaqPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem', background: '#0f172a', color: 'white' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Frequently Asked Questions</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Learn about our platform operations.
        </p>
      </header>
    </main>
  );
}
`);

writePage('post-project', `// @AI-HINT: Post Project directory
import React from 'react';
import commonStyles from './PostProject.common.module.css';

export default function PostProjectPage() {
  return (
    <main className={commonStyles.container} style={{ minHeight: '100vh', background: '#f8fafc', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '24px', padding: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Let's get started</h1>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '3rem' }}>Match with the right talent.</p>
      </div>
    </main>
  );
}
`);

console.log("Written Compare, Cost Calculator, FAQ, and Post Project pages successfully.");
