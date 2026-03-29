// @AI-HINT: Teams page — Build distributed teams, staff augmentation, hiring freelancer squads.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Teams.common.module.css';
import light from './Teams.light.module.css';
import dark from './Teams.dark.module.css';

const models = [
  { icon: '🏗️', title: 'Staff Augmentation', desc: 'Embed vetted freelancers directly into your existing team. They work under your processes, tools, and culture — we handle sourcing and compliance.' },
  { icon: '👥', title: 'Dedicated Teams', desc: 'Get a fully managed squad — developers, designers, QA — dedicated exclusively to your project with a team lead included.' },
  { icon: '📋', title: 'Project-Based', desc: 'Hand off a defined scope and timeline. We assemble the right team, manage delivery, and ensure quality milestones are met.' },
  { icon: '🤝', title: 'NDA & Enterprise Contracts', desc: 'For sensitive work, we offer NDAs, IP assignment, and custom contracts. Your proprietary code and data stay protected.' },
];

const steps = [
  { num: '01', title: 'Share Requirements', desc: 'Tell us your tech stack, team size, timeline, and any compliance needs. We scope it in 24 hours.' },
  { num: '02', title: 'We Match Talent', desc: 'Our AI ranks candidates from a pre-vetted pool. You review profiles, portfolios, and past performance.' },
  { num: '03', title: 'Team Onboards', desc: 'Your new team members join your workflow — Slack, Jira, GitHub — with zero downtime.' },
  { num: '04', title: 'Deliver & Scale', desc: 'Pay only for productive hours. Scale up or down monthly. We handle contracts, invoicing, and support.' },
];

const stats = [
  { value: '500+', label: 'Vetted Freelancers' },
  { value: '72h', label: 'Avg. Time to Staff' },
  { value: '98%', label: 'Client Retention' },
  { value: '40+', label: 'Countries Covered' },
];

const capabilities = [
  'Full-Stack Development', 'Mobile (iOS & Android)', 'UI/UX Design', 'DevOps & Cloud',
  'Data Science & ML', 'QA & Automation', 'Product Management', 'Cybersecurity',
];

const Teams: React.FC = () => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={480} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={380} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={12} className="absolute inset-0" />
        <div className="absolute top-28 left-12 opacity-10"><FloatingCube size={55} /></div>
        <div className="absolute bottom-36 right-16 opacity-10"><FloatingSphere size={45} /></div>
      </div>

      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {/* Hero */}
          <ScrollReveal>
            <header className={common.header}>
              <span className={cn(common.badge, themed.badge)}>Enterprise & Teams</span>
              <h1 className={cn(common.title, themed.title)}>Build Your Dream Team — Fast</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Scale your engineering capacity in days, not months. We source, vet, and embed
                top freelance talent directly into your workflow.
              </p>
            </header>
          </ScrollReveal>

          {/* Stats */}
          <section className={common.statsBar} aria-label="Platform statistics">
            {stats.map((s) => (
              <div key={s.label} className={cn(common.statItem, themed.statItem)}>
                <span className={common.statValue}>{s.value}</span>
                <span className={common.statLabel}>{s.label}</span>
              </div>
            ))}
          </section>

          {/* Hiring Models */}
          <section className={common.section} aria-label="Hiring models">
            <ScrollReveal>
              <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>Flexible Hiring Models</h2>
              <p className={cn(common.sectionDesc, themed.sectionDesc)}>Choose the engagement type that fits your project scope, budget, and timeline.</p>
            </ScrollReveal>
            <StaggerContainer className={common.modelsGrid} delay={0.08}>
              {models.map((m) => (
                <StaggerItem key={m.title}>
                  <article className={cn(common.modelCard, themed.modelCard)}>
                    <span className={common.modelIcon}>{m.icon}</span>
                    <h3 className={cn(common.modelTitle, themed.modelTitle)}>{m.title}</h3>
                    <p className={cn(common.modelDesc, themed.modelDesc)}>{m.desc}</p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* How It Works */}
          <section className={common.section} aria-label="Process">
            <ScrollReveal>
              <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>How It Works</h2>
            </ScrollReveal>
            <div className={common.stepsGrid}>
              {steps.map((s) => (
                <ScrollReveal key={s.num}>
                  <div className={cn(common.stepCard, themed.stepCard)}>
                    <span className={cn(common.stepNum, themed.stepNum)}>{s.num}</span>
                    <h3 className={cn(common.stepTitle, themed.stepTitle)}>{s.title}</h3>
                    <p className={cn(common.stepDesc, themed.stepDesc)}>{s.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>

          {/* Capabilities */}
          <section className={common.section} aria-label="Capabilities">
            <ScrollReveal>
              <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>Capabilities We Cover</h2>
              <div className={common.capsGrid}>
                {capabilities.map((c) => (
                  <span key={c} className={cn(common.capChip, themed.capChip)}>{c}</span>
                ))}
              </div>
            </ScrollReveal>
          </section>

          {/* CTA */}
          <section className={common.section} aria-label="Get started">
            <ScrollReveal>
              <div className={cn(common.ctaBox, themed.ctaBox)}>
                <h2 className={common.ctaTitle}>Ready to Scale?</h2>
                <p className={common.ctaDesc}>Tell us what you need and we&apos;ll propose a team within 48 hours — no commitment required.</p>
                <div className={common.ctaButtons}>
                  <a href="/contact" className={cn(common.button, themed.button)}>Request a Team</a>
                  <a href="/pricing" className={cn(common.button, common.buttonSecondary, themed.buttonSecondary)}>View Pricing</a>
                </div>
              </div>
            </ScrollReveal>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Teams;
