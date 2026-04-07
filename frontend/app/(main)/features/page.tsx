// @AI-HINT: Features directory
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
