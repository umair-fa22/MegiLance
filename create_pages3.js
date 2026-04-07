const fs = require('fs');
const path = require('path');

const writePage = (dir, content) => {
  const file = path.join(__dirname, 'frontend/app/(main)', dir, 'page.tsx');
  fs.writeFileSync(file, content, 'utf8');
};

writePage('pricing', `// @AI-HINT: Pricing directory - Memberships and platform fees
import React from 'react';
import commonStyles from './Pricing.common.module.css';

export default function PricingPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem 4rem' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: '#0f172a' }}>Transparent Pricing</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          No hidden fees. Simple flat rates and memberships designed to help you succeed.
        </p>
      </header>

      <section style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '2rem', flexWrap: 'wrap' }}>
        {/* Basic Tier */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '24px', padding: '3rem 2rem', width: '350px', background: 'white' }}>
           <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Basic</h2>
           <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Free</div>
           <p style={{ color: '#64748b', marginBottom: '2rem', minHeight: '48px' }}>Perfect for getting started and exploring the platform.</p>
           
           <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#334155' }}>
              <li>✔️ Create a free profile</li>
              <li>✔️ Apply to 10 jobs per month</li>
              <li>✔️ Standard AI matching</li>
              <li>✔️ 15% Platform fee on earnings</li>
           </ul>
           <button style={{ width: '100%', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '12px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
             Get Started
           </button>
        </div>

        {/* Pro Tier */}
        <div style={{ border: '2px solid #4573df', borderRadius: '24px', padding: '3rem 2rem', width: '350px', background: 'white', position: 'relative', transform: 'scale(1.05)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
           <div style={{ position: 'absolute', top: '-15px', right: '2rem', background: '#e81123', color: 'white', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 700 }}>MOST POPULAR</div>
           <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pro Freelancer</h2>
           <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>$19<span style={{ fontSize: '1.25rem', fontWeight: 400, color: '#64748b' }}>/mo</span></div>
           <p style={{ color: '#64748b', marginBottom: '2rem', minHeight: '48px' }}>For serious professionals looking to maximize earnings.</p>
           
           <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#334155' }}>
              <li>✔️ Premium profile placement</li>
              <li>✔️ Unlimited job applications</li>
              <li>✔️ Priority AI matching</li>
              <li>✔️ Reduced 8% Platform fee</li>
              <li>✔️ Analytics & Insights</li>
           </ul>
           <button style={{ width: '100%', background: '#4573df', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
             Upgrade to Pro
           </button>
        </div>
      </section>

      <section style={{ padding: '6rem 2rem', textAlign: 'center', background: '#f8fafc', marginTop: '4rem' }}>
         <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Interested in Enterprise Solutions?</h2>
         <p style={{ color: '#64748b', marginBottom: '2rem' }}>We offer custom hiring plans and dedicated account managers for large teams.</p>
         <button style={{ background: '#0f172a', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '999px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
           Contact Sales
         </button>
      </section>
    </main>
  );
}
`);

writePage('categories', `// @AI-HINT: Categories directory - browse jobs/gigs by macro-categories
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
`);

console.log("Written Categories and Pricing pages");
