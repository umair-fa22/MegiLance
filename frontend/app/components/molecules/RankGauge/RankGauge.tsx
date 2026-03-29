// @AI-HINT: This component displays a dynamic semi-circle gauge. All styles are per-component only.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './RankGauge.common.module.css';
import lightStyles from './RankGauge.light.module.css';
import darkStyles from './RankGauge.dark.module.css';

// @AI-HINT: This component displays a dynamic semi-circle gauge using CSS modules and custom properties.

interface RankGaugeProps {
  score: number; // A score from 0 to 100
  className?: string;
}

const RankGauge: React.FC<RankGaugeProps> = ({ score, className }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const safeScore = Math.min(100, Math.max(0, score || 0));
  const rotation = (safeScore / 100) * 180;

  return (
    <div className={cn(commonStyles.rankGauge, className)}>
      <div className={cn(commonStyles.fill, themeStyles.fill)} data-rotation={rotation}></div>
      <div className={cn(commonStyles.cover, themeStyles.cover)}></div>
      <span className={cn(commonStyles.score, themeStyles.score)}>{safeScore}</span>
    </div>
  );
};

export default RankGauge;
