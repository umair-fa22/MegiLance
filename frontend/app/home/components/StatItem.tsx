// @AI-HINT: The StatItem component displays a single, animated statistic. It uses the useAnimatedCounter hook for a dynamic effect and has its own theme-aware styling.
'use client';

import React, { useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import useAnimatedCounter from '@/hooks/useAnimatedCounter';

import commonStyles from './StatItem.common.module.css';
import lightStyles from './StatItem.light.module.css';
import darkStyles from './StatItem.dark.module.css';

interface StatItemProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
}

const StatItem: React.FC<StatItemProps> = ({ value, label, prefix = '', suffix = '', icon }) => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const ref = useRef<HTMLDivElement>(null);
  const animatedValue = useAnimatedCounter(value, 2000, 0, ref);

  const formattedValue = new Intl.NumberFormat('en-US').format(Number(animatedValue));

  return (
    <div className={cn(commonStyles.statItem, styles.statItem)} ref={ref}>
      {icon && <div className={commonStyles.statIcon}>{icon}</div>}
      <span className={cn(commonStyles.statValue, styles.statValue)}>
        {prefix}{formattedValue}{suffix}+
      </span>
      <span className={cn(commonStyles.statLabel, styles.statLabel)}>
        {label}
      </span>
    </div>
  );
};

export default StatItem;
