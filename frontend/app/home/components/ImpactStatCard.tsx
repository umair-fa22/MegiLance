// @AI-HINT: This component displays an animated statistic for the GlobalImpact section.

'use client';

import React, { useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useAnimatedCounter from '@/hooks/useAnimatedCounter'; // Assuming this hook exists and works

import commonStyles from './ImpactStatCard.common.module.css';
import lightStyles from './ImpactStatCard.light.module.css';
import darkStyles from './ImpactStatCard.dark.module.css';

// --- Type Definitions ---
interface ImpactStat {
  icon: React.ElementType;
  number: string;
  label: string;
  description: string;
}

interface ImpactStatCardProps {
  stat: ImpactStat;
}

// --- Main Component ---
const ImpactStatCard: React.FC<ImpactStatCardProps> = ({ stat }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const { icon: Icon, number, label, description } = stat;

  // --- Animated Counter Logic ---
  const match = number.match(/^([$]?)([,\d.]+)([KkMmBb]?\+?|\/5)?$/) || [];
  const prefix = match[1] || '';
  const targetValue = parseFloat((match[2] || '0').replace(/,/g, ''));
  const suffix = match[3] || '';
  const decimals = (match[2] || '').includes('.') ? (match[2] || '').split('.')[1].length : 0;
  const animatedValue = useAnimatedCounter(targetValue, 2500, decimals, ref);

  return (
    <div ref={ref} className={cn(commonStyles.stat, themeStyles.stat)}>
      <div className={cn(commonStyles.statIcon, themeStyles.statIcon)}>
        <Icon />
      </div>
      <div className={commonStyles.statContent}>
        <p className={cn(commonStyles.statNumber, themeStyles.statNumber)}>
          {prefix}{animatedValue}{suffix}
        </p>
        <h4 className={cn(commonStyles.statLabel, themeStyles.statLabel)}>{label}</h4>
        <p className={cn(commonStyles.statDescription, themeStyles.statDescription)}>{description}</p>
      </div>
    </div>
  );
};

export default ImpactStatCard;
