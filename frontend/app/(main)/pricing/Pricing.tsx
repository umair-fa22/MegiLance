// @AI-HINT: Pricing page with 3 simplified tiers: Free, Standard, Enterprise. Commission-based model.
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PricingCard } from '@/components/pricing/PricingCard/PricingCard';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import {
  Check, Shield, Users, Zap, FileText, HeadphonesIcon,
  Building2, Lock, UserCheck, BarChart3, MessageSquare, Globe
} from 'lucide-react';
import commonStyles from './Pricing.common.module.css';
import lightStyles from './Pricing.light.module.css';
import darkStyles from './Pricing.dark.module.css';

const plans = [
  {
    tier: 'Free',
    description: 'For freelancers & clients getting started. Post projects, submit proposals — we take a small commission.',
    price: '0',
    pricePeriod: '/mo',
    features: [
      'Unlimited project browsing',
      'Up to 5 proposals per month',
      'Standard messaging',
      'Basic AI matching',
      'Community forum access',
      'Escrow payment protection',
      '8% platform commission',
    ],
    ctaText: 'Get Started Free',
    ctaLink: '/signup?plan=free',
  },
  {
    tier: 'Standard',
    description: 'For growing freelancers & clients who need more reach, better tools, and lower fees.',
    price: '$29',
    pricePeriod: '/mo',
    features: [
      'Everything in Free',
      'Unlimited proposals',
      'Priority project invites',
      'Verified badge on profile',
      'AI-powered proposal assistant',
      'Advanced search & filters',
      'Analytics dashboard',
      '5% platform commission',
    ],
    isPopular: true,
    ctaText: 'Upgrade to Standard',
    ctaLink: '/signup?plan=standard',
  },
  {
    tier: 'Enterprise',
    description: 'For companies needing dedicated talent, NDA agreements, staff augmentation, and full managed services.',
    price: 'Custom',
    pricePeriod: '',
    features: [
      'Everything in Standard',
      'Dedicated account manager',
      'NDA & legal agreements',
      'Staff augmentation services',
      'Custom talent sourcing',
      'Priority 24/7 support',
      'Custom SLA & onboarding',
      'Negotiable commission',
    ],
    ctaText: 'Contact Sales',
    ctaLink: '/contact?plan=enterprise',
  },
];

