// @AI-HINT: About directory - company mission and vision
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
