// @AI-HINT: A reusable component for displaying trend indicators with value and direction.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import common from './Trend.common.module.css';
import light from './Trend.light.module.css';
import dark from './Trend.dark.module.css';

export interface TrendProps {
  direction: 'up' | 'down';
  value: string;
}

const Trend: React.FC<TrendProps> = ({ direction, value }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const Icon = direction === 'up' ? ArrowUp : ArrowDown;

  return (
    <div className={cn(common.trend, common[direction], themed.theme, themed[direction])}>
      <Icon size={14} className={common.icon} />
      <span>{value}</span>
    </div>
  );
};

export default Trend;
