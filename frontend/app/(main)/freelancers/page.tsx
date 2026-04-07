// @AI-HINT: Freelancers Page - Redesign. Next.js 16 Server Component with Suspense.
import React, { Suspense } from 'react';
import commonStyles from './Freelancers.common.module.css';

async function fetchFreelancers(query = '') {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/v1/freelancers/search?q=\${query}\`, { next: { revalidate: 60 } });
    // if (!res.ok) throw new Error('Failed to fetch data');
    // return await res.json();
    
    const all = [
      { id: '1', name: 'Alex Developer', title: 'Senior Full Stack Engineer', rate: '$55/hr', rating: 4.9, skills: ['React', 'Python', 'FastAPI'] },
      { id: '2', name: 'Sarah Design', title: 'UI/UX Product Designer', rate: '$45/hr', rating: 5.0, skills: ['Figma', 'Prototyping', 'CSS'] },
      { id: '3', name: 'Mike Content', title: 'Technical Copywriter', rate: '$30/hr', rating: 4.8, skills: ['SEO', 'Blogging', 'Editing'] },
      { id: '4', name: 'Nina Data', title: 'Data Scientist', rate: '$70/hr', rating: 4.7, skills: ['Machine Learning', 'Pandas', 'SQL'] },
    ];
    
    if (query) { return all.filter(f => f.skills.some(s => s.toLowerCase().includes(query.toLowerCase())) || f.name.toLowerCase().includes(query.toLowerCase())); }
    return all;
  } catch (error) { return []; }
}

function Loader() {
  return (
    <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {[1, 2, 3, 4].map(n => (<div key={n} style={{ height: '240px', background: '#e2e8f0', borderRadius: '12px', animation: 'pulse 2s infinite' }}></div>))}
    </div>
  );
}

export default async function FreelancersPage(props: { searchParams?: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams?.q || '';
  
  return (
    <main className={commonStyles.freelancers}>
      <header className={commonStyles.pageHeader}>
        <h1 className={commonStyles.pageTitle}>Find Top Freelance Talent</h1>
        <p className={commonStyles.pageSubtitle}>Discover the perfect match for your next project with our AI-powered matchmaking algorithm.</p>
        
        <form action="/freelancers" method="GET" className={commonStyles.searchForm}>
          <input type="search" name="q" defaultValue={q} placeholder="Search skills..." className={commonStyles.searchInput} />
          <button type="submit" className={commonStyles.searchSubmit}>Search</button>
        </form>
      </header>

      <div className={commonStyles.contentGrid}>
        <aside className={commonStyles.sidebar}>
          <div className={commonStyles.filterGroup}>
            <h3>Category</h3>
            <label className={commonStyles.checkboxLabel}><input type="checkbox" /> Web Development</label>
            <label className={commonStyles.checkboxLabel}><input type="checkbox" /> Design</label>
          </div>
        </aside>

        <section className={commonStyles.results}>
          <Suspense fallback={<Loader />} key={q}>
            <FreelancerList query={q} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

async function FreelancerList({ query }: { query: string }) {
  const freelancers = await fetchFreelancers(query);
  if (freelancers.length === 0) return <div className={commonStyles.emptyState}>No freelancers found.</div>;

  return (
    <div className={commonStyles.grid}>
      {freelancers.map(f => (
        <article key={f.id} className={commonStyles.card}>
          <div className={commonStyles.cardHeader}>
            <div className={commonStyles.avatar}>{f.name.charAt(0)}</div>
            <div className={commonStyles.cardMeta}><h2>{f.name}</h2><p>{f.title}</p></div>
          </div>
          <div className={commonStyles.cardBody}>
            <div className={commonStyles.stats}><span>{f.rate}</span><span>⭐ {f.rating}</span></div>
            <div className={commonStyles.skills}>{f.skills.map(s => <span key={s} className={commonStyles.skillBadge}>{s}</span>)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}