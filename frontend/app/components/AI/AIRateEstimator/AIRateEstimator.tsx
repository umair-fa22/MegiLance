// @AI-HINT: Premium AI Rate Estimator component for freelancers
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react'
import commonStyles from './AIRateEstimator.common.module.css';
import lightStyles from './AIRateEstimator.light.module.css';
import darkStyles from './AIRateEstimator.dark.module.css';

export interface RateEstimate {
  low_estimate: number;
  high_estimate: number;
  estimated_rate: number;
  confidence?: number;
}

interface AIRateEstimatorProps {
  estimate: RateEstimate | null;
  onApply?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const AIRateEstimator: React.FC<AIRateEstimatorProps> = ({
  estimate,
  onApply,
  onDismiss,
  className
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (!estimate) return null;

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)}>
      <div className={commonStyles.header}>
        <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}>
          <Sparkles size={14} />
        </div>
        <h4 className={cn(commonStyles.title, themeStyles.title)}>AI Rate Suggestion</h4>
      </div>

      <div className={commonStyles.content}>
        <p className={cn(commonStyles.estimateText, themeStyles.estimateText)}>
          Suggested Range: ${estimate.low_estimate} - ${estimate.high_estimate}/hr
        </p>
        <p className={cn(commonStyles.subText, themeStyles.subText)}>
          Based on your skills, experience, and market demand.
        </p>
      </div>

      <div className={commonStyles.actions}>
        {onApply && (
          <button 
            type="button"
            onClick={onApply}
            className={cn(commonStyles.actionButton, themeStyles.actionButton)}
          >
            Apply ${estimate.estimated_rate}/hr
          </button>
        )}
        {onDismiss && (
          <button 
            type="button"
            onClick={onDismiss}
            className={cn(commonStyles.dismissButton, themeStyles.dismissButton)}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default AIRateEstimator;
