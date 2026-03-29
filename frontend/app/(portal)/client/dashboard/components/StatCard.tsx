import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import KPISparkline from '@/app/components/organisms/KPISparkline/KPISparkline';
import commonStyles from './StatCard.common.module.css';
import lightStyles from './StatCard.light.module.css';
import darkStyles from './StatCard.dark.module.css';

interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  sparklineData?: number[];
  sparklineColor?: 'primary' | 'success' | 'warning' | 'danger';
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon: Icon, sparklineData, sparklineColor = 'primary', href }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href, style: { textDecoration: 'none', color: 'inherit' } } : {};

  return (
    <Wrapper {...wrapperProps} className={cn(commonStyles.card, themeStyles.card)}>
      <div className={commonStyles.header}>
        <span className={cn(commonStyles.title, themeStyles.title)}>{title}</span>
        <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}>
          <Icon size={20} />
        </div>
      </div>
      <div className={commonStyles.content}>
        <div className={cn(commonStyles.value, themeStyles.value)}>{value}</div>
        {sparklineData && sparklineData.length >= 2 && (
          <KPISparkline data={sparklineData} color={sparklineColor} height={32} />
        )}
        {trend !== undefined && (
          <div className={cn(commonStyles.trend, isPositive ? commonStyles.trendUp : isNegative ? commonStyles.trendDown : commonStyles.trendNeutral)}>
            {isPositive ? <TrendingUp size={16} /> : isNegative ? <TrendingDown size={16} /> : null}
            <span className={commonStyles.trendValue}>{Math.abs(trend)}%</span>
            <span className={cn(commonStyles.trendLabel, themeStyles.trendLabel)}>vs last month</span>
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default StatCard;
