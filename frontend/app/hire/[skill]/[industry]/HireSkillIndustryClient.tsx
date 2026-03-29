// @AI-HINT: Client component for programmatic SEO hire pages
// Handles theming and interactive elements for /hire/[skill]/[industry]

'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './HireSkillIndustry.common.module.css';
import lightStyles from './HireSkillIndustry.light.module.css';
import darkStyles from './HireSkillIndustry.dark.module.css';

interface SkillData {
  slug: string;
  name: string;
  category: string;
  avgRate: number;
}

interface IndustryData {
  slug: string;
  name: string;
  icon: string;
  growth: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface Freelancer {
  id: number;
  name: string;
  avatar: string | null;
  rating: number;
  completedJobs: number;
  rate: number;
  headline: string;
}

interface HireSkillIndustryClientProps {
  skill: SkillData;
  industry: IndustryData;
  relatedSkills: SkillData[];
  relatedIndustries: IndustryData[];
  faqs: FAQ[];
  freelancers: Freelancer[];
}

export function HireSkillIndustryClient({
  skill,
  industry,
  relatedSkills,
  relatedIndustries,
  faqs,
  freelancers,
}: HireSkillIndustryClientProps) {
  const { resolvedTheme } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useState(() => {
    setMounted(true);
  });

  if (!mounted || !resolvedTheme) {
    return (
      <div className={commonStyles.loadingContainer}>
        <div className={commonStyles.loadingSpinner}></div>
      </div>
    );
  }

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Use passed freelancers or fallback to empty array
  const featuredFreelancers = freelancers.length > 0 ? freelancers : [];

  return (
    <main className={cn(commonStyles.page, themeStyles.page)}>
      {/* Hero Section */}
      <section className={cn(commonStyles.hero, themeStyles.hero)}>
        <div className={commonStyles.heroContent}>
          <div className={commonStyles.breadcrumbs}>
            <Link href="/" className={cn(commonStyles.breadcrumbLink, themeStyles.breadcrumbLink)}>
              Home
            </Link>
            <span className={commonStyles.breadcrumbSeparator}>/</span>
            <Link href="/talent" className={cn(commonStyles.breadcrumbLink, themeStyles.breadcrumbLink)}>
              Talent
            </Link>
            <span className={commonStyles.breadcrumbSeparator}>/</span>
            <span className={themeStyles.breadcrumbCurrent}>{skill.name}</span>
          </div>

          <h1 className={cn(commonStyles.heroTitle, themeStyles.heroTitle)}>
            Hire Top {skill.name}s for{' '}
            <span className={themeStyles.heroHighlight}>{industry.name}</span>
          </h1>

          <p className={cn(commonStyles.heroSubtitle, themeStyles.heroSubtitle)}>
            Find expert {skill.name}s with specialized experience in {industry.name}.
            Starting at ${Math.round(skill.avgRate * 0.6)}/hr.
          </p>

          <div className={commonStyles.heroStats}>
            <div className={cn(commonStyles.statItem, themeStyles.statItem)}>
              <span className={commonStyles.statValue}>Browse</span>
              <span className={commonStyles.statLabel}>{skill.name}s Available</span>
            </div>
            <div className={cn(commonStyles.statItem, themeStyles.statItem)}>
              <span className={commonStyles.statValue}>${skill.avgRate}/hr</span>
              <span className={commonStyles.statLabel}>Average Rate</span>
            </div>
            <div className={cn(commonStyles.statItem, themeStyles.statItem)}>
              <span className={commonStyles.statValue}>Fast</span>
              <span className={commonStyles.statLabel}>Avg Response Time</span>
            </div>
          </div>

          <div className={commonStyles.heroCta}>
            <Link href="/signup?role=client">
              <Button variant="primary" size="lg">
                Find a {skill.name} Now
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" size="lg">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Freelancers */}
      <section className={cn(commonStyles.section, themeStyles.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
          Top {skill.name}s in {industry.name}
        </h2>
        <div className={commonStyles.freelancerGrid}>
          {featuredFreelancers.map((freelancer) => (
            <article
              key={freelancer.id}
              className={cn(commonStyles.freelancerCard, themeStyles.freelancerCard)}
            >
              <div className={commonStyles.freelancerHeader}>
                <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                  {freelancer.name.charAt(0)}
                </div>
                <div className={commonStyles.freelancerInfo}>
                  <h3 className={themeStyles.freelancerName}>{freelancer.name}</h3>
                  <p className={themeStyles.freelancerHeadline}>{freelancer.headline}</p>
                </div>
              </div>
              <div className={commonStyles.freelancerStats}>
                <span className={cn(commonStyles.rating, themeStyles.rating)}>
                  ⭐ {freelancer.rating}
                </span>
                <span className={themeStyles.jobCount}>
                  {freelancer.completedJobs} jobs
                </span>
                <span className={themeStyles.rate}>
                  ${freelancer.rate}/hr
                </span>
              </div>
              <Link href={`/talent/${freelancer.id}`}>
                <Button variant="secondary" fullWidth>
                  View Profile
                </Button>
              </Link>
            </article>
          ))}
        </div>
        <div className={commonStyles.viewMore}>
          <Link href={`/talent?skill=${skill.slug}&industry=${industry.slug}`}>
            <Button variant="ghost">
              View All {skill.name}s →
            </Button>
          </Link>
        </div>
      </section>

      {/* Why Hire Section */}
      <section className={cn(commonStyles.section, themeStyles.whySection)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
          Why Hire a {skill.name} for {industry.name}?
        </h2>
        <div className={commonStyles.benefitsGrid}>
          <div className={cn(commonStyles.benefitCard, themeStyles.benefitCard)}>
            <span className={commonStyles.benefitIcon}>🎯</span>
            <h3 className={themeStyles.benefitTitle}>Industry Expertise</h3>
            <p className={themeStyles.benefitDesc}>
              Our {skill.name}s understand {industry.name} regulations, best practices, and unique challenges.
            </p>
          </div>
          <div className={cn(commonStyles.benefitCard, themeStyles.benefitCard)}>
            <span className={commonStyles.benefitIcon}>⚡</span>
            <h3 className={themeStyles.benefitTitle}>Faster Time to Market</h3>
            <p className={themeStyles.benefitDesc}>
              Skip the learning curve with freelancers who already know {industry.name}.
            </p>
          </div>
          <div className={cn(commonStyles.benefitCard, themeStyles.benefitCard)}>
            <span className={commonStyles.benefitIcon}>💰</span>
            <h3 className={themeStyles.benefitTitle}>Cost Effective</h3>
            <p className={themeStyles.benefitDesc}>
              Pay only for what you need. No long-term commitments, no overhead costs.
            </p>
          </div>
          <div className={cn(commonStyles.benefitCard, themeStyles.benefitCard)}>
            <span className={commonStyles.benefitIcon}>🔒</span>
            <h3 className={themeStyles.benefitTitle}>Secure & Protected</h3>
            <p className={themeStyles.benefitDesc}>
              Escrow payments, NDA protection, and dispute resolution for your peace of mind.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={cn(commonStyles.section, themeStyles.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
          Frequently Asked Questions
        </h2>
        <div className={commonStyles.faqList}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={cn(commonStyles.faqItem, themeStyles.faqItem)}
            >
              <button
                className={cn(commonStyles.faqQuestion, themeStyles.faqQuestion)}
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                aria-expanded={expandedFaq === index}
              >
                <span>{faq.question}</span>
                <span className={commonStyles.faqToggle}>
                  {expandedFaq === index ? '−' : '+'}
                </span>
              </button>
              {expandedFaq === index && (
                <div className={cn(commonStyles.faqAnswer, themeStyles.faqAnswer)}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Related Skills */}
      <section className={cn(commonStyles.section, themeStyles.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
          Related Skills in {industry.name}
        </h2>
        <div className={commonStyles.relatedGrid}>
          {relatedSkills.map((relSkill) => (
            <Link
              key={relSkill.slug}
              href={`/hire/${relSkill.slug}/${industry.slug}`}
              className={cn(commonStyles.relatedCard, themeStyles.relatedCard)}
            >
              <span className={themeStyles.relatedName}>{relSkill.name}</span>
              <span className={themeStyles.relatedRate}>${relSkill.avgRate}/hr</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Related Industries */}
      <section className={cn(commonStyles.section, themeStyles.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
          Hire {skill.name}s in Other Industries
        </h2>
        <div className={commonStyles.relatedGrid}>
          {relatedIndustries.map((relIndustry) => (
            <Link
              key={relIndustry.slug}
              href={`/hire/${skill.slug}/${relIndustry.slug}`}
              className={cn(commonStyles.relatedCard, themeStyles.relatedCard)}
            >
              <span className={commonStyles.industryIcon}>{relIndustry.icon}</span>
              <span className={themeStyles.relatedName}>{relIndustry.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={cn(commonStyles.ctaSection, themeStyles.ctaSection)}>
        <h2 className={cn(commonStyles.ctaTitle, themeStyles.ctaTitle)}>
          Ready to Hire a {skill.name}?
        </h2>
        <p className={themeStyles.ctaSubtitle}>
          Post your project for free and start receiving proposals in minutes.
        </p>
        <Link href="/signup?role=client">
          <Button variant="primary" size="lg">
            Get Started Free
          </Button>
        </Link>
      </section>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: `Hire ${skill.name} for ${industry.name}`,
            description: `Find expert ${skill.name}s specializing in ${industry.name} on MegiLance`,
            provider: {
              '@type': 'Organization',
              name: 'MegiLance',
              url: 'https://megilance.com',
            },
            serviceType: skill.name,
            areaServed: 'Worldwide',
            offers: {
              '@type': 'Offer',
              price: skill.avgRate,
              priceCurrency: 'USD',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: skill.avgRate,
                priceCurrency: 'USD',
                unitCode: 'HUR',
              },
            },
          }),
        }}
      />
    </main>
  );
}
