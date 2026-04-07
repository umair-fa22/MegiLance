// @AI-HINT: Clients directory - for companies looking to hire talent
import React from 'react';
import commonStyles from './Clients.common.module.css';

export default function ClientsPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.hero} style={{ background: '#0f172a', color: 'white', padding: '6rem 2rem', textAlign: 'center', borderRadius: '0 0 40px 40px' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', maxWidth: '800px', margin: '0 auto 1.5rem' }}>
          Hire the top 1% of freelance talent.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          MegiLance connects you with vetted professionals for your most important projects. Scale your team on demand.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button style={{ background: '#4573df', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '999px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
             Post a Job
          </button>
          <button style={{ background: 'transparent', color: 'white', border: '2px solid #475569', padding: '1rem 2rem', borderRadius: '999px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
             Browse Talent
          </button>
        </div>
      </header>

      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>Why companies choose MegiLance</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
             <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>AI Matching</h3>
             <p style={{ color: '#64748b', lineHeight: 1.6 }}>Our AI algorithms analyze your project requirements and instantly match you with the best candidates.</p>
          </div>
          <div style={{ padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
             <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Vetted Talent</h3>
             <p style={{ color: '#64748b', lineHeight: 1.6 }}>Every freelancer goes through a rigorous screening process to ensure high-quality delivery.</p>
          </div>
          <div style={{ padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
             <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Secure Payments</h3>
             <p style={{ color: '#64748b', lineHeight: 1.6 }}>Payment is held safely in escrow until you approve the work. Milestone-based tracking available.</p>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 2rem', background: '#f8fafc', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ready to build something amazing?</h2>
        <button style={{ background: '#4573df', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '999px', fontSize: '1.25rem', fontWeight: 600, cursor: 'pointer' }}>
          Sign up as a Client
        </button>
      </section>
    </main>
  );
}
