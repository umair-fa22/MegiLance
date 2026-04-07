// @AI-HINT: Tools directory
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
