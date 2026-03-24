// @AI-HINT: A reusable card component for showcasing AI features with status badges and hover effects.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

import commonStyles from './AIShowcaseCard.common.module.css';
import lightStyles from './AIShowcaseCard.light.module.css';
import darkStyles from './AIShowcaseCard.dark.module.css';

interface AIShowcaseCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  stats: string;
  status?: 'live' | 'beta' | 'smart';
}

const AIShowcaseCard: React.FC<AIShowcaseCardProps> = ({ icon, title, description, stats, status = 'live' }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const statusConfig = {
    live: { label: 'Live', icon: <CheckCircle2 size={12} />, className: commonStyles.statusLive },
    beta: { label: 'Beta', icon: <Zap size={12} />, className: commonStyles.statusBeta },
    smart: { label: 'Smart', icon: <Zap size={12} />, className: commonStyles.statusSmart },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className={cn(commonStyles.card, themeStyles.card)}>
      <div className={cn(commonStyles.cardGlow, themeStyles.cardGlow)}></div>
      <div className={cn(commonStyles.cardBorder, themeStyles.cardBorder)}></div>
      <div className={cn(commonStyles.cardContent)}>
        {/* Status Badge */}
        <div className={cn(commonStyles.statusBadge, currentStatus.className)}>
          {currentStatus.icon}
          <span>{currentStatus.label}</span>
        </div>
        <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}>{icon}</div>
        <h3 className={cn(commonStyles.title, themeStyles.title)}>{title}</h3>
        <p className={cn(commonStyles.description, themeStyles.description)}>{description}</p>
        <div className={cn(commonStyles.footer, themeStyles.footer)}>
          <span className={cn(commonStyles.stats, themeStyles.stats)}>{stats}</span>
          <div className={cn(commonStyles.learnMore, themeStyles.learnMore)}>
            <ArrowRight className={cn(commonStyles.arrowIcon)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIShowcaseCard;
