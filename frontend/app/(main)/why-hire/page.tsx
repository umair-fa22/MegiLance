// @AI-HINT: why-hire directory
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
