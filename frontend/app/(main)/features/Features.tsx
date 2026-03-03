// @AI-HINT: Dedicated features showcase - categorized grid with interactive tabs, animations, modern UI
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/Animations';
import {
  Brain, Shield, Zap, Users, CreditCard, BarChart3,
  MessageSquare, Globe, Lock, FileText, Star, Rocket,
  Briefcase, Search, Award, Clock, Layers, Code,
  Smartphone, HeadphonesIcon, ArrowRight, CheckCircle2,
  Sparkles
} from 'lucide-react';
import commonStyles from './Features.common.module.css';
import lightStyles from './Features.light.module.css';
import darkStyles from './Features.dark.module.css';

const CATEGORIES = ['All', 'AI & Matching', 'Payments', 'Collaboration', 'Security', 'Management'] as const;
type Category = (typeof CATEGORIES)[number];

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: Exclude<Category, 'All'>;
  highlights: string[];
  status: 'live' | 'beta' | 'coming-soon';
}

const FEATURES: Feature[] = [
  {
    icon: <Brain size={24} />,
    title: 'AI-Powered Matching',
    description: 'Our ML engine analyzes skills, experience, and project requirements to find perfect freelancer-client matches with 95%+ accuracy.',
    category: 'AI & Matching',
    highlights: ['Skill gap analysis', 'Budget optimization', 'Culture fit scoring'],
    status: 'live',
  },
  {
    icon: <Sparkles size={24} />,
    title: 'AI Proposal Assistant',
    description: 'Generate compelling proposals with AI copilot that analyzes job requirements and crafts personalized, winning responses.',
    category: 'AI & Matching',
    highlights: ['Auto-drafting', 'Tone adjustment', 'Competitive analysis'],
    status: 'live',
  },
  {
    icon: <Search size={24} />,
    title: 'Smart Search & Discovery',
    description: 'Find the right talent or projects with semantic search that understands intent, not just keywords.',
    category: 'AI & Matching',
    highlights: ['Natural language queries', 'Filter by availability', 'Saved searches'],
    status: 'live',
  },
  {
    icon: <CreditCard size={24} />,
    title: 'Secure Escrow Payments',
    description: 'Funds are held securely in escrow until milestones are approved.  Both parties are protected at every step.',
    category: 'Payments',
    highlights: ['Milestone-based release', 'Dispute protection', 'Auto-invoicing'],
    status: 'live',
  },
  {
    icon: <Globe size={24} />,
    title: 'Multi-Currency Support',
    description: 'Pay and get paid in 50+ currencies with competitive exchange rates and low conversion fees.',
    category: 'Payments',
    highlights: ['PKR, USD, EUR, GBP', 'JazzCash & Easypaisa', 'Crypto payouts'],
    status: 'live',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Earnings Analytics',
    description: 'Track income, expenses, and trends with detailed breakdowns, charts, and CSV exports.',
    category: 'Payments',
    highlights: ['Period comparison', 'Tax-ready reports', 'Withdrawal tracking'],
    status: 'live',
  },
  {
    icon: <MessageSquare size={24} />,
    title: 'Real-Time Messaging',
    description: 'Communicate instantly with built-in chat, file sharing, typing indicators, and conversation search.',
    category: 'Collaboration',
    highlights: ['File attachments', 'Read receipts', 'Message search'],
    status: 'live',
  },
  {
    icon: <Layers size={24} />,
    title: 'Project Workspaces',
    description: 'Organize work with dedicated project spaces including milestones, timelines, and deliverable tracking.',
    category: 'Collaboration',
    highlights: ['Milestone boards', 'Progress tracking', 'File management'],
    status: 'live',
  },
  {
    icon: <Clock size={24} />,
    title: 'Time Tracking',
    description: 'Built-in time tracker with screenshots, activity logs, and automatic timesheet generation.',
    category: 'Collaboration',
    highlights: ['Activity monitoring', 'Auto timesheets', 'Idle detection'],
    status: 'beta',
  },
  {
    icon: <Shield size={24} />,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, SOC 2 compliance, and continuous monitoring protect your data 24/7.',
    category: 'Security',
    highlights: ['AES-256 encryption', '2FA authentication', 'Session management'],
    status: 'live',
  },
  {
    icon: <Lock size={24} />,
    title: 'Fraud Detection',
    description: 'AI-powered fraud detection identifies suspicious activity, fake profiles, and payment anomalies in real-time.',
    category: 'Security',
    highlights: ['Behavioral analysis', 'Identity verification', 'Risk scoring'],
    status: 'live',
  },
  {
    icon: <FileText size={24} />,
    title: 'Smart Contracts',
    description: 'Auto-generated contracts with clear terms, milestone definitions, and legally sound templates.',
    category: 'Security',
    highlights: ['Template library', 'E-signatures', 'Version history'],
    status: 'live',
  },
  {
    icon: <Briefcase size={24} />,
    title: 'Gig Marketplace',
    description: 'Create and sell productized services. Set your own prices, packages, and delivery times.',
    category: 'Management',
    highlights: ['Custom packages', 'Order management', 'Seller levels'],
    status: 'live',
  },
  {
    icon: <Award size={24} />,
    title: 'Skill Assessments',
    description: 'Verify skills through automated assessments and earn badges that boost your profile visibility.',
    category: 'Management',
    highlights: ['Timed tests', 'Verified badges', 'Skill scores'],
    status: 'beta',
  },
  {
    icon: <Users size={24} />,
    title: 'Team Collaboration',
    description: 'Build and manage freelancer teams for larger projects with shared workspaces and role-based access.',
    category: 'Management',
    highlights: ['Team invites', 'Role permissions', 'Shared billing'],
    status: 'coming-soon',
  },
  {
    icon: <Rocket size={24} />,
    title: 'Portfolio Showcase',
    description: 'Build a stunning portfolio with rich media support, case studies, and client testimonials.',
    category: 'Management',
    highlights: ['Image galleries', 'Video embeds', 'PDF uploads'],
    status: 'live',
  },
  {
    icon: <Code size={24} />,
    title: 'API & Integrations',
    description: 'Connect MegiLance with your favorite tools through our RESTful API and pre-built integrations.',
    category: 'Management',
    highlights: ['REST API', 'Webhooks', 'Zapier integration'],
    status: 'coming-soon',
  },
  {
    icon: <Smartphone size={24} />,
    title: 'PWA Mobile App',
    description: 'Install MegiLance as a native-like app on any device. Works offline with push notifications.',
    category: 'Collaboration',
    highlights: ['Offline mode', 'Push notifications', 'Install prompt'],
    status: 'live',
  },
  {
    icon: <HeadphonesIcon size={24} />,
    title: 'Priority Support',
    description: '24/7 support with AI chatbot for instant help, plus priority human support for premium users.',
    category: 'Security',
    highlights: ['AI chatbot', 'Ticket system', 'Live chat'],
    status: 'live',
  },
  {
    icon: <Star size={24} />,
    title: 'Review & Reputation',
    description: 'Transparent review system with sentiment analysis, verified reviews, and reputation scoring.',
    category: 'Management',
    highlights: ['AI sentiment', 'Verified reviews', 'Score history'],
    status: 'live',
  },
];

