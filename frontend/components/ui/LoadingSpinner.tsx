// @AI-HINT: LoadingSpinner - animated loading indicator with accessibility support
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import commonStyles from './LoadingSpinner.common.module.css';
import lightStyles from './LoadingSpinner.light.module.css';
import darkStyles from './LoadingSpinner.dark.module.css';

interface LoadingSpinnerProps {
  /** Spinner size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional loading text displayed below spinner */
  text?: string;
  /** Accessible label for screen readers (defaults to text or "Loading...") */
  ariaLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  ariaLabel,
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;


  const sizeMap = { sm: 20, md: 32, lg: 48 };
  const accessibleLabel = ariaLabel || text || 'Loading...';

  return (
    <div 
      className={cn(commonStyles.container, themeStyles.container, className)}
      role="status"
      aria-live="polite"
      aria-label={accessibleLabel}
    >
      <Loader2 
        size={sizeMap[size]} 
        className={cn(commonStyles.spinner, themeStyles.spinner)} 
        aria-hidden="true"
      />
      {text && (
        <p className={cn(commonStyles.text, themeStyles.text)} aria-hidden="true">
          {text}
        </p>
      )}
      {/* Screen reader only announcement */}
      <span className={commonStyles.srOnly}>{accessibleLabel}</span>
    </div>
  );
};
