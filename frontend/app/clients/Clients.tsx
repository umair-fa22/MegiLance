// @AI-HINT: Clients page — marketing + real data from API, theme-aware, animated.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
const ClientLogoCard = dynamic(() => import('./components/ClientLogoCard'));
const CaseStudyCard = dynamic(() => import('./components/CaseStudyCard'));
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { useToaster } from '@/app/components/molecules/Toast/ToasterProvider';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './Clients.common.module.css';
import light from './Clients.light.module.css';
import dark from './Clients.dark.module.css';

const ALL = 'All';

// Client data interface matching backend PublicClientResponse
interface ClientData {
  id: string;
  name: string;
  company_name: string | null;
  industry: string;
  logo_url: string | null;
  description: string | null;
  project_count: number;
  joined_date: string;
}

// Stats interface matching backend ClientStatsResponse
interface ClientStats {
  total_clients: number;
  total_projects: number;
  industries: string[];
  avg_project_value: number;
  satisfaction_rate: number;
}

// Empty fallback when API is unavailable
const fallbackLogos: ClientData[] = [];

const cases: { title: string; desc: string; media: string }[] = [];

const benefits = [
  { icon: '🎯', title: 'AI-Matched Talent', desc: 'Our ranking engine evaluates skills, experience, and past performance to surface the best candidates for your project.' },
  { icon: '🔒', title: 'Secure Payments', desc: 'Milestone-based escrow protects your budget. Pay only when deliverables meet your approval — zero risk.' },
  { icon: '⚡', title: 'Fast Hiring', desc: 'Post a project and receive qualified proposals within hours, not weeks. Average time to first hire: 48 hours.' },
  { icon: '📊', title: 'Full Transparency', desc: 'Real-time dashboards, time logs, and progress reports keep you in control from kick-off to delivery.' },
  { icon: '🛡️', title: 'IP & NDA Protection', desc: 'Standard NDA templates and IP assignment clauses built into every contract. Your code stays yours.' },
  { icon: '🌍', title: 'Global Talent Pool', desc: 'Access verified freelancers across 40+ countries. Filter by timezone, language, and availability.' },
];

const howSteps = [
  { num: '01', title: 'Post Your Project', desc: 'Describe what you need, set a budget range, and specify required skills. Takes under 5 minutes.' },
  { num: '02', title: 'Review AI Proposals', desc: 'We rank applicants by relevance. Compare portfolios, ratings, and rates side by side.' },
  { num: '03', title: 'Hire & Collaborate', desc: 'Award the project, set milestones, and start working together through our built-in tools.' },
  { num: '04', title: 'Pay on Delivery', desc: 'Release escrow when you are satisfied. Leave a review to help the community grow.' },
];

interface Metric {
  label: string;
  value: string;
  detail: string;
}

const defaultMetrics: Metric[] = [
  { label: 'Total Clients', value: '—', detail: 'Loading...' },
  { label: 'Projects Completed', value: '—', detail: 'Loading...' },
  { label: 'Satisfaction Rate', value: '—', detail: 'Loading...' },
  { label: 'Talent Matching', value: 'AI', detail: 'ML-powered ranking' },
];