const statusLabel: Record<Feature['status'], string> = {
  live: 'Live',
  beta: 'Beta',
  'coming-soon': 'Coming Soon',
};

export default function Features() {
  const { resolvedTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const filtered = useMemo(
    () => activeCategory === 'All' ? FEATURES : FEATURES.filter(f => f.category === activeCategory),
    [activeCategory],
  );

  const stats = useMemo(() => ({
    total: FEATURES.length,
    live: FEATURES.filter(f => f.status === 'live').length,
    beta: FEATURES.filter(f => f.status === 'beta').length,
    coming: FEATURES.filter(f => f.status === 'coming-soon').length,
  }), []);

  if (!resolvedTheme) return null;
  const t = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.page, t.page)}>
        {/* Hero */}
        <section className={commonStyles.hero}>
          <div className={commonStyles.heroContent}>
            <span className={cn(commonStyles.heroBadge, t.heroBadge)}>
              <Zap size={14} /> {stats.total} Features & Counting
            </span>
            <h1 className={cn(commonStyles.heroTitle, t.heroTitle)}>
              Everything you need to <span className={commonStyles.gradient}>freelance smarter</span>
            </h1>
            <p className={cn(commonStyles.heroSubtitle, t.heroSubtitle)}>
              A complete toolkit for freelancers and clients — from AI-powered matching to secure payments, built for the modern workforce.
            </p>
            <div className={commonStyles.heroStats}>
              <div className={cn(commonStyles.heroStat, t.heroStat)}>
                <span className={commonStyles.heroStatNumber}>{stats.live}</span>
                <span className={cn(commonStyles.heroStatLabel, t.heroStatLabel)}>Live</span>
              </div>
              <div className={cn(commonStyles.heroStat, t.heroStat)}>
                <span className={commonStyles.heroStatNumber}>{stats.beta}</span>
                <span className={cn(commonStyles.heroStatLabel, t.heroStatLabel)}>In Beta</span>
              </div>
              <div className={cn(commonStyles.heroStat, t.heroStat)}>
                <span className={commonStyles.heroStatNumber}>{stats.coming}</span>
                <span className={cn(commonStyles.heroStatLabel, t.heroStatLabel)}>Coming Soon</span>
              </div>
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        <div className={commonStyles.tabsWrapper}>
          <div className={commonStyles.tabs} role="tablist" aria-label="Feature categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                className={cn(
                  commonStyles.tab, t.tab,
                  activeCategory === cat && commonStyles.tabActive,
                  activeCategory === cat && t.tabActive,
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                {cat !== 'All' && (
                  <span className={cn(commonStyles.tabCount, t.tabCount)}>
                    {FEATURES.filter(f => f.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <section className={commonStyles.gridSection}>
          <div className={commonStyles.grid}>
            {filtered.map((feature, idx) => (
              <article
                key={feature.title}
                className={cn(commonStyles.card, t.card)}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={commonStyles.cardHeader}>
                  <div className={cn(commonStyles.iconBox, t.iconBox)}>
                    {feature.icon}
                  </div>
                  <span className={cn(
                    commonStyles.statusPill,
                    feature.status === 'live' && commonStyles.statusLive,
                    feature.status === 'live' && t.statusLive,
                    feature.status === 'beta' && commonStyles.statusBeta,
                    feature.status === 'beta' && t.statusBeta,
                    feature.status === 'coming-soon' && commonStyles.statusComing,
                    feature.status === 'coming-soon' && t.statusComing,
                  )}>
                    {statusLabel[feature.status]}
                  </span>
                </div>
                <h3 className={cn(commonStyles.cardTitle, t.cardTitle)}>{feature.title}</h3>
                <p className={cn(commonStyles.cardDesc, t.cardDesc)}>{feature.description}</p>
                <ul className={commonStyles.highlights}>
                  {feature.highlights.map(h => (
                    <li key={h} className={cn(commonStyles.highlight, t.highlight)}>
                      <CheckCircle2 size={14} />
                      {h}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className={commonStyles.cta}>
          <div className={cn(commonStyles.ctaCard, t.ctaCard)}>
            <h2 className={cn(commonStyles.ctaTitle, t.ctaTitle)}>Ready to get started?</h2>
            <p className={cn(commonStyles.ctaDesc, t.ctaDesc)}>
              Join thousands of freelancers and clients already using MegiLance.
            </p>
            <div className={commonStyles.ctaActions}>
              <Link href="/signup/freelancer" className={cn(commonStyles.ctaBtn, commonStyles.ctaBtnPrimary)}>
                Start Freelancing <ArrowRight size={16} />
              </Link>
              <Link href="/signup/client" className={cn(commonStyles.ctaBtn, commonStyles.ctaBtnSecondary, t.ctaBtnSecondary)}>
                Hire Talent <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
