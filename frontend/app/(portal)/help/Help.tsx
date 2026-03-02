// @AI-HINT: Portal Help/Support Center page. Theme-aware, accessible, animated knowledge base with contact CTAs.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Help.common.module.css';
import light from './Help.light.module.css';
import dark from './Help.dark.module.css';

const categories = [
  {
    title: 'Getting Started',
    desc: 'Set up your account, invite your team, and configure your workspace.',
    href: '/faq',
  },
  {
    title: 'Billing & Invoices',
    desc: 'Manage subscriptions, invoices, and payment methods securely.',
    href: '/pricing',
  },
  {
    title: 'Security',
    desc: 'Learn how we keep your data protected and compliant.',
    href: '/security',
  },
];

const popularArticles = [
  'How to invite teammates',
  'Managing roles & permissions',
  'Understanding invoices',
  'Turning on 2FA',
];

const Help: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <div className={common.bgDecorations}>
        <AnimatedOrb variant="blue" size={400} blur={90} opacity={0.08} className={common.orbTopLeft} />
        <AnimatedOrb variant="purple" size={350} blur={70} opacity={0.06} className={common.orbBottomRight} />
        <ParticlesSystem count={10} className={common.particles} />
        <div className={common.floatTopRight}>
          <FloatingCube size={50} />
        </div>
        <div className={common.floatBottomLeft}>
          <FloatingSphere size={40} />
        </div>
      </div>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>Help Center</h1>
              <p className={common.subtitle}>Find answers, learn best practices, and contact our support team.</p>
            </div>
          </ScrollReveal>

          <section aria-label="Help categories">
            <StaggerContainer className={common.grid}>
              {categories.map((c) => (
                <Link key={c.title} href={c.href} className={common.card} aria-label={`${c.title} category`}>
                  <div className={common.cardTitle}>{c.title}</div>
                  <p className={common.cardDesc}>{c.desc}</p>
                </Link>
              ))}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Popular articles">
            <h2 className={common.sectionTitle}>Popular Articles</h2>
            <StaggerContainer className={common.list}>
              {popularArticles.map((a) => (
                <div key={a} className={common.item}>{a}</div>
              ))}
            </StaggerContainer>
          </section>

          <section className={common.section} aria-label="Contact support">
            <ScrollReveal>
              <div className={common.cta}>
                <Link href="/support" className={common.button} aria-label="Go to Support">Go to Support</Link>
                <Link href="/contact" className={cn(common.button, common.buttonSecondary)} aria-label="Contact us">Contact Us</Link>
              </div>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Help;