const Clients: React.FC = () => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { notify } = useToaster();

  const [selected, setSelected] = useState<string>(ALL);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [industries, setIndustries] = useState<string[]>([ALL, 'AI', 'Fintech', 'E-commerce', 'Healthcare']);
  const [stats, setStats] = useState<ClientStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [clientsRes, statsRes, industriesRes] = await Promise.all([
          fetch('/api/v1/public-clients/featured'),
          fetch('/api/v1/public-clients/stats'),
          fetch('/api/v1/public-clients/industries'),
        ]);
        if (clientsRes.ok) { const d = await clientsRes.json(); setClients(d.length > 0 ? d : fallbackLogos); }
        else { setClients(fallbackLogos); }
        if (statsRes.ok) { setStats(await statsRes.json()); }
        if (industriesRes.ok) { const d = await industriesRes.json(); if (d.length > 0) setIndustries([ALL, ...d]); }
      } catch { setClients(fallbackLogos); } finally { setIsLoading(false); }
    };
    fetchData();
  }, []);

  const metrics: Metric[] = useMemo(() => {
    if (!stats) return defaultMetrics;
    return [
      { label: 'Total Clients', value: stats.total_clients.toString(), detail: 'Trusted companies worldwide' },
      { label: 'Projects Completed', value: stats.total_projects.toString(), detail: 'Successfully delivered' },
      { label: 'Satisfaction Rate', value: `${stats.satisfaction_rate}%`, detail: 'Client happiness score' },
      { label: 'Talent Matching', value: 'AI-Powered', detail: 'ML-powered ranking' },
    ];
  }, [stats]);

  const filtered = useMemo(
    () => (selected === ALL ? clients : clients.filter((c) => c.industry === selected)),
    [selected, clients]
  );

  const onSelect = useCallback((c: string) => {
    setSelected(c);
    notify({
      title: 'Filter applied',
      description: c === ALL ? 'Showing all industries' : `Showing ${c} clients`,
      variant: 'info',
      duration: 1800,
    });
  }, [notify]);

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
              <span className={cn(common.heroBadge, themed.heroBadge)}>For Clients</span>
              <h1 className={common.title}>Hire Top Freelancers — Without the Guesswork</h1>
              <p className={common.subtitle}>
                Post a project, let AI match the best talent, and pay only when you&apos;re satisfied. Trusted by teams shipping real products.
              </p>
              <div className={common.heroCtas}>
                <a href="/signup" className={cn(common.heroBtn, themed.heroBtn)}>Post a Project — Free</a>
                <a href="/talent" className={cn(common.heroBtnOutline, themed.heroBtnOutline)}>Browse Talent</a>
              </div>
            </header>
          </ScrollReveal>

          {/* Why MegiLance */}
          <section className={common.section} aria-label="Benefits">
            <ScrollReveal>
              <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>Why Clients Choose MegiLance</h2>
            </ScrollReveal>
            <StaggerContainer className={common.benefitsGrid} delay={0.08}>
              {benefits.map((b) => (
                <StaggerItem key={b.title}>
                  <div className={cn(common.benefitCard, themed.benefitCard)}>
                    <span className={common.benefitIcon}>{b.icon}</span>
                    <h3 className={cn(common.benefitTitle, themed.benefitTitle)}>{b.title}</h3>
                    <p className={cn(common.benefitDesc, themed.benefitDesc)}>{b.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* How It Works */}
          <section className={common.section} aria-label="How it works">
            <ScrollReveal>
              <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>How It Works</h2>
            </ScrollReveal>
            <div className={common.stepsRow}>
              {howSteps.map((s) => (
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

          {/* Metrics */}
          <section className={common.section} aria-label="Impact metrics">
            <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>Impact Metrics</h2>
            <ul className={common.metricGrid} role="list">
              {metrics.map(m => (
                <li key={m.label} className={cn(common.metricCard, themed.metricCard)}>
                  <div className={common.metricValue}>{m.value}</div>
                  <div className={common.metricLabel}>{m.label}</div>
                  <div className={common.metricDetail}>{m.detail}</div>
                </li>
              ))}
            </ul>
          </section>

          {/* Client Logos */}
          <section className={common.section} aria-label="Our clients">
            <ScrollReveal>
              <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>Trusted By</h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className={common.controls} role="toolbar" aria-label="Filter clients by industry">
                {industries.map((c) => {
                  const active = selected === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={cn(common.chip, themed.chip, active && common.chipActive)}
                      aria-pressed={active}
                      data-active={active || undefined}
                      onClick={() => onSelect(c)}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>
            <StaggerContainer className={common.grid} delay={0.2}>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <div key={`s-${i}`} className={cn(common.logoCard, common.skeleton)} aria-hidden="true" />
              ))}
              {!isLoading && filtered.length === 0 && (
                <div className={common.gridSpanAll}>
                  <EmptyState
                    title="No clients in this category"
                    description="Try a different industry or contact our team for a tailored walkthrough."
                    action={<a href="/contact" className={cn(common.heroBtn, themed.heroBtn)} aria-label="Contact sales">Contact Sales</a>}
                  />
                </div>
              )}
              {!isLoading && filtered.length > 0 && filtered.map((client) => (
                <ClientLogoCard
                  key={client.id}
                  name={client.company_name || client.name}
                  src={client.logo_url || '/images/clients/placeholder.svg'}
                  industry={client.industry}
                  projectCount={client.project_count}
                  description={client.description}
                />
              ))}
            </StaggerContainer>
          </section>

          {/* Case Studies (conditional) */}
          {cases.length > 0 && (
            <section className={common.section} aria-label="Case studies">
              <ScrollReveal>
                <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>Case Studies</h2>
              </ScrollReveal>
              <StaggerContainer className={common.caseGrid} delay={0.4}>
                {cases.map((c) => (
                  <CaseStudyCard key={c.title} title={c.title} description={c.desc} media={c.media} />
                ))}
              </StaggerContainer>
            </section>
          )}

          {/* CTA */}
          <section className={cn(common.ctaBox, themed.ctaBox)} aria-label="Call to action">
            <h2 className={cn(common.ctaBoxTitle, themed.ctaBoxTitle)}>Ready to build your dream team?</h2>
            <p className={cn(common.ctaBoxDesc, themed.ctaBoxDesc)}>
              Post your first project for free and see matched talent in under 48 hours.
            </p>
            <div className={common.heroCtas}>
              <a href="/signup" className={cn(common.heroBtn, themed.heroBtn)}>Get Started Free</a>
              <a href="/contact" className={cn(common.heroBtnOutline, themed.heroBtnOutline)}>Talk to Sales</a>
            </div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
};

export default Clients;
