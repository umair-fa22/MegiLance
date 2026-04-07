'use client';

// @AI-HINT: Dynamic Hero component for MegiLance redesign, strict 3-file CSS module.
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { cn } from '@/lib/utils';
// Note: assuming a standard Button is imported, if missing we would build it.
// Assuming we have some UI components
import commonStyles from './Hero.common.module.css';
import lightStyles from './Hero.light.module.css';
import darkStyles from './Hero.dark.module.css';

// Ideally, these would come from an API call such as: `const stats = await fetch('/api/v1/analytics/aggregates')`
const defaultStats = [
  { label: 'Active Projects', value: '12K+' },
  { label: 'Top Freelancers', value: '50K+' },
  { label: 'Saved in Fees', value: '$2M+' },
];

export default function Hero({ stats = defaultStats }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeStyles = (mounted && resolvedTheme === 'dark') ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.hero, themeStyles.hero)}>
      <div className={cn(commonStyles.content, themeStyles.content)}>
        
        <div className={cn(commonStyles.badges, themeStyles.badges)}>
          <span className={cn(commonStyles.badge, themeStyles.badge)}>
            ✨ AI-Powered Matching
          </span>
          <span className={cn(commonStyles.badge, themeStyles.badge)}>
            🛡️ Escrow Protection
          </span>
        </div>

        <h1 className={cn(commonStyles.title, themeStyles.title)}>
          Hire the best talent. <br />
          <span className={cn(commonStyles.highlight, themeStyles.highlight)}>Zero commission.</span>
        </h1>
        
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
          MegiLance is the #1 freelance platform where clients and vetted professionals 
          connect directly using real-time AI and completely transparent pricing.
        </p>

        <div className={cn(commonStyles.actions, themeStyles.actions)}>
          <Link href="/freelancers" className="btn btn-primary btn-lg">
            Find Talent
          </Link>
          <Link href="/explore" className="btn btn-outline btn-lg">
            Find Work
          </Link>
        </div>

        <div className={cn(commonStyles.stats, themeStyles.stats)}>
          {stats.map((stat, i) => (
            <div key={i} className={cn(commonStyles.statItem, themeStyles.statItem)}>
              <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stat.value}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{stat.label}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}