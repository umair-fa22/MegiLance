// @AI-HINT: Dashboard stat card with value, trend direction, sparkline chart, and icon. Accessible and theme-aware.
'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import KPISparkline from '@/app/components/organisms/KPISparkline/KPISparkline';
import commonStyles from './StatCard.common.module.css';
import lightStyles from './StatCard.light.module.css';
import darkStyles from './StatCard.dark.module.css';

export interface StatCardProps {
  /** Card title / metric name */
  title: string;
  /** Display value (formatted string) */
  value: string;
  /** Trend percentage (positive = up, negative = down, 0 = neutral) */
  trend?: number;
  /** Trend comparison label */
  trendLabel?: string;
  /** Icon component to display */
  icon: React.ElementType;
  /** Additional class names */
  className?: string;
  /** Mini sparkline data points */
  sparklineData?: number[];
  /** Sparkline colour variant */
  sparklineColor?: 'primary' | 'success' | 'warning' | 'danger';
  /** Optional link — makes the card clickable */
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendLabel = 'vs last month',
  icon: Icon,
  className,
  sparklineData,
  sparklineColor = 'primary',
  href,
}) => {
  const { resolvedTheme } = useTheme();

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const trendDirection = isPositive ? 'up' : isNegative ? 'down' : 'unchanged';
  const trendAriaLabel = trend !== undefined
    ? `${Math.abs(trend)}% ${trendDirection} ${trendLabel}`
    : undefined;

  const Wrapper = href 
    ? ({ children }: { children: React.ReactNode }) => <Link href={href} style={{ textDecoration: 'none' }}>{children}</Link>
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <Wrapper>
      <article
        className={cn(commonStyles.card, themeStyles.card, href && commonStyles.cardLink, className)}
        aria-label={`${title}: ${value}`}
      >
        <div className={commonStyles.header}>
          <span className={cn(commonStyles.title, themeStyles.title)}>{title}</span>
          <div
            className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}
            aria-hidden="true"
          >
            <Icon size={20} />
          </div>
        </div>
        <div className={commonStyles.content}>
          <div className={cn(commonStyles.value, themeStyles.value)}>{value}</div>
          {trend !== undefined && (
            <div
              className={cn(
                commonStyles.trend,
                isPositive
                  ? commonStyles.trendUp
                  : isNegative
                    ? commonStyles.trendDown
                    : commonStyles.trendNeutral
              )}
              aria-label={trendAriaLabel}
            >
              {isPositive ? (
                <TrendingUp size={16} aria-hidden="true" />
              ) : isNegative ? (
                <TrendingDown size={16} aria-hidden="true" />
              ) : (
                <Minus size={16} aria-hidden="true" />
              )}
              <span className={commonStyles.trendValue}>
                {isPositive ? '+' : ''}{trend}%
              </span>
              <span className={cn(commonStyles.trendLabel, themeStyles.trendLabel)}>
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length >= 2 && (
          <div className={commonStyles.sparklineWrapper}>
            <KPISparkline data={sparklineData} color={sparklineColor} height={32} />
          </div>
        )}
      </article>
    </Wrapper>
  );
};

export default StatCard;
