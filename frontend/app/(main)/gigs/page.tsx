// @AI-HINT: Gigs directory - predefined services
import React, { Suspense } from 'react';
import commonStyles from './Gigs.common.module.css';

async function fetchGigs() {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [
    { id: '1', title: 'I will design a modern Next.js landing page', price: '$150', delivery: '3 Days', author: 'Sarah Design', rating: 5.0, reviews: 34, image: '🎨' },
    { id: '2', title: 'I will setup your Turso libSQL database', price: '$80', delivery: '1 Day', author: 'Alex Developer', rating: 4.8, reviews: 12, image: '🗄️' },
  ];
}

export default async function GigsPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header}>
        <h1 className={commonStyles.title}>Explore Services (Gigs)</h1>
        <p className={commonStyles.subtitle}>Pre-packaged services from top freelancers with clear pricing and delivery times.</p>
      </header>

      <section className={commonStyles.results}>
        <Suspense fallback={<div className={commonStyles.loader}>Loading gigs...</div>}>
          <GigList />
        </Suspense>
      </section>
    </main>
  );
}

async function GigList() {
  const gigs = await fetchGigs();
  if (gigs.length === 0) return <div className={commonStyles.empty}>No gigs found.</div>;

  return (
    <div className={commonStyles.grid} style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {gigs.map(g => (
        <article key={g.id} className={commonStyles.card} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '160px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
            {g.image}
          </div>
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>{g.author}</span>
              <span style={{ fontSize: '0.875rem' }}>⭐ {g.rating} ({g.reviews})</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', lineHeight: 1.4 }}>{g.title}</h3>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontWeight: 'bold', fontSize:'1.25rem' }}>{g.price}</span>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{g.delivery}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
