const fs = require('fs');
const path = require('path');

const writePage = (dir, content) => {
  const file = path.join(__dirname, 'frontend/app/(main)', dir, 'page.tsx');
  fs.writeFileSync(file, content, 'utf8');
};

// GIGS
writePage('gigs', `// @AI-HINT: Gigs directory - predefined services
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
`);

// JOBS
writePage('jobs', `// @AI-HINT: Jobs directory - custom client projects
import React, { Suspense } from 'react';
import commonStyles from './Jobs.common.module.css';

async function fetchJobs() {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [
    { id: '1', title: 'Need a React Native App for E-commerce', budget: '$2,000 - $3,000', type: 'Fixed Price', duration: '1-3 Months', skills: ['React Native', 'TypeScript', 'Redux', 'Stripe'], client: 'Startup Inc', verified: true, posted: '2 hours ago' },
    { id: '2', title: 'Python Backend Developer for AI Platform API', budget: '$40-$60/hr', type: 'Hourly', duration: '3-6 Months', skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'], client: 'TechNova', verified: true, posted: '5 hours ago' },
  ];
}

export default async function JobsPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header}>
        <h1 className={commonStyles.title}>Find Freelance Jobs</h1>
        <p className={commonStyles.subtitle}>Apply to open projects and build your freelance business.</p>
      </header>

      <section className={commonStyles.results}>
        <Suspense fallback={<div className={commonStyles.loader}>Loading active jobs...</div>}>
          <JobList />
        </Suspense>
      </section>
    </main>
  );
}

async function JobList() {
  const jobs = await fetchJobs();
  if (jobs.length === 0) return <div className={commonStyles.empty}>No jobs found.</div>;

  return (
    <div className={commonStyles.list} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {jobs.map(j => (
        <article key={j.id} className={commonStyles.card} style={{ border: '1px solid #e2e8f0', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#0f172a' }}>{j.title}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>{j.type} - {j.duration} - Est. Budget: {j.budget}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Posted {j.posted}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {j.skills.map(s => (
              <span key={s} style={{ background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500, color: '#475569' }}>
                {s}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.875rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
               Client: {j.client} {j.verified && <span style={{ color:'#27ae60' }}>✔ Verified Payment</span>}
            </span>
            <button style={{ background: '#4573df', color: 'white', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
               Apply Now
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
`);

// EXPLORE
writePage('explore', `// @AI-HINT: Explore directory - comprehensive search across all platform entities
import React, { Suspense } from 'react';
import commonStyles from './Explore.common.module.css';

export default async function ExplorePage() {
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
          <button style={{ background: '#4573df', color: 'white', border: 'none', padding: '0 2rem', borderRadius: '999px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
             Search
          </button>
        </form>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍💻</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Top Talent</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Find the perfect specialist for your next big project.</p>
          <a href="/freelancers" style={{ color: '#4573df', fontWeight: 600, textDecoration: 'none' }}>Browse Freelancers &rarr;</a>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Services (Gigs)</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Fixed-price, ready-to-buy services from vetted pros.</p>
          <a href="/gigs" style={{ color: '#4573df', fontWeight: 600, textDecoration: 'none' }}>Browse Gigs &rarr;</a>
        </div>

        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Jobs</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Start pitching customized project requests tailored to you.</p>
          <a href="/jobs" style={{ color: '#4573df', fontWeight: 600, textDecoration: 'none' }}>Find Work &rarr;</a>
        </div>
      </section>
    </main>
  );
}
`);

console.log("Written Gigs, Jobs, and Explore pages");
