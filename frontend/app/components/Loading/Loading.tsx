// @AI-HINT: Accessible loading spinner with size, variant, and fullscreen support. Uses 3-file CSS modules.
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import commonStyles from './Loading.common.module.css';
import lightStyles from './Loading.light.module.css';
import darkStyles from './Loading.dark.module.css';

export interface LoadingProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional loading text */
  text?: string;
  /** Render fullscreen overlay */
  fullscreen?: boolean;
  /** Additional class names */
  className?: string;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullscreen = false,
  className,
  'aria-label': ariaLabel,
}) => {
  const { resolvedTheme } = useTheme();

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div
      className={cn(
        commonStyles.container,
        themeStyles.container,
        fullscreen && commonStyles.fullscreen,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel || text || 'Loading'}
    >
      <Loader2
        className={cn(
          commonStyles.spinner,
          commonStyles[size],
          themeStyles.spinner
        )}
        aria-hidden="true"
      />
      {text && (
        <p className={cn(commonStyles.text, themeStyles.text)}>{text}</p>
      )}
      {/* Visually hidden text for screen readers when no text prop */}
      {!text && (
        <span className={commonStyles.srOnly}>Loading...</span>
      )}
    </div>
  );
};

export default Loading;
