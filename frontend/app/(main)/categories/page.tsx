// @AI-HINT: Categories directory - browse jobs/gigs by macro-categories
import React from 'react';
import commonStyles from './Categories.common.module.css';

export default function CategoriesPage() {
  const cats = [
    { title: 'Web Development', icon: '💻', count: '1,204 Jobs' },
    { title: 'Mobile Apps', icon: '📱', count: '850 Jobs' },
    { title: 'Data Science & AI', icon: '🧠', count: '430 Jobs' },
    { title: 'UI/UX Design', icon: '✨', count: '920 Jobs' },
    { title: 'Digital Marketing', icon: '📈', count: '1,100 Jobs' },
    { title: 'Writing & Translation', icon: '✍️', count: '650 Jobs' },
  ];

  return (
    <main className={commonStyles.container}>
      <header style={{ padding: '4rem 2rem', textAlign: 'center', background: '#0f172a', color: 'white' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Explore Categories</h1>
        <p style={{ fontSize: '1.25rem', color: '#cbd5e1' }}>Find skilled professionals by industry and niche.</p>
      </header>

      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
           {cats.map(c => (
              <a key={c.title} href="/explore" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '16px', transition: 'all 0.2s', cursor: 'pointer' }} className={commonStyles.categoryCard}>
                 <div style={{ fontSize: '3rem', background: '#f1f5f9', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px' }}>
                    {c.icon}
                 </div>
                 <div>
                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>{c.title}</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>{c.count}</p>
                 </div>
              </a>
           ))}
        </div>
      </section>
    </main>
  );
}
