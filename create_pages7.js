const fs = require('fs');
const path = require('path');

const writePage = (dir, content) => {
  const file = path.join(__dirname, 'frontend/app/(main)', dir, 'page.tsx');
  fs.writeFileSync(file, content, 'utf8');
};

writePage('features', `// @AI-HINT: Features directory
import React from 'react';
import commonStyles from './Features.common.module.css';

export default function FeaturesPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Platform Features</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b' }}>Secure escrow, zero-friction milestones, and intelligent AI matching.</p>
      </header>
    </main>
  );
}
`);

writePage('press', `// @AI-HINT: Press directory
import React from 'react';
import commonStyles from './Press.common.module.css';

export default function PressPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem', background: '#0f172a', color: 'white' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Press & Media Kit</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#94a3b8' }}>Download logos, read our latest announcements, and contact our PR team.</p>
      </header>
    </main>
  );
}
`);

writePage('status', `// @AI-HINT: Status directory
import React from 'react';
import commonStyles from './Status.common.module.css';

export default function StatusPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>System Status</h1>
        <div style={{ padding: '2rem', background: '#e5fedf', color: '#166534', borderRadius: '12px', display: 'inline-block', fontWeight: 600 }}>
           All Systems Normal (API, Socket, Web)
        </div>
      </header>
    </main>
  );
}
`);

writePage('tools', `// @AI-HINT: Tools directory
import React from 'react';
import commonStyles from './Tools.common.module.css';

export default function ToolsPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem', background: '#0f172a', color: 'white' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Freelancer Tools</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#94a3b8' }}>Invoice generators, proposal templates, and time-tracking apps.</p>
      </header>
    </main>
  );
}
`);

writePage('why-hire', `// @AI-HINT: why-hire directory
import React from 'react';
import commonStyles from './WhyHire.common.module.css';

export default function WhyHirePage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Why Hire on MegiLance?</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b' }}>We handle compliance, escrow, and finding the top 1% so you can focus on building.</p>
      </header>
    </main>
  );
}
`);

// If external-projects exists
try { writePage('external-projects', '// @AI-HINT: external-projects\nexport default function External() { return <main>External Projects</main>; }'); } catch(e){}

console.log("Written Features, Press, Status, Tools, Why-Hire");
