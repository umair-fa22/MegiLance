// @AI-HINT: Client component for /hire/[skill] skill directory page
// Shows all industries for a specific skill with 3-file CSS module theming
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './HireSkill.common.module.css';
import lightStyles from './HireSkill.light.module.css';
import darkStyles from './HireSkill.dark.module.css';

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

interface HireSkillClientProps {
  skill: SkillData;
  industries: IndustryData[];
  relatedSkills: SkillData[];
}

export function HireSkillClient({ skill, industries, relatedSkills }: HireSkillClientProps) {
  const { resolvedTheme } = useTheme();
  const [mounted] = useState(true);

  if (!mounted || !resolvedTheme) {
    return (
      <div className={commonStyles.loadingContainer}>
        <div className={commonStyles.loadingSpinner} />
      </div>
    );
  }

  const themed = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <main className={cn(commonStyles.page, themed.page)}>
      {/* Hero */}
      <section className={cn(commonStyles.hero, themed.hero)}>
        <div className={commonStyles.heroContent}>
          <div className={commonStyles.breadcrumbs}>
            <Link href="/" className={themed.breadcrumbLink}>Home</Link>
            <span className={commonStyles.breadcrumbSeparator}>/</span>
            <Link href="/hire" className={themed.breadcrumbLink}>Hire</Link>
            <span className={commonStyles.breadcrumbSeparator}>/</span>
            <span className={themed.breadcrumbCurrent}>{skill.name}</span>
          </div>

          <h1 className={cn(commonStyles.heroTitle, themed.heroTitle)}>
            Hire Top <span className={themed.heroHighlight}>{skill.name}s</span>
          </h1>

          <p className={cn(commonStyles.heroSubtitle, themed.heroSubtitle)}>
            Find verified {skill.name}s on MegiLance. Browse by industry to find the
            perfect match for your project.
          </p>

          <div className={commonStyles.heroStats}>
            <div className={cn(commonStyles.statItem, themed.statItem)}>
              <span className={commonStyles.statValue}>${skill.avgRate}/hr</span>
              <span className={cn(commonStyles.statLabel, themed.statLabel)}>Average Rate</span>
            </div>
            <div className={cn(commonStyles.statItem, themed.statItem)}>
              <span className={commonStyles.statValue}>{skill.category}</span>
              <span className={cn(commonStyles.statLabel, themed.statLabel)}>Category</span>
            </div>
            <div className={cn(commonStyles.statItem, themed.statItem)}>
              <span className={commonStyles.statValue}>Browse</span>
              <span className={cn(commonStyles.statLabel, themed.statLabel)}>Available Talent</span>
            </div>
          </div>

          <div className={commonStyles.heroCta}>
            <Link href="/signup?role=client">
              <Button variant="primary" size="lg">
                Hire a {skill.name}
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

      {/* Industries */}
      <section className={cn(commonStyles.section, themed.section)}>
        <h2 className={cn(commonStyles.sectionTitle, themed.sectionTitle)}>
          Hire {skill.name}s by Industry
        </h2>
        <div className={commonStyles.industriesGrid}>
          {industries.map((industry) => (
            <Link
              key={industry.slug}
              href={`/hire/${skill.slug}/${industry.slug}`}
              className={cn(commonStyles.industryCard, themed.industryCard)}
            >
              <span className={commonStyles.industryIcon}>{industry.icon}</span>
              <div className={commonStyles.industryInfo}>
                <span className={cn(commonStyles.industryName, themed.industryName)}>
                  {industry.name}
                </span>
                <span className={cn(commonStyles.industryGrowth, themed.industryGrowth)}>
                  {industry.growth} demand
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <section className={cn(commonStyles.section, themed.section)}>
          <h2 className={cn(commonStyles.sectionTitle, themed.sectionTitle)}>
            Related Skills
          </h2>
          <div className={commonStyles.relatedGrid}>
            {relatedSkills.map((relSkill) => (
              <Link
                key={relSkill.slug}
                href={`/hire/${relSkill.slug}`}
                className={cn(commonStyles.relatedCard, themed.relatedCard)}
              >
                <span className={themed.relatedName}>{relSkill.name}</span>
                <span className={themed.relatedRate}>${relSkill.avgRate}/hr</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={cn(commonStyles.ctaSection, themed.ctaSection)}>
        <h2 className={cn(commonStyles.ctaTitle, themed.ctaTitle)}>
          Ready to Hire a {skill.name}?
        </h2>
        <p className={themed.ctaSubtitle}>
          Post your project for free and start receiving proposals in minutes.
        </p>
        <Link href="/signup?role=client">
          <Button variant="primary" size="lg">
            Get Started Free
          </Button>
        </Link>
      </section>
    </main>
  );
}
