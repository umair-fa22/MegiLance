// @AI-HINT: Cookie Policy page for MegiLance.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Cookies.common.module.css';
import light from './Cookies.light.module.css';
import dark from './Cookies.dark.module.css';

const CookiesPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={12} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>
      <main className={cn(common.page, themed.themeWrapper)}>
      <div className={common.container}>
        <div className={common.header}>
          <h1 className={common.title}>Cookie Policy</h1>
          <p className={cn(common.subtitle, themed.subtitle)}>
            How we use cookies and similar technologies
          </p>
        </div>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>What Are Cookies?</h2>
          <p className={common.content}>
            Cookies are small text files that are stored on your device when you visit our website. 
            They help us provide you with a better experience by remembering your preferences and 
            analyzing how you use our site.
          </p>
        </section>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Types of Cookies We Use</h2>
          <div className={common.cookiesGrid}>
            <div className={common.cookieCard}>
              <h3 className={common.cookieTitle}>Essential Cookies</h3>
              <p className={common.cookieDescription}>
                These cookies are necessary for the website to function properly. They enable basic 
                functions like page navigation and access to secure areas.
              </p>
            </div>
            <div className={common.cookieCard}>
              <h3 className={common.cookieTitle}>Analytics Cookies</h3>
              <p className={common.cookieDescription}>
                These cookies help us understand how visitors interact with our website by collecting 
                and reporting information anonymously.
              </p>
            </div>
            <div className={common.cookieCard}>
              <h3 className={common.cookieTitle}>Functional Cookies</h3>
              <p className={common.cookieDescription}>
                These cookies enable enhanced functionality and personalization, such as remembering 
                your preferences and settings.
              </p>
            </div>
            <div className={common.cookieCard}>
              <h3 className={common.cookieTitle}>Marketing Cookies</h3>
              <p className={common.cookieDescription}>
                These cookies are used to track visitors across websites to display relevant and 
                engaging advertisements.
              </p>
            </div>
          </div>
        </section>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Managing Your Cookie Preferences</h2>
          <p className={common.content}>
            You can control and manage cookies through your browser settings. However, disabling 
            certain cookies may affect the functionality of our website. For more information about 
            managing cookies, please visit your browser&apos;s help section.
          </p>
        </section>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Updates to This Policy</h2>
          <p className={common.content}>
            We may update this Cookie Policy from time to time to reflect changes in our practices 
            or for other operational, legal, or regulatory reasons. We will notify you of any 
            material changes by posting the new policy on this page.
          </p>
        </section>

        <section className={common.section}>
          <h2 className={common.sectionTitle}>Contact Us</h2>
          <p className={common.content}>
            If you have any questions about our use of cookies, please contact us at{' '}
            <a href="mailto:privacy@megilance.com" className={common.emailLink}>
              privacy@megilance.com
            </a>
          </p>
        </section>
      </div>
    </main>
    </PageTransition>
  );
};

export default CookiesPage; 
