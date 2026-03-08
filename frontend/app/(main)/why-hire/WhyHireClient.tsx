// @AI-HINT: Why Hire client component — shows value props, savings calculator, testimonials, FAQs.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  ArrowRight, CheckCircle2, Shield, Zap, Users, Clock, Star, DollarSign,
  TrendingUp, Globe, Bot, ChevronDown, ChevronUp,
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import EmailCapture from '@/app/components/EmailCapture/EmailCapture';

import commonStyles from './WhyHire.common.module.css';
import lightStyles from './WhyHire.light.module.css';
import darkStyles from './WhyHire.dark.module.css';

type FAQ = { question: string; answer: string };

export default function WhyHireClient({ faqs }: { faqs: FAQ[] }) {
  const { resolvedTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!resolvedTheme) return null;
  const theme = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const reasons = [
    { icon: <Bot size={24} />, title: 'AI-Powered Matching', desc: 'Our AI analyzes your project and matches you with the best-fit freelancers in minutes, not days. 98% match accuracy.' },
    { icon: <DollarSign size={24} />, title: 'Save 40-60% vs Full-Time', desc: 'No office costs, no benefits overhead. Pay only for the work you need, when you need it.' },
    { icon: <Shield size={24} />, title: 'Payment Protection', desc: 'Every payment is held in escrow until you approve. Milestone payments for complex projects. Zero risk.' },
    { icon: <Clock size={24} />, title: 'Hire in 24 Hours', desc: 'Average time to hire is just 24 hours. Get proposals within 1-2 hours of posting.' },
    { icon: <Star size={24} />, title: 'Verified Talent', desc: 'Every freelancer passes skill assessments and identity verification. No fake profiles.' },
    { icon: <Globe size={24} />, title: 'Global Talent Pool', desc: 'Access 100,000+ freelancers across 150+ countries. Find the perfect specialist for any project.' },
    { icon: <Zap size={24} />, title: 'Zero Commission', desc: 'Freelancers pay 0% commission — they offer better rates because they keep more. You save too.' },
    { icon: <TrendingUp size={24} />, title: 'Scale On Demand', desc: 'Need 1 developer or 20? Scale your team instantly without HR overhead or long-term commitments.' },
  ];

  const savings = [
    { role: 'Full-Stack Developer', fullTime: '$120,000/yr', freelance: '$50-80/hr', savings: '40-55%' },
    { role: 'UI/UX Designer', fullTime: '$95,000/yr', freelance: '$40-65/hr', savings: '35-50%' },
    { role: 'Content Writer', fullTime: '$65,000/yr', freelance: '$25-50/hr', savings: '45-60%' },
    { role: 'Data Scientist', fullTime: '$140,000/yr', freelance: '$60-100/hr', savings: '35-50%' },
  ];

  return (
    <div className={cn(commonStyles.page, theme.page)}>
      <section className={cn(commonStyles.hero, theme.hero)}>
        <div className={commonStyles.heroInner}>
          <h1 className={cn(commonStyles.heroTitle, theme.heroTitle)}>
            Why Smart Businesses Hire<br />
            <span className={cn(commonStyles.gradient, theme.gradient)}>Freelancers on MegiLance</span>
          </h1>
          <p className={cn(commonStyles.heroDesc, theme.heroDesc)}>
            Save 40-60% on hiring costs. Get AI-matched with verified experts in 24 hours.
            Zero commissions, secure payments, and quality guaranteed.
          </p>
          <div className={commonStyles.heroCtas}>
            <Link href="/post-project">
              <Button variant="primary" size="lg">
                Post Your Project Free <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" size="lg">How It Works</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reasons Grid */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.inner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            8 Reasons Businesses Choose MegiLance
          </h2>
          <div className={commonStyles.reasonsGrid}>
            {reasons.map((r) => (
              <div key={r.title} className={cn(commonStyles.reasonCard, theme.reasonCard)}>
                <div className={cn(commonStyles.reasonIcon, theme.reasonIcon)}>{r.icon}</div>
                <h3 className={cn(commonStyles.reasonTitle, theme.reasonTitle)}>{r.title}</h3>
                <p className={cn(commonStyles.reasonDesc, theme.reasonDesc)}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Savings Table */}
      <section className={cn(commonStyles.section, commonStyles.savingsSection, theme.savingsSection)}>
        <div className={commonStyles.inner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            How Much Can You Save?
          </h2>
          <p className={cn(commonStyles.sectionSub, theme.sectionSub)}>
            Compare the cost of a full-time hire vs freelance talent on MegiLance
          </p>
          <div className={cn(commonStyles.savingsTable, theme.savingsTable)}>
            <div className={cn(commonStyles.savingsRow, commonStyles.savingsHeader, theme.savingsHeader)}>
              <div>Role</div>
              <div>Full-Time Salary</div>
              <div>Freelance Rate</div>
              <div>You Save</div>
            </div>
            {savings.map((s) => (
              <div key={s.role} className={cn(commonStyles.savingsRow, theme.savingsRow)}>
                <div className={cn(commonStyles.savingsRole, theme.savingsRole)}>{s.role}</div>
                <div className={cn(commonStyles.savingsFt, theme.savingsFt)}>{s.fullTime}</div>
                <div className={cn(commonStyles.savingsFl, theme.savingsFl)}>{s.freelance}</div>
                <div className={cn(commonStyles.savingsPercent, theme.savingsPercent)}>{s.savings}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.inner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>Frequently Asked Questions</h2>
          <div className={commonStyles.faqList}>
            {faqs.map((faq, i) => (
              <div key={i} className={cn(commonStyles.faqItem, theme.faqItem)}>
                <button
                  className={cn(commonStyles.faqQ, theme.faqQ)}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.question}</span>
                  {openFaq === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openFaq === i && (
                  <div className={cn(commonStyles.faqA, theme.faqA)}>{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className={cn(commonStyles.section, theme.section)}>
        <EmailCapture
          headline="Free Guide: How to Hire Freelancers Successfully"
          subtext="Get our step-by-step guide on hiring, managing, and paying freelancers. Plus weekly tips."
          buttonLabel="Get Free Guide"
          source="why-hire"
          variant="card"
        />
      </section>

      {/* Final CTA */}
      <section className={cn(commonStyles.finalCta, theme.finalCta)}>
        <div className={commonStyles.inner}>
          <h2 className={cn(commonStyles.ctaTitle, theme.ctaTitle)}>
            Start Hiring Top Freelancers Today
          </h2>
          <p className={cn(commonStyles.ctaDesc, theme.ctaDesc)}>
            Post your first project free. Get proposals in hours. Pay only when satisfied.
          </p>
          <Link href="/post-project">
            <Button variant="primary" size="lg">
              Post a Project Free <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
