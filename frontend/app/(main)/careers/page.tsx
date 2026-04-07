// @AI-HINT: Careers directory - MegiLance internal job openings
import React from 'react';
import commonStyles from './Careers.common.module.css';

export default function CareersPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ background: '#0f172a', color: 'white', padding: '6rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Join the MegiLance Team</h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Help us build the most advanced AI-powered freelancing platform in the world. We are global, remote-first, and moving fast.
        </p>
      </header>

      <section style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Open Roles</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <a href="#apply" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div>
               <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Senior Backend Engineer (Python/FastAPI)</h3>
               <p style={{ margin: 0, color: '#64748b' }}>Engineering • Remote (Global)</p>
             </div>
             <span style={{ color: '#4573df', fontWeight: 'bold' }}>Apply &rarr;</span>
           </a>

           <a href="#apply" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div>
               <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Next.js Frontend Architect</h3>
               <p style={{ margin: 0, color: '#64748b' }}>Engineering • Remote (US/EU)</p>
             </div>
             <span style={{ color: '#4573df', fontWeight: 'bold' }}>Apply &rarr;</span>
           </a>

           <a href="#apply" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div>
               <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>AI/ML Engineer (Talent Matching)</h3>
               <p style={{ margin: 0, color: '#64748b' }}>Data Science • Remote (Global)</p>
             </div>
             <span style={{ color: '#4573df', fontWeight: 'bold' }}>Apply &rarr;</span>
           </a>
        </div>
      </section>
    </main>
  );
}
