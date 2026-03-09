// @AI-HINT: Action-oriented Hero — search bar, popular categories, and clear value props. Designed like Upwork/Toptal for real-world usability.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  Search,
  ShieldCheck, 
  Zap,
  CheckCircle2,
  Code,
  Palette,
  Smartphone,
  BarChart3,
  PenTool,
  Video
} from 'lucide-react';

import Button from '@/app/components/Button/Button';

import commonStyles from './Hero.common.module.css';
import lightStyles from './Hero.light.module.css';
import darkStyles from './Hero.dark.module.css';

const POPULAR_CATEGORIES = [
  { label: 'Web Development', icon: Code, href: '/explore?category=web-development' },
  { label: 'UI/UX Design', icon: Palette, href: '/explore?category=ui-ux-design' },
  { label: 'Mobile Apps', icon: Smartphone, href: '/explore?category=mobile-apps' },
  { label: 'Data Science', icon: BarChart3, href: '/explore?category=data-science' },
  { label: 'Content Writing', icon: PenTool, href: '/explore?category=content-writing' },
  { label: 'Video & Animation', icon: Video, href: '/explore?category=video-animation' },
];

const Hero: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  if (!mounted) {
    return (
      <section className={cn(commonStyles.heroContainer)} aria-label="Hero">
        <div className={commonStyles.contentWrapper}>
          <div className={commonStyles.loadingContainer}>
            <div className={commonStyles.loadingSpinner} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={cn(commonStyles.heroContainer, styles.heroContainer)}
      aria-label="Find freelance talent or work"
    >
      {/* Background */}
      <div className={cn(commonStyles.meshBackground, styles.meshBackground)} />

      <div className={commonStyles.contentWrapper}>
        {/* Main headline — direct and clear */}
        <h1 className={cn(commonStyles.mainHeading, styles.mainHeading)}>
          <span className={commonStyles.headingLine}>Hire expert freelancers</span>
          <span className={cn(commonStyles.headingGradient, styles.headingGradient)}>
            for any project
          </span>
        </h1>

        {/* Short, direct value prop */}
        <p className={cn(commonStyles.subheading, styles.subheading)}>
          Post a project, get matched with vetted professionals in minutes. 
          Secure payments, milestone tracking, and AI-powered talent matching included.
        </p>

        {/* Search bar — the primary action */}
        <form onSubmit={handleSearch} className={cn(commonStyles.searchForm, styles.searchForm)} role="search">
          <div className={cn(commonStyles.searchInputWrapper, styles.searchInputWrapper)}>
            <Search size={20} className={cn(commonStyles.searchIcon, styles.searchIcon)} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Try "React developer", "Logo design", "SEO expert"...'
              className={cn(commonStyles.searchInput, styles.searchInput)}
              aria-label="Search for freelancers or projects"
            />
            <Button 
              type="submit" 
              variant="primary" 
              size="md"
              className={cn(commonStyles.searchButton, styles.searchButton)}
            >
              Search
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>

        {/* Quick popular searches */}
        <div className={cn(commonStyles.popularSearches, styles.popularSearches)}>
          <span className={cn(commonStyles.popularLabel, styles.popularLabel)}>Popular:</span>
          {['React Developer', 'WordPress', 'Logo Design', 'Python', 'Content Writer'].map((term) => (
            <Link 
              key={term} 
              href={`/explore?q=${encodeURIComponent(term)}`}
              className={cn(commonStyles.popularTag, styles.popularTag)}
            >
              {term}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className={commonStyles.ctaGroup}>
          <Link href="/signup?role=client">
            <Button variant="primary" size="lg" className={cn(commonStyles.primaryCta, styles.primaryCta)}>
              Post a Project — It&apos;s Free
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="/signup?role=freelancer">
            <Button variant="outline" size="lg" className={cn(commonStyles.secondaryCta, styles.secondaryCta)}>
              Earn as a Freelancer
            </Button>
          </Link>
        </div>

        {/* Value props — concrete benefits, not vague marketing */}
        <div className={cn(commonStyles.valueProps, styles.valueProps)}>
          <div className={cn(commonStyles.valueProp, styles.valueProp)}>
            <CheckCircle2 size={16} />
            <span>No upfront fees</span>
          </div>
          <div className={cn(commonStyles.valueProp, styles.valueProp)}>
            <ShieldCheck size={16} />
            <span>Escrow payment protection</span>
          </div>
          <div className={cn(commonStyles.valueProp, styles.valueProp)}>
            <Zap size={16} />
            <span>AI-matched in under 24h</span>
          </div>
        </div>

        {/* Browse by category — actionable grid */}
        <div className={cn(commonStyles.categoriesSection, styles.categoriesSection)}>
          <h2 className={cn(commonStyles.categoriesTitle, styles.categoriesTitle)}>
            Browse by category
          </h2>
          <div className={commonStyles.categoriesGrid}>
            {POPULAR_CATEGORIES.map(({ label, icon: Icon, href }) => (
              <Link key={label} href={href} className={cn(commonStyles.categoryCard, styles.categoryCard)}>
                <Icon size={24} className={cn(commonStyles.categoryIcon, styles.categoryIcon)} />
                <span className={cn(commonStyles.categoryLabel, styles.categoryLabel)}>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;