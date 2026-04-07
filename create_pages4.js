const fs = require('fs');
const path = require('path');

const writePage = (dir, content) => {
  const file = path.join(__dirname, 'frontend/app/(main)', dir, 'page.tsx');
  fs.writeFileSync(file, content, 'utf8');
};

writePage('about', `// @AI-HINT: About directory - company mission and vision
import React from 'react';
import commonStyles from './About.common.module.css';

export default function AboutPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.hero} style={{ textAlign: 'center', padding: '6rem 2rem', background: '#0f172a', color: 'white', borderRadius: '0 0 40px 40px' }}>
        <h1 className={commonStyles.title} style={{ fontSize: '4rem', marginBottom: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>Empowering the Future of Independent Work</h1>
        <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '1.5rem auto 0' }}>
          MegiLance was built to remove the friction between exceptional talent and the companies that need them most.
        </p>
      </header>

      <section style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Our Mission</h2>
        <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#334155', marginBottom: '2rem' }}>
          We believe that talent is equally distributed globally, but opportunity is not. Our platform leverages advanced AI and scalable infrastructure to democratize access to high-quality freelance work. By eliminating traditional gatekeepers and opaque algorithms, we give power back to the creators, developers, designers, and writers who build the internet.
        </p>
        <p style={{ fontSize: '1.125rem', lineHeight: 1.8, color: '#334155' }}>
          Since our launch in 2025, MegiLance has facilitated thousands of successful projects. We pride ourselves on our transparent fee structure, robust Turso-backed database matching, and unwavering commitment to quality.
        </p>
      </section>

      <section style={{ background: '#f8fafc', padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>By the Numbers</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
           <div>
             <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#4573df' }}>150k+</div>
             <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Registered Freelancers</p>
           </div>
           <div>
             <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#4573df' }}>$50M+</div>
             <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Earned by Talent</p>
           </div>
           <div>
             <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#4573df' }}>99%</div>
             <p style={{ fontSize: '1.125rem', color: '#64748b' }}>Client Satisfaction Rate</p>
           </div>
        </div>
      </section>
    </main>
  );
}
`);

writePage('careers', `// @AI-HINT: Careers directory - MegiLance internal job openings
import React from 'react';
import commonStyles from './Careers.common.module.css';

export default function CareersPage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.header} style={{ background: '#0f172a', color: 'white', padding: '6rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Join the MegiLance Team</h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto' }}>
          Help us build the most advanced AI-powered freelancing platform in the world. We are global, remote-first, and moving fast.
        </p>
      </header>

      <section style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Open Roles</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <a href="#apply" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div>
               <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Senior Backend Engineer (Python/FastAPI)</h3>
               <p style={{ margin: 0, color: '#64748b' }}>Engineering • Remote (Global)</p>
             </div>
             <span style={{ color: '#4573df', fontWeight: 'bold' }}>Apply &rarr;</span>
           </a>

           <a href="#apply" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div>
               <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Next.js Frontend Architect</h3>
               <p style={{ margin: 0, color: '#64748b' }}>Engineering • Remote (US/EU)</p>
             </div>
             <span style={{ color: '#4573df', fontWeight: 'bold' }}>Apply &rarr;</span>
           </a>

           <a href="#apply" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div>
               <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', color: '#0f172a' }}>AI/ML Engineer (Talent Matching)</h3>
               <p style={{ margin: 0, color: '#64748b' }}>Data Science • Remote (Global)</p>
             </div>
             <span style={{ color: '#4573df', fontWeight: 'bold' }}>Apply &rarr;</span>
           </a>
        </div>
      </section>
    </main>
  );
}
`);

writePage('community', `// @AI-HINT: Community directory - events, forums and resources
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
`);

writePage('contact', `// @AI-HINT: Contact directory - support and sales contact forms
import React from 'react';
import commonStyles from './Contact.common.module.css';

export default function ContactPage() {
  return (
    <main className={commonStyles.container} style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
      <h1 className={commonStyles.title} style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>Contact Us</h1>
      <p className={commonStyles.subtitle} style={{ fontSize: '1.25rem', color: '#64748b', textAlign: 'center', marginBottom: '3rem' }}>
        Have a question or need help? Our support team is here for you.
      </p>

      <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#f8fafc', padding: '3rem', borderRadius: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
           <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>First Name</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
           </div>
           <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Last Name</label>
              <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
           </div>
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Email Address</label>
           <input type="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Subject</label>
           <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
              <option>General Inquiry</option>
              <option>Billing Support</option>
              <option>Technical Issue</option>
              <option>Report a User</option>
           </select>
        </div>
        <div>
           <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Message</label>
           <textarea rows={5} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
        </div>
        <button type="button" style={{ background: '#4573df', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>
           Send Message
        </button>
      </form>
    </main>
  );
}
`);

writePage('enterprise', `// @AI-HINT: Enterprise directory - tailored solutions for large teams
import React from 'react';
import commonStyles from './Enterprise.common.module.css';

export default function EnterprisePage() {
  return (
    <main className={commonStyles.container}>
      <header className={commonStyles.hero} style={{ background: '#0f172a', padding: '6rem 2rem', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <p style={{ color: '#4573df', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>MEGILANCE FOR TEAMS</p>
        <h1 style={{ fontSize: '3.5rem', maxWidth: '800px', margin: '0 0 1.5rem', lineHeight: 1.2 }}>
           Scale your workforce effortlessly with Enterprise talent.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', marginBottom: '2.5rem' }}>
           Consolidated billing, dedicated account managers, and compliance tracking for large organizations shipping modern software.
        </p>
        <button style={{ background: '#4573df', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '999px', fontSize: '1.125rem', fontWeight: 600, cursor: 'pointer' }}>
           Contact Sales Team
        </button>
      </header>

      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            <div>
               <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
               <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Compliance & Security</h3>
               <p style={{ color: '#64748b', lineHeight: 1.6 }}>Enterprise-grade onboarding, SLA guarantees, and strict NDA/IP protections baked into every contract.</p>
            </div>
            <div>
               <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💳</div>
               <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Consolidated Invoicing</h3>
               <p style={{ color: '#64748b', lineHeight: 1.6 }}>Manage hundreds of freelancers across multiple departments under one monthly invoice.</p>
            </div>
            <div>
               <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤝</div>
               <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Dedicated Support</h3>
               <p style={{ color: '#64748b', lineHeight: 1.6 }}>Get a dedicated Success Manager who helps you source, interview, and manage talent pools.</p>
            </div>
         </div>
      </section>
    </main>
  );
}
`);

console.log("Written About, Careers, Community, Contact, and Enterprise pages");
