// @AI-HINT: Reusable AI loading/status indicator component with multiple variants - spinner, dots, brain animation, progress, confidence meter
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Sparkles, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import commonStyles from './AILoadingIndicator.common.module.css';
import lightStyles from './AILoadingIndicator.light.module.css';
import darkStyles from './AILoadingIndicator.dark.module.css';

type IndicatorVariant = 'spinner' | 'dots' | 'brain' | 'progress' | 'skeleton';
type IndicatorSize = 'sm' | 'md' | 'lg';
type IndicatorStatus = 'processing' | 'success' | 'warning' | 'error';

interface AILoadingIndicatorProps {
  variant?: IndicatorVariant;
  size?: IndicatorSize;
  status?: IndicatorStatus;
  label?: string;
  sublabel?: string;
  progress?: number;
  vertical?: boolean;
  className?: string;
}

interface AIConfidenceMeterProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

interface AISkeletonProps {
  type?: 'text' | 'title' | 'avatar' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const sizeClasses = {
  sm: commonStyles.spinnerSmall,
  md: commonStyles.spinnerMedium,
  lg: commonStyles.spinnerLarge,
};

const successSizeClasses = {
  sm: commonStyles.successCheckSmall,
  md: commonStyles.successCheckMedium,
  lg: commonStyles.successCheckLarge,
};

const statusClasses = {
  processing: commonStyles.statusProcessing,
  success: commonStyles.statusSuccess,
  warning: commonStyles.statusWarning,
  error: commonStyles.statusError,
};

export function AILoadingIndicator({
  variant = 'spinner',
  size = 'md',
  status = 'processing',
  label,
  sublabel,
  progress,
  vertical = false,
  className,
}: AILoadingIndicatorProps) {
  const { resolvedTheme } = useTheme();
  
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const renderIndicator = () => {
    // If status is success, show check mark
    if (status === 'success') {
      return (
        <div className={cn(commonStyles.successCheck, successSizeClasses[size], themeStyles.statusSuccess)}>
          <Check size={size === 'sm' ? 10 : size === 'md' ? 14 : 20} />
        </div>
      );
    }

    // If status is error, show error icon
    if (status === 'error') {
      return <AlertCircle size={size === 'sm' ? 16 : size === 'md' ? 24 : 40} className={themeStyles.statusError} />;
    }

    // If status is warning, show warning icon
    if (status === 'warning') {
      return <AlertTriangle size={size === 'sm' ? 16 : size === 'md' ? 24 : 40} className={themeStyles.statusWarning} />;
    }

    switch (variant) {
      case 'dots':
        return (
          <div className={commonStyles.dots}>
            <span className={cn(commonStyles.dot, themeStyles.dot)} />
            <span className={cn(commonStyles.dot, themeStyles.dot)} />
            <span className={cn(commonStyles.dot, themeStyles.dot)} />
          </div>
        );

      case 'brain':
        return (
          <div className={commonStyles.aiBrain}>
            <Sparkles 
              size={size === 'sm' ? 16 : size === 'md' ? 24 : 40} 
              className={cn(commonStyles.aiBrainIcon, themeStyles.aiBrainIcon)} 
            />
            <div className={cn(commonStyles.aiBrainGlow, themeStyles.aiBrainGlow)} />
          </div>
        );

      case 'progress':
        return (
          <div 
            className={cn(
              commonStyles.progressBar, 
              themeStyles.progressBar,
              progress === undefined && commonStyles.progressBarIndeterminate,
              progress === undefined && themeStyles.progressBarIndeterminate
            )}
          >
            {progress !== undefined && (
              <div 
                className={cn(commonStyles.progressFill, themeStyles.progressFill)}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            )}
          </div>
        );

      case 'spinner':
      default:
        return (
          <div className={cn(commonStyles.spinner, sizeClasses[size])}>
            <div className={cn(commonStyles.spinnerRing, themeStyles.spinnerRing, themeStyles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`])} />
          </div>
        );
    }
  };

  return (
    <div 
      className={cn(
        commonStyles.container, 
        vertical && commonStyles.containerVertical,
        statusClasses[status],
        themeStyles[`status${status.charAt(0).toUpperCase() + status.slice(1)}`],
        className
      )}
    >
      {renderIndicator()}
      {(label || sublabel) && (
        <div>
          {label && (
            <span className={cn(
              commonStyles.label, 
              size === 'sm' && commonStyles.labelSmall,
              themeStyles.label
            )}>
              {label}
            </span>
          )}
          {sublabel && (
            <p className={cn(commonStyles.sublabel, themeStyles.sublabel)}>{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AIConfidenceMeter({
  value,
  label = 'AI Confidence',
  showPercentage = true,
  className,
}: AIConfidenceMeterProps) {
  const { resolvedTheme } = useTheme();
  
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const clampedValue = Math.min(100, Math.max(0, value));
  
  const getFillClass = () => {
    if (clampedValue < 50) return themeStyles.confidenceFillLow;
    if (clampedValue < 75) return themeStyles.confidenceFillMedium;
    return themeStyles.confidenceFillHigh;
  };

  return (
    <div className={cn(commonStyles.confidenceMeter, className)}>
      <div className={commonStyles.confidenceHeader}>
        <span className={cn(commonStyles.confidenceLabel, themeStyles.confidenceLabel)}>
          {label}
        </span>
        {showPercentage && (
          <span className={cn(commonStyles.confidenceValue, themeStyles.confidenceValue)}>
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
      <div className={cn(commonStyles.confidenceBar, themeStyles.confidenceBar)}>
        <div 
          className={cn(commonStyles.confidenceFill, getFillClass())}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export function AISkeleton({
  type = 'text',
  width,
  height,
  className,
}: AISkeletonProps) {
  const { resolvedTheme } = useTheme();
  
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const typeClasses = {
    text: commonStyles.skeletonText,
    title: commonStyles.skeletonTitle,
    avatar: commonStyles.skeletonAvatar,
    card: '',
  };

  return (
    <div 
      className={cn(commonStyles.skeleton, themeStyles.skeleton, typeClasses[type], className)}
      style={{ 
        width: width ?? undefined, 
        height: height ?? undefined 
      }}
    />
  );
}

export default AILoadingIndicator;
