// @AI-HINT: Compare directory
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
