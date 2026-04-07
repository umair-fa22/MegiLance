// @AI-HINT: Cost Calculator directory
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
