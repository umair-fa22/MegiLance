// @AI-HINT: Enterprise directory - tailored solutions for large teams
import React from 'react';
import commonStyles from './Enterprise.common.module.css';

export default function EnterprisePage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.hero} style={{ background: '#0f172a', padding: '6rem 2rem', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <p style={{ color: '#4573df', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>MEGILANCE FOR TEAMS</p>
        <h1 style={{ fontSize: '3.5rem', maxWidth: '800px', margin: '0 0 1.5rem', lineHeight: 1.2 }}>
           Scale your workforce effortlessly with Enterprise talent.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', marginBottom: '2.5rem' }}>
           Consolidated billing, dedicated account managers, and compliance tracking for large organizations shipping modern software.
        </p>
        <button style={{ background: '#4573df', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '999px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
           Contact Sales Team
        </button>
      </header>

      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            <div>
               <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
               <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Compliance & Security</h3>
               <p style={{ color: '#64748b', lineHeight: 1.6 }}>Enterprise-grade onboarding, SLA guarantees, and strict NDA/IP protections baked into every contract.</p>
            </div>
            <div>
               <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💳</div>
               <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Consolidated Invoicing</h3>
               <p style={{ color: '#64748b', lineHeight: 1.6 }}>Manage hundreds of freelancers across multiple departments under one monthly invoice.</p>
            </div>
            <div>
               <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤝</div>
               <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Dedicated Support</h3>
               <p style={{ color: '#64748b', lineHeight: 1.6 }}>Get a dedicated Success Manager who helps you source, interview, and manage talent pools.</p>
            </div>
         </div>
      </section>
    </main>
  );
}
