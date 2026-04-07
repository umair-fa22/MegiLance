// @AI-HINT: Jobs directory - custom client projects
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