const comparisonFeatures = [
  { name: 'Post & Browse Projects', free: true, standard: true, enterprise: true },
  { name: 'Escrow Payment Protection', free: true, standard: true, enterprise: true },
  { name: 'AI-Powered Matching', free: 'Basic', standard: 'Advanced', enterprise: 'Custom' },
  { name: 'Monthly Proposals', free: '5', standard: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Verified Profile Badge', free: false, standard: true, enterprise: true },
  { name: 'Proposal Assistant (AI)', free: false, standard: true, enterprise: true },
  { name: 'Analytics Dashboard', free: false, standard: true, enterprise: true },
  { name: 'Priority Support', free: false, standard: true, enterprise: true },
  { name: 'Dedicated Account Manager', free: false, standard: false, enterprise: true },
  { name: 'NDA & Legal Agreements', free: false, standard: false, enterprise: true },
  { name: 'Staff Augmentation', free: false, standard: false, enterprise: true },
  { name: 'Custom Talent Sourcing', free: false, standard: false, enterprise: true },
  { name: 'Platform Commission', free: '8%', standard: '5%', enterprise: 'Negotiable' },
];

const faqs = [
  { q: 'How does the commission model work?', a: 'MegiLance charges a small commission on each successful project. On the Free plan it\'s 8%, Standard plan 5%, and Enterprise is negotiable. Clients and freelancers connect directly — we simply facilitate the match and secure the payment.' },
  { q: 'What is Staff Augmentation?', a: 'With our Enterprise plan, we source and embed dedicated freelancers into your team on a contract basis. This includes NDA agreements, managed onboarding, and ongoing support — like having an extended team without the overhead.' },
  { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade at any time. When upgrading, you get immediate access to the new features. When downgrading, your current plan stays active until the end of the billing period.' },
  { q: 'Is there a contract for the Enterprise plan?', a: 'Enterprise plans are based on custom agreements tailored to your needs. We work with you to define scope, SLAs, and pricing. Typical contracts are month-to-month or annual depending on your preference.' },
  { q: 'Are there any hidden fees?', a: 'No hidden fees. The commission is the only platform fee. Payment processing fees (Stripe) are standard. Enterprise clients may have custom billing arrangements.' },
];

const Pricing: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = { ...commonStyles, ...themeStyles };
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

      <main id="main-content" className={styles.root}>
        {/* Hero */}
        <ScrollReveal>
          <div className={styles.header}>
            <span className={commonStyles.heroBadge}>Simple & Transparent</span>
            <h1 className={styles.title}>Pick the plan that fits your workflow</h1>
            <p className={styles.subtitle}>
              No hidden fees. Freelancers and clients connect directly — we just take a small commission on completed projects.
            </p>
          </div>
        </ScrollReveal>

        {/* Plans Grid */}
        <StaggerContainer className={styles.grid}>
          {plans.map((tier) => (
            <StaggerItem key={tier.tier}>
              <PricingCard {...tier} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* How It Works */}
        <ScrollReveal delay={0.2}>
          <section className={commonStyles.howSection}>
            <h2 className={cn(commonStyles.sectionHeading, themeStyles.title)}>How It Works</h2>
            <div className={commonStyles.howGrid}>
              <div className={cn(commonStyles.howCard, themeStyles.howCard)}>
                <div className={cn(commonStyles.howIcon, themeStyles.howIcon)}><Users size={24} /></div>
                <h3 className={cn(commonStyles.howTitle, themeStyles.howTitle)}>Free &amp; Standard</h3>
                <p className={cn(commonStyles.howDesc, themeStyles.howDesc)}>
                  Clients post projects, freelancers apply. Both sides connect directly on the platform. We facilitate the process and secure payments via escrow. Commission is deducted automatically on project completion.
                </p>
              </div>
              <div className={cn(commonStyles.howCard, themeStyles.howCard)}>
                <div className={cn(commonStyles.howIcon, themeStyles.howIcon)}><Building2 size={24} /></div>
                <h3 className={cn(commonStyles.howTitle, themeStyles.howTitle)}>Enterprise</h3>
                <p className={cn(commonStyles.howDesc, themeStyles.howDesc)}>
                  We work as your talent partner. NDA agreements, staff augmentation, custom sourcing, and dedicated account management. You tell us what you need — we find and embed the right people into your team.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Feature Comparison Table */}
        <ScrollReveal delay={0.3}>
          <section className={commonStyles.comparisonSection}>
            <h2 className={cn(commonStyles.sectionHeading, themeStyles.title)}>Feature Comparison</h2>
            <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
              <table className={cn(commonStyles.comparisonTable, themeStyles.comparisonTable)}>
                <thead>
                  <tr>
                    <th className={cn(commonStyles.tableHead, themeStyles.tableHead)}>Feature</th>
                    <th className={cn(commonStyles.tableHead, commonStyles.tableHeadCenter, themeStyles.tableHead)}>Free</th>
                    <th className={cn(commonStyles.tableHead, commonStyles.tableHeadCenter, themeStyles.tableHead, commonStyles.tableHeadHighlight)}>Standard</th>
                    <th className={cn(commonStyles.tableHead, commonStyles.tableHeadCenter, themeStyles.tableHead)}>Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feat) => (
                    <tr key={feat.name} className={cn(commonStyles.tableRow, themeStyles.tableRow)}>
                      <td className={cn(commonStyles.tableCell, themeStyles.tableCell)}>{feat.name}</td>
                      {(['free', 'standard', 'enterprise'] as const).map((plan) => (
                        <td key={plan} className={cn(commonStyles.tableCell, commonStyles.tableCellCenter, themeStyles.tableCell)}>
                          {feat[plan] === true ? (
                            <Check size={18} className={commonStyles.checkIcon} />
                          ) : feat[plan] === false ? (
                            <span className={commonStyles.dashIcon}>—</span>
                          ) : (
                            <span className={commonStyles.cellText}>{feat[plan]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </ScrollReveal>

        {/* FAQ */}
        <ScrollReveal delay={0.4}>
          <section className={commonStyles.faqSection}>
            <h2 className={cn(commonStyles.sectionHeading, themeStyles.title)}>Frequently Asked Questions</h2>
            <div className={commonStyles.faqList}>
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={cn(commonStyles.faqItem, themeStyles.faqItem, openFaq === i && commonStyles.faqItemOpen)}
                >
                  <button
                    className={cn(commonStyles.faqQuestion, themeStyles.faqQuestion)}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    {faq.q}
                    <span className={commonStyles.faqChevron}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <p className={cn(commonStyles.faqAnswer, themeStyles.faqAnswer)}>{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.5}>
          <p className={styles.note}>All prices in USD. Enterprise plans billed on custom terms. Need help choosing? <a href="/contact" className={commonStyles.noteLink}>Talk to our team</a>.</p>
        </ScrollReveal>
      </main>
    </PageTransition>
  );
};

export default Pricing;
