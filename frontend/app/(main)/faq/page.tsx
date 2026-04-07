// @AI-HINT: FAQ directory
import React from 'react';
import commonStyles from './FAQ.common.module.css';

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
