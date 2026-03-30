// @AI-HINT: Support page with theme-aware styling, animated sections, and accessible structure.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Support.common.module.css';
import light from './Support.light.module.css';
import dark from './Support.dark.module.css';

const Support: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="blue" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="purple" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={15} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <header className={common.header}>
              <h1 className={common.title}>Support Center</h1>
              <p className={common.subtitle}>Find quick answers or get in touch with our team.</p>
            </header>
          </ScrollReveal>

          <section className={common.sections} aria-label="Support sections">
            <StaggerContainer className={common.grid} aria-label="Help categories" delay={0.1}>
              <article className={common.card} aria-labelledby="cat-acc">
                <h3 id="cat-acc" className={common.cardTitle}>Account & Security</h3>
                <p className={common.cardDesc}>Login issues, 2FA, profile settings, and account safety.</p>
                <ul className={common.list}>
                  <li><a className={common.link} href="/faq#account">Reset password</a></li>
                  <li><a className={common.link} href="/security">Enable 2FA</a></li>
                  <li><a className={common.link} href="/legal/privacy">Privacy settings</a></li>
                </ul>
              </article>

              <article className={common.card} aria-labelledby="cat-bill">
                <h3 id="cat-bill" className={common.cardTitle}>Billing</h3>
                <p className={common.cardDesc}>Subscriptions, invoices, refunds, and payment methods.</p>
                <ul className={common.list}>
                  <li><a className={common.link} href="/pricing">Manage plan</a></li>
                  <li><a className={common.link} href="/faq#billing">View invoices</a></li>
                  <li><a className={common.link} href="/contact">Contact billing</a></li>
                </ul>
              </article>

              <article className={common.card} aria-labelledby="cat-jobs">
                <h3 id="cat-jobs" className={common.cardTitle}>Jobs & Projects</h3>
                <p className={common.cardDesc}>Posting jobs, proposals, milestones, and escrow.</p>
                <ul className={common.list}>
                  <li><Link className={common.link} href="/projects">Browse jobs</Link></li>
                  <li><Link className={common.link} href="/faq#jobs">Create a posting</Link></li>
                  <li><Link className={common.link} href="/faq#payments">Use escrow</Link></li>
                </ul>
              </article>
            </StaggerContainer>

            <StaggerContainer className={common.grid} aria-label="Contact options" delay={0.2}>
              <article className={common.card} aria-labelledby="contact-email">
                <h3 id="contact-email" className={common.cardTitle}>Email Support</h3>
                <p className={common.cardDesc}>Get help via email. We typically respond within 1 business day.</p>
                <div className={common.cta}>
                  <a href="mailto:support@megilance.com" className={common.button} aria-label="Email support">support@megilance.com</a>
                </div>
              </article>

              <article className={common.card} aria-labelledby="contact-faq">
                <h3 id="contact-faq" className={common.cardTitle}>FAQ</h3>
                <p className={common.cardDesc}>Find answers to common questions and best practices.</p>
                <div className={common.cta}>
                  <a href="/faq" className={cn(common.button, common.buttonSecondary)} aria-label="Go to FAQ">Go to FAQ</a>
                </div>
              </article>

              <article className={common.card} aria-labelledby="contact-form">
                <h3 id="contact-form" className={common.cardTitle}>Contact Form</h3>
                <p className={common.cardDesc}>Prefer a form? Use our contact page and we will route it to the right team.</p>
                <div className={common.cta}>
                  <a href="/contact" className={cn(common.button, common.buttonSecondary)} aria-label="Go to Contact page">Contact Us</a>
                </div>
              </article>
            </StaggerContainer>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Support;
