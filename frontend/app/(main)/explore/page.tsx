// @AI-HINT: Explore directory - comprehensive search across all platform entities
import React, { Suspense } from 'react';
import Link from 'next/link';
import commonStyles from './Explore.common.module.css';

export default function ExplorePage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3rem', marginBottom: '1rem' }}>Explore MegiLance</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Discover top freelancers, ready-made services, and open jobs tailored to your skills.
        </p>
        
        <form style={{ marginTop: '2.5rem', display: 'flex', maxWidth: '800px', margin: '2.5rem auto 0', gap: '0.5rem' }}>
          <input 
             type="search" 
             placeholder="Search for skills, services, freelancers..."
             style={{ flexGrow: 1, padding: '1rem 1.5rem', fontSize: '1.125rem', borderRadius: '999px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <button type="submit" style={{ background: '#4573df', color: 'white', border: 'none', padding: '0 2rem', borderRadius: '999px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
            Search
          </button>
        </form>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍💻</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Top Talent</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Find the perfect specialist for your next big project.</p>
          <Link href="/freelancers" style={{ color: '#4573df', fontWeight: 600, textDecoration: 'none' }}>Browse Freelancers &rarr;</Link>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Services (Gigs)</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Fixed-price, ready-to-buy services from vetted pros.</p>
          <Link href="/gigs" style={{ color: '#4573df', fontWeight: 600, textDecoration: 'none' }}>Browse Gigs &rarr;</Link>
        </div>

        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Jobs</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start pitching customized project requests tailored to you.</p>
          <Link href="/jobs" style={{ color: '#4573df', fontWeight: 600, textDecoration: 'none' }}>Find Work &rarr;</Link>
        </div>
      </section>
    </main>
  );
}
