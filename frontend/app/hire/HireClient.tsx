// @AI-HINT: Client component for hire directory page with proper 3-file CSS module theme support
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import commonStyles from './Hire.common.module.css';
import lightStyles from './Hire.light.module.css';
import darkStyles from './Hire.dark.module.css';

const SKILL_CATEGORIES: Record<string, { slug: string; name: string; avgRate: number }[]> = {
  'Development': [
    { slug: 'react-developer', name: 'React Developer', avgRate: 75 },
    { slug: 'python-developer', name: 'Python Developer', avgRate: 80 },
    { slug: 'nodejs-developer', name: 'Node.js Developer', avgRate: 70 },
    { slug: 'fullstack-developer', name: 'Full Stack Developer', avgRate: 85 },
    { slug: 'mobile-developer', name: 'Mobile Developer', avgRate: 85 },
    { slug: 'flutter-developer', name: 'Flutter Developer', avgRate: 75 },
    { slug: 'angular-developer', name: 'Angular Developer', avgRate: 70 },
    { slug: 'vue-developer', name: 'Vue.js Developer', avgRate: 70 },
  ],
  'Design': [
    { slug: 'ui-ux-designer', name: 'UI/UX Designer', avgRate: 65 },
    { slug: 'graphic-designer', name: 'Graphic Designer', avgRate: 50 },
  ],
  'Data & AI': [
    { slug: 'data-scientist', name: 'Data Scientist', avgRate: 95 },
    { slug: 'machine-learning-engineer', name: 'Machine Learning Engineer', avgRate: 100 },
  ],
  'Infrastructure': [
    { slug: 'devops-engineer', name: 'DevOps Engineer', avgRate: 90 },
    { slug: 'aws-architect', name: 'AWS Solutions Architect', avgRate: 120 },
  ],
  'CMS & E-commerce': [
    { slug: 'wordpress-developer', name: 'WordPress Developer', avgRate: 50 },
    { slug: 'shopify-developer', name: 'Shopify Developer', avgRate: 60 },
  ],
  'Marketing & Content': [
    { slug: 'content-writer', name: 'Content Writer', avgRate: 40 },
    { slug: 'seo-specialist', name: 'SEO Specialist', avgRate: 55 },
    { slug: 'video-editor', name: 'Video Editor', avgRate: 45 },
  ],
  'Emerging Tech': [
    { slug: 'blockchain-developer', name: 'Blockchain Developer', avgRate: 110 },
  ],
};

const TOP_INDUSTRIES = [
  { slug: 'healthcare', name: 'Healthcare', icon: '🏥' },
  { slug: 'fintech', name: 'FinTech', icon: '💰' },
  { slug: 'ecommerce', name: 'E-commerce', icon: '🛒' },
  { slug: 'saas', name: 'SaaS', icon: '☁️' },
  { slug: 'startup', name: 'Startups', icon: '🚀' },
  { slug: 'ai', name: 'AI & ML', icon: '🤖' },
];

export default function HireClient() {
  const { resolvedTheme } = useTheme();

  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={450} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={350} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={12} className="absolute inset-0" />
        <div className="absolute top-32 left-16 opacity-10">
          <FloatingCube size={55} />
        </div>
        <div className="absolute bottom-40 right-16 opacity-10">
          <FloatingSphere size={45} />
        </div>
      </div>
    <main className={cn(commonStyles.page, themed.page)}>
      {/* Hero */}
      <ScrollReveal>
      <section className={cn(commonStyles.hero, themed.hero)}>
        <h1 className={cn(commonStyles.heroTitle, themed.heroTitle)}>
          Hire Top Freelancers
        </h1>
        <p className={cn(commonStyles.heroSubtitle, themed.heroSubtitle)}>
          Browse our directory of verified freelancers by skill and industry.
          Find the perfect match for your project.
        </p>
      </section>
      </ScrollReveal>

      {/* Skills by Category */}
      <section className={commonStyles.skillsSection}>
        <ScrollReveal>
        <h2 className={cn(commonStyles.skillsSectionTitle, themed.skillsSectionTitle)}>
          Browse by Skill
        </h2>
        </ScrollReveal>
        
        {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
          <ScrollReveal key={category}>
          <div className={commonStyles.categoryGroup}>
            <h3 className={cn(commonStyles.categoryTitle, themed.categoryTitle)}>
              {category}
            </h3>
            <div className={commonStyles.skillsGrid}>
              {skills.map((skill) => (
                <Link
                  key={skill.slug}
                  href={`/hire/${skill.slug}`}
                  className={cn(commonStyles.skillCard, themed.skillCard)}
                >
                  <div className={cn(commonStyles.skillName, themed.skillName)}>
                    {skill.name}
                  </div>
                  <div className={cn(commonStyles.skillRate, themed.skillRate)}>
                    From ${skill.avgRate}/hr
                  </div>
                </Link>
              ))}
            </div>
          </div>
          </ScrollReveal>
        ))}
      </section>

      {/* Top Industries */}
      <ScrollReveal>
      <section className={cn(commonStyles.industriesSection, themed.industriesSection)}>
        <h2 className={cn(commonStyles.industriesSectionTitle, themed.industriesSectionTitle)}>
          Popular Industries
        </h2>
        <div className={commonStyles.industriesGrid}>
          {TOP_INDUSTRIES.map((industry) => (
            <Link
              key={industry.slug}
              href={`/hire/react-developer/${industry.slug}`}
              className={cn(commonStyles.industryCard, themed.industryCard)}
            >
              <span className={commonStyles.industryEmoji}>{industry.icon}</span>
              <span className={cn(commonStyles.industryName, themed.industryName)}>
                {industry.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal>
      <section className={commonStyles.ctaSection}>
        <h2 className={cn(commonStyles.ctaTitle, themed.ctaTitle)}>
          Ready to Start Your Project?
        </h2>
        <p className={cn(commonStyles.ctaText, themed.ctaText)}>
          Post your project for free and receive proposals within hours.
        </p>
        <Link href="/signup?role=client" className={cn(commonStyles.ctaButton, themed.ctaButton)}>
          Post a Project
        </Link>
      </section>
      </ScrollReveal>
    </main>
    </PageTransition>
  );
}
