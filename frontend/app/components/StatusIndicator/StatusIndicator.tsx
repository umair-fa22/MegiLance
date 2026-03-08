// @AI-HINT: A wrapper around Badge to display project feature statuses (Active, Beta, Dev, etc.) consistently.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Badge, { BadgeVariant } from '@/app/components/Badge/Badge';

import commonStyles from './StatusIndicator.common.module.css';
import lightStyles from './StatusIndicator.light.module.css';
import darkStyles from './StatusIndicator.dark.module.css';

export type FeatureStatus = 'active' | 'beta' | 'dev' | 'planned' | 'new' | 'complete' | 'incomplete' | 'working';

interface StatusIndicatorProps {
  status: FeatureStatus;
  className?: string;
}

const statusConfig: Record<FeatureStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  beta: { label: 'Beta', variant: 'warning' },
  dev: { label: 'Dev', variant: 'secondary' },
  planned: { label: 'Planned', variant: 'default' },
  new: { label: 'New', variant: 'info' },
  complete: { label: 'Complete', variant: 'success' },
  incomplete: { label: 'Incomplete', variant: 'secondary' },
  working: { label: 'Working', variant: 'info' },
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className }) => {
  const { resolvedTheme } = useTheme();
  const config = statusConfig[status];
  
  // Prevent hydration mismatch or flash

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <Badge 
      variant={config.variant} 
      size="small" 
      pill 
      className={cn(commonStyles.indicator, themeStyles.indicator, className)}
    >
      {config.label}
    </Badge>
  );
};

export default StatusIndicator;
