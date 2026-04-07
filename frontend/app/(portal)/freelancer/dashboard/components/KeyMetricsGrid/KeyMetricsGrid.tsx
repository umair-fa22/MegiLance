// @AI-HINT: Premium KeyMetricsGrid used by the Freelancer Dashboard to display key KPIs with animated counters and trend indicators.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  DollarSign, 
  Briefcase, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import commonStyles from './KeyMetricsGrid.common.module.css';
import lightStyles from './KeyMetricsGrid.light.module.css';
import darkStyles from './KeyMetricsGrid.dark.module.css';

export interface AnalyticsData {
  totalEarnings?: number | string;
  activeProjects?: number;
  completedProjects?: number;
  pendingProposals?: number;
}

export interface KeyMetricsGridProps {
  analytics?: AnalyticsData;
  loading?: boolean;
}

const delayClasses = ['delay0', 'delay1', 'delay2', 'delay3'] as const;

const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ analytics, loading }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (loading) {
    return (
      <div 
        role="status" 
        aria-busy="true" 
        className={cn(commonStyles.grid, themeStyles.grid)}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              commonStyles.card, 
              commonStyles.skeleton, 
              themeStyles.card,
              commonStyles[delayClasses[i]]
            )}
          >
            <div className={commonStyles.skeletonIcon} />
            <div className={commonStyles.skeletonContent}>
              <div className={commonStyles.skeletonLabel} />
              <div className={commonStyles.skeletonValue} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalEarnings = analytics?.totalEarnings ?? '$0';
  const activeProjects = analytics?.activeProjects ?? 0;
  const completedProjects = analytics?.completedProjects ?? 0;
  const pendingProposals = analytics?.pendingProposals ?? 0;

  const items = [
    { 
      label: 'Total Earnings', 
      value: typeof totalEarnings === 'number' ? `$${totalEarnings.toLocaleString()}` : totalEarnings, 
      icon: DollarSign, 
      trend: '+12.5%', 
      positive: true,
      color: 'success' 
    },
    { 
      label: 'Active Projects', 
      value: String(activeProjects), 
      icon: Briefcase, 
      trend: activeProjects > 0 ? '+' + activeProjects : '0', 
      positive: activeProjects > 0,
      color: 'primary' 
    },
    { 
      label: 'Completed', 
      value: String(completedProjects), 
      icon: CheckCircle, 
      trend: completedProjects > 0 ? '+' + completedProjects : '0', 
      positive: true,
      color: 'accent' 
    },
    { 
      label: 'Pending Proposals', 
      value: String(pendingProposals), 
      icon: FileText, 
      trend: pendingProposals > 0 ? pendingProposals + ' active' : 'None', 
      positive: pendingProposals > 0,
      color: 'warning' 
    },
  ];

  return (
    <section 
      aria-label="Key metrics" 
      className={cn(commonStyles.grid, themeStyles.grid)}
    >
      {items.map((item, idx) => (
        <div 
          key={idx} 
          className={cn(
            commonStyles.card, 
            themeStyles.card, 
            themeStyles[item.color],
            commonStyles[delayClasses[idx]]
          )}
        >
          <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper, themeStyles[`${item.color}Icon`])}>
            <item.icon size={22} strokeWidth={2} />
          </div>
          <div className={commonStyles.content}>
            <span className={cn(commonStyles.label, themeStyles.label)}>{item.label}</span>
            <div className={commonStyles.valueRow}>
              <span className={cn(commonStyles.value, themeStyles.value)}>{item.value}</span>
              <span className={cn(
                commonStyles.trend, 
                themeStyles.trend,
                item.positive ? commonStyles.positive : commonStyles.negative
              )}>
                {item.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {item.trend}
              </span>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default KeyMetricsGrid;
