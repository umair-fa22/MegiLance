// @AI-HINT: Reusable social proof strip — stats, guarantees, and trust badges for landing pages
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ShieldCheck, Star, Users, Zap, Award, Lock } from 'lucide-react';
import commonStyles from './TrustStrip.common.module.css';
import lightStyles from './TrustStrip.light.module.css';
import darkStyles from './TrustStrip.dark.module.css';

type Variant = 'stats' | 'guarantees' | 'compact';

interface TrustStripProps {
  variant?: Variant;
}

const stats = [
  { icon: <Users size={20} />, value: '50,000+', label: 'Projects Completed' },
  { icon: <Star size={20} />, value: '4.9/5', label: 'Client Satisfaction' },
  { icon: <Zap size={20} />, value: '24h', label: 'Average Time to Hire' },
  { icon: <Award size={20} />, value: '100K+', label: 'Verified Freelancers' },
];

const guarantees = [
  { icon: <ShieldCheck size={20} />, text: 'Escrow Payment Protection' },
  { icon: <Lock size={20} />, text: 'NDA & IP Protection' },
  { icon: <Star size={20} />, text: '100% Satisfaction Guarantee' },
  { icon: <Zap size={20} />, text: '0% Commission' },
];

export default function TrustStrip({ variant = 'stats' }: TrustStripProps) {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const theme = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (variant === 'guarantees') {
    return (
      <div className={cn(commonStyles.strip, theme.strip)}>
        <div className={commonStyles.inner}>
          {guarantees.map((g) => (
            <div key={g.text} className={cn(commonStyles.guarantee, theme.guarantee)}>
              <span className={cn(commonStyles.gIcon, theme.gIcon)}>{g.icon}</span>
              <span className={cn(commonStyles.gText, theme.gText)}>{g.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(commonStyles.compact, theme.compact)}>
        <span className={cn(commonStyles.compactItem, theme.compactItem)}>
          <ShieldCheck size={16} /> Secure Payments
        </span>
        <span className={cn(commonStyles.compactItem, theme.compactItem)}>
          <Star size={16} /> 4.9/5 Rating
        </span>
        <span className={cn(commonStyles.compactItem, theme.compactItem)}>
          <Zap size={16} /> 0% Commission
        </span>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.strip, theme.strip)}>
      <div className={commonStyles.inner}>
        {stats.map((s) => (
          <div key={s.label} className={cn(commonStyles.stat, theme.stat)}>
            <span className={cn(commonStyles.statIcon, theme.statIcon)}>{s.icon}</span>
            <span className={cn(commonStyles.statValue, theme.statValue)}>{s.value}</span>
            <span className={cn(commonStyles.statLabel, theme.statLabel)}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
