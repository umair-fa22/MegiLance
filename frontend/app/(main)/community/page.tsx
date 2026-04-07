// @AI-HINT: Community directory - events, forums and resources
import React from 'react';
import commonStyles from './Community.common.module.css';

export default function CommunityPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>MegiLance Community</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Connect, learn, and grow alongside thousands of other freelancers and entrepreneurs.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 2rem' }}>
        <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💬</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Discord Server</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Join our active 24/7 chat to get advice, share wins, and find collaborators.</p>
          <button style={{ background: '#5865F2', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '999px', fontWeight: 600, cursor: 'pointer' }}>Join Discord</button>
        </div>
        <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Virtual Events</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Weekly workshops on pitching, pricing, and leveraging AI in your workflow.</p>
          <button style={{ background: '#0f172a', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '999px', fontWeight: 600, cursor: 'pointer' }}>View Calendar</button>
        </div>
        <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Resource Hub</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Free templates for contracts, proposals, and project management.</p>
          <button style={{ background: '#4573df', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '999px', fontWeight: 600, cursor: 'pointer' }}>Access Resources</button>
        </div>
      </section>
    </main>
  );
}
