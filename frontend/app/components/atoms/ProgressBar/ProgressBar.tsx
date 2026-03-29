// @AI-HINT: Accessible progress bar with multiple sizes, variants, striped/animated options. Uses 3-file CSS modules.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './ProgressBar.common.module.css';
import lightStyles from './ProgressBar.light.module.css';
import darkStyles from './ProgressBar.dark.module.css';

interface ProgressBarProps {
  progress?: number; // A value from 0 to 100
  value?: number; // Alternative prop name (0 to max)
  max?: number; // Max value when using value prop
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  label?: string;
  showPercentage?: boolean;
  showLabel?: boolean; // Alias for showPercentage
  animated?: boolean;
  striped?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const sizeMap = {
  xs: 'progressBarXs',
  sm: 'progressBarSm',
  md: 'progressBarMd',
  lg: 'progressBarLg',
  xl: 'progressBarXl',
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  label,
  showPercentage = false,
  showLabel,
  animated = false,
  striped = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const progressId = React.useId();
  // Support both progress (0-100) and value/max patterns
  const computedProgress = progress ?? (value !== undefined ? (value / max) * 100 : 0);
  const safeProgress = Math.min(100, Math.max(0, computedProgress));
  const shouldShowPercentage = showPercentage || showLabel;

  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.progressBarContainer, className)}>
      {(label || shouldShowPercentage) && (
        <div className={commonStyles.progressBarHeader}>
          {label && (
            <span className={cn(commonStyles.progressBarLabel, themeStyles.progressBarLabel)} id={`${progressId}-label`}>
              {label}
            </span>
          )}
          {shouldShowPercentage && (
            <span className={cn(commonStyles.progressBarPercentage, themeStyles.progressBarPercentage)}>
              {Math.round(safeProgress)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          commonStyles.progressBar,
          themeStyles.progressBar,
          commonStyles[sizeMap[size]],
          themeStyles[variant],
          striped && themeStyles.progressBarStriped,
          animated && commonStyles.progressStripeAnimation
        )}
      >
        <progress
          className={commonStyles.progressElement}
          value={safeProgress}
          max={100}
          aria-label={ariaLabel || (label ? undefined : `Progress: ${Math.round(safeProgress)}%`)}
          aria-labelledby={label ? `${progressId}-label` : undefined}
          aria-describedby={ariaDescribedBy}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
