// @AI-HINT: Post Project directory
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
