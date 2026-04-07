// @AI-HINT: AI Matching directory - Showcase platform's AI capabilities
import React from 'react';
import commonStyles from './AIMatching.common.module.css';

export default function AiMatchingPage() {
  return (
    <main className={commonStyles.container}>
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: 'white', padding: '2rem' }}>
        <div style={{ maxWidth: '800px', textAlign: 'center' }}>
           <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              🤖 Powered by Advanced Machine Learning
           </div>
           <h1 style={{ fontSize: '4.5rem', fontWeight: 800, marginBottom: '2rem', lineHeight: 1.1, background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
             Smart Talent Discovery
           </h1>
           <p style={{ fontSize: '1.5rem', color: '#cbd5e1', marginBottom: '3rem', lineHeight: 1.6 }}>
             Stop scrolling through endless profiles. Tell our AI what you need to build, and it will instantly compile a shortlist of the perfect freelancers for the job based on past performance, skills, and success rates.
           </p>
           
           <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', display: 'flex', gap: '1rem' }}>
              <input type="text" placeholder="e.g. I need a Next.js developer who knows Turso..." style={{ flexGrow: 1, padding: '1rem 1.5rem', fontSize: '1.125rem', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
              <button style={{ background: '#4573df', color: 'white', border: 'none', padding: '0 2rem', borderRadius: '12px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
                 Match Me
              </button>
           </div>
        </div>
      </div>
    </main>
  );
}
