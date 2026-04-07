const fs = require('fs');
const path = require('path');

const writePage = (dir, content) => {
  const file = path.join(__dirname, 'frontend/app/(main)', dir, 'page.tsx');
  fs.writeFileSync(file, content, 'utf8');
};

writePage('compare', `// @AI-HINT: Compare directory - competitive analysis
import React from 'react';
import commonStyles from './Compare.common.module.css';

export default function ComparePage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem 4rem', background: '#f8fafc' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>MegiLance vs The Rest</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          See why top companies are switching away from legacy platforms like Upwork and Fiverr.
        </p>
      </header>

      <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: 'white' }}>
              <th style={{ padding: '1.5rem', width: '40%', borderTopLeftRadius: '12px' }}>Feature</th>
              <th style={{ padding: '1.5rem', width: '30%', background: '#4573df' }}>MegiLance</th>
              <th style={{ padding: '1.5rem', width: '30%', borderTopRightRadius: '12px' }}>Legacy Platforms</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1.5rem', fontWeight: 600 }}>Platform Fees (Freelancer)</td>
              <td style={{ padding: '1.5rem', color: '#27ae60', fontWeight: 'bold' }}>8% - 15%</td>
              <td style={{ padding: '1.5rem', color: '#e81123' }}>20% - 25%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1.5rem', fontWeight: 600 }}>AI Matching</td>
              <td style={{ padding: '1.5rem', color: '#27ae60', fontWeight: 'bold' }}>Advanced (Zero friction)</td>
              <td style={{ padding: '1.5rem', color: '#e81123' }}>Basic (Keyword search)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '1.5rem', fontWeight: 600 }}>Tech Stack Optimization</td>
              <td style={{ padding: '1.5rem', color: '#27ae60', fontWeight: 'bold' }}>Next.js / FastAPI / Turso</td>
              <td style={{ padding: '1.5rem', color: '#e81123' }}>Legacy Monoliths</td>
            </tr>
            <tr>
              <td style={{ padding: '1.5rem', borderBottomLeftRadius: '12px', fontWeight: 600 }}>Client Processing Fee</td>
              <td style={{ padding: '1.5rem', color: '#27ae60', fontWeight: 'bold' }}>Flat 3%</td>
              <td style={{ padding: '1.5rem', color: '#e81123', borderBottomRightRadius: '12px' }}>5% + Hidden charges</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
`);

writePage('cost-calculator', `// @AI-HINT: Cost Calculator directory
import React from 'react';
import commonStyles from './CostCalculator.common.module.css';

export default function CostCalculatorPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem', background: '#0f172a', color: 'white' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Estimate Your Project Cost</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Get instant, AI-driven budget estimates for your next freelance project.
        </p>
      </header>

      <section style={{ maxWidth: '800px', margin: '4rem auto', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '24px', background: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '1.125rem', marginBottom: '1rem', color: '#334155' }}>
               Select Project Type:
            </label>
            <select style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: '#f8fafc' }}>
              <option>Web Application (Full Stack)</option>
              <option>Mobile App (React Native/Flutter)</option>
              <option>UI/UX Design Mockups</option>
              <option>SEO Strategy & Implementation</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '1.125rem', marginBottom: '1rem', color: '#334155' }}>
               Expected Complexity:
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button style={{ flexGrow: 1, padding: '1rem', border: '1px solid #4573df', background: '#eff6ff', color: '#1e3a8a', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Basic</button>
               <button style={{ flexGrow: 1, padding: '1rem', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Medium</button>
               <button style={{ flexGrow: 1, padding: '1rem', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Advanced</button>
            </div>
          </div>
          <div style={{ background: '#f1f5f9', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginTop: '1rem' }}>
             <h2 style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '0.5rem' }}>Estimated Budget Range</h2>
             <div style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a' }}>$3,500 - $5,000</div>
             <p style={{ marginTop: '1rem', color: '#334155', fontSize: '0.875rem' }}>Based on recent MegiLance platform data. Excludes platform processing fee.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
`);

writePage('faq', `// @AI-HINT: FAQ directory - help center questions
import React from 'react';
import commonStyles from './Faq.common.module.css';

export default function FaqPage() {
  const faqs = [
    { q: "How does MegiLance secure my payment?", a: "We use Stripe to safely hold funds in escrow until you approve the project milestone. The freelancer knows the money is secure, and you know the work will get done before releasing it." },
    { q: "What is your refund policy?", a: "If a freelancer fails to deliver or misses milestones entirely, you are entitled to a full refund for that milestone." },
    { q: "Are freelancers verified?", a: "Yes, every freelancer goes through identity verification and skill assessments before taking on jobs." },
    { q: "How do I communicate with my freelancer?", a: "MegiLance provides a built-in real-time messaging system to keep all logs, file sharing, and communication secure and centralized." }
  ];

  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ textAlign: 'center', padding: '6rem 2rem', background: '#0f172a', color: 'white' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Frequently Asked Questions</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Everything you need to know about payment, security, and hiring.
        </p>
      </header>

      <section style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                 <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#0f172a' }}>{f.q}</h3>
                 <p style={{ color: '#475569', lineHeight: 1.6 }}>{f.a}</p>
              </div>
            ))}
         </div>
      </section>
    </main>
  );
}
`);

writePage('post-project', `// @AI-HINT: Post Project directory - public flow for non-authenticated clients to start job posting
import React from 'react';
import commonStyles from './PostProject.common.module.css';

export default function PostProjectPage() {
  return (
    <main className={commonStyles.container} style={{ minHeight: '100vh', background: '#f8fafc', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '24px', padding: '3rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Let's get started</h1>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '3rem' }}>Tell us what you need done, and our AI will match you with the right talent.</p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
             <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Project Title</label>
             <input type="text" placeholder="e.g. Build an e-commerce dashboard" style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} />
          </div>
          <div>
             <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Description</label>
             <textarea rows={5} placeholder="Describe the scope, deliverables, and timeline..." style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', resize: 'vertical' }}></textarea>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
             <div>
               <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Budget Range</label>
               <select style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}>
                 <option>Less than $500</option>
                 <option>$500 - $2,500</option>
                 <option>$2,500 - $10,000</option>
                 <option>$10,000+</option>
               </select>
             </div>
             <div>
               <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Required Skills</label>
               <input type="text" placeholder="React, Node, Figma..." style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} />
             </div>
          </div>
          <button style={{ background: '#4573df', color: 'white', padding: '1rem', border: 'none', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>
             Create Account & Post Project
          </button>
        </form>
      </div>
    </main>
  );
}
`);

console.log("Written Compare, Cost Calculator, FAQ, and Post Project pages");
