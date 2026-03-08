// @AI-HINT: Client-side "Post a Project" landing page — high-converting funnel with social proof,
// step-by-step process, trust signals, and strong CTAs to drive project posting.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  Clock,
  Star,
  Award,
  Bot,
  CreditCard,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from '@/app/components/Button/Button';

import commonStyles from './PostProject.common.module.css';
import lightStyles from './PostProject.light.module.css';
import darkStyles from './PostProject.dark.module.css';

type FAQ = { question: string; answer: string };

export default function PostProjectClient({ faqs }: { faqs: FAQ[] }) {
  const { resolvedTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!resolvedTheme) return null;
  const theme = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const categories = [
    { icon: <Bot size={24} />, name: 'Web Development', count: '2,400+ freelancers' },
    { icon: <Target size={24} />, name: 'Mobile Apps', count: '1,800+ freelancers' },
    { icon: <Star size={24} />, name: 'UI/UX Design', count: '1,500+ freelancers' },
    { icon: <TrendingUp size={24} />, name: 'Data Science & AI', count: '900+ freelancers' },
    { icon: <Award size={24} />, name: 'Content Writing', count: '2,100+ freelancers' },
    { icon: <Zap size={24} />, name: 'Digital Marketing', count: '1,200+ freelancers' },
  ];

  const stats = [
    { value: '50K+', label: 'Projects Completed' },
    { value: '24h', label: 'Average Hire Time' },
    { value: '98%', label: 'Client Satisfaction' },
    { value: '$0', label: 'Cost to Post' },
  ];

  const benefits = [
    { icon: <Zap size={20} />, title: 'AI-Powered Matching', desc: 'Get matched with the perfect freelancer in minutes, not days' },
    { icon: <Shield size={20} />, title: 'Secure Escrow Payments', desc: 'Your money is protected until you approve the work' },
    { icon: <CreditCard size={20} />, title: 'Free to Post', desc: 'Post unlimited projects with zero upfront costs' },
    { icon: <Users size={20} />, title: 'Verified Freelancers', desc: 'Every freelancer is vetted with skill assessments' },
    { icon: <Clock size={20} />, title: 'Fast Turnaround', desc: 'Most projects get proposals within 1-2 hours' },
    { icon: <Award size={20} />, title: 'Quality Guarantee', desc: 'Dispute resolution and money-back protection' },
  ];

  return (
    <div className={cn(commonStyles.page, theme.page)}>
      {/* Hero Section */}
      <section className={cn(commonStyles.hero, theme.hero)}>
        <div className={commonStyles.heroContent}>
          <div className={cn(commonStyles.badge, theme.badge)}>
            <Zap size={14} />
            <span>Free to Post — No Credit Card Required</span>
          </div>
          <h1 className={cn(commonStyles.heroTitle, theme.heroTitle)}>
            Post Your Project &<br />
            <span className={cn(commonStyles.gradient, theme.gradient)}>Hire Top Freelancers</span>
          </h1>
          <p className={cn(commonStyles.heroSubtitle, theme.heroSubtitle)}>
            Describe your project and get matched with verified freelancers within hours.
            AI-powered matching, secure payments, and milestone tracking — all in one place.
          </p>
          <div className={commonStyles.heroCtas}>
            <Link href="/signup?role=client&from=post-project">
              <Button variant="primary" size="lg">
                Post Your Project Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>
          <div className={cn(commonStyles.heroTrust, theme.heroTrust)}>
            <CheckCircle2 size={16} />
            <span>No fees to post</span>
            <span className={commonStyles.dot}>•</span>
            <CheckCircle2 size={16} />
            <span>Proposals in hours</span>
            <span className={commonStyles.dot}>•</span>
            <CheckCircle2 size={16} />
            <span>100% payment protection</span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className={cn(commonStyles.statsBar, theme.statsBar)}>
        <div className={commonStyles.statsGrid}>
          {stats.map((s) => (
            <div key={s.label} className={cn(commonStyles.statItem, theme.statItem)}>
              <span className={cn(commonStyles.statValue, theme.statValue)}>{s.value}</span>
              <span className={cn(commonStyles.statLabel, theme.statLabel)}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.sectionInner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            How to Hire in 4 Simple Steps
          </h2>
          <p className={cn(commonStyles.sectionSubtitle, theme.sectionSubtitle)}>
            From posting your project to getting work done — it takes minutes, not weeks.
          </p>
          <div className={commonStyles.stepsGrid}>
            {[
              { num: '1', title: 'Post Your Project', desc: 'Describe what you need, set your budget and timeline. It takes less than 5 minutes.' },
              { num: '2', title: 'Get AI Matches', desc: 'Our AI analyzes your requirements and instantly matches you with the best freelancers.' },
              { num: '3', title: 'Review & Hire', desc: 'Compare proposals, review portfolios, chat with candidates, and hire your favorite.' },
              { num: '4', title: 'Pay on Approval', desc: 'Funds stay in escrow until you approve. Set milestones for large projects.' },
            ].map((step) => (
              <div key={step.num} className={cn(commonStyles.stepCard, theme.stepCard)}>
                <div className={cn(commonStyles.stepNum, theme.stepNum)}>{step.num}</div>
                <h3 className={cn(commonStyles.stepTitle, theme.stepTitle)}>{step.title}</h3>
                <p className={cn(commonStyles.stepDesc, theme.stepDesc)}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className={cn(commonStyles.section, commonStyles.benefitsSection, theme.benefitsSection)}>
        <div className={commonStyles.sectionInner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            Why 50,000+ Businesses Choose MegiLance
          </h2>
          <div className={commonStyles.benefitsGrid}>
            {benefits.map((b) => (
              <div key={b.title} className={cn(commonStyles.benefitCard, theme.benefitCard)}>
                <div className={cn(commonStyles.benefitIcon, theme.benefitIcon)}>{b.icon}</div>
                <h3 className={cn(commonStyles.benefitTitle, theme.benefitTitle)}>{b.title}</h3>
                <p className={cn(commonStyles.benefitDesc, theme.benefitDesc)}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.sectionInner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            Find Freelancers in Any Category
          </h2>
          <div className={commonStyles.categoriesGrid}>
            {categories.map((cat) => (
              <div key={cat.name} className={cn(commonStyles.categoryCard, theme.categoryCard)}>
                <div className={cn(commonStyles.categoryIcon, theme.categoryIcon)}>{cat.icon}</div>
                <h3 className={cn(commonStyles.categoryName, theme.categoryName)}>{cat.name}</h3>
                <p className={cn(commonStyles.categoryCount, theme.categoryCount)}>{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className={cn(commonStyles.section, commonStyles.comparisonSection, theme.comparisonSection)}>
        <div className={commonStyles.sectionInner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            MegiLance vs Other Platforms
          </h2>
          <div className={cn(commonStyles.comparisonTable, theme.comparisonTable)}>
            <div className={cn(commonStyles.compRow, commonStyles.compHeader, theme.compHeader)}>
              <div className={commonStyles.compFeature}>Feature</div>
              <div className={cn(commonStyles.compBrand, theme.compBrand)}>MegiLance</div>
              <div className={commonStyles.compOther}>Upwork</div>
              <div className={commonStyles.compOther}>Fiverr</div>
            </div>
            {[
              ['Cost to Post', 'Free', '$5-50', 'Free'],
              ['AI Matching', '✓ Advanced', '✗', '✗'],
              ['Client Fee', '0-5%', '3-5%', '5.5%'],
              ['Escrow Protection', '✓ Always', '✓', '✓'],
              ['Average Hire Time', '24 hours', '3-5 days', '1-3 days'],
              ['Freelancer Verification', '✓ Skills-tested', 'Basic', 'Basic'],
              ['Milestone Payments', '✓ Included', '✓ Paid', '✗'],
              ['Blockchain Security', '✓', '✗', '✗'],
            ].map(([feature, ml, up, fv]) => (
              <div key={feature} className={cn(commonStyles.compRow, theme.compRow)}>
                <div className={cn(commonStyles.compFeature, theme.compFeature)}>{feature}</div>
                <div className={cn(commonStyles.compBrand, theme.compBrand)}>{ml}</div>
                <div className={cn(commonStyles.compOther, theme.compOther)}>{up}</div>
                <div className={cn(commonStyles.compOther, theme.compOther)}>{fv}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.sectionInner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            Frequently Asked Questions
          </h2>
          <div className={commonStyles.faqList}>
            {faqs.map((faq, i) => (
              <div key={i} className={cn(commonStyles.faqItem, theme.faqItem)}>
                <button
                  className={cn(commonStyles.faqQuestion, theme.faqQuestion)}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.question}</span>
                  {openFaq === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openFaq === i && (
                  <div className={cn(commonStyles.faqAnswer, theme.faqAnswer)}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={cn(commonStyles.finalCta, theme.finalCta)}>
        <div className={commonStyles.sectionInner}>
          <h2 className={cn(commonStyles.finalCtaTitle, theme.finalCtaTitle)}>
            Ready to Get Your Project Done?
          </h2>
          <p className={cn(commonStyles.finalCtaDesc, theme.finalCtaDesc)}>
            Join 50,000+ businesses who hire freelancers on MegiLance.
            Post your project in 5 minutes — it&apos;s free.
          </p>
          <Link href="/signup?role=client&from=post-project">
            <Button variant="primary" size="lg">
              Post Your Project Now — It&apos;s Free
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
