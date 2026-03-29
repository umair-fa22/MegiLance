// @AI-HINT: This is a Badge component, an atomic element for displaying statuses, tags, or other small pieces of information.
'use client';

import { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './Badge.common.module.css';
import lightStyles from './Badge.light.module.css';
import darkStyles from './Badge.dark.module.css';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'error' | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge content */
  children: ReactNode;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: BadgeSize;
  /** Icon before content */
  iconBefore?: ReactNode;
  /** Icon after content */
  iconAfter?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Render as pill shape */
  pill?: boolean;
  /** Interactive badge (clickable) */
  onClick?: () => void;
  /** Accessible label (for icon-only badges) */
  ariaLabel?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'medium',
  iconBefore,
  iconAfter,
  className = '',
  pill = false,
  onClick,
  ariaLabel,
}: BadgeProps) {
  const { resolvedTheme } = useTheme();
  
  // Don't render until theme is resolved
  
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const isInteractive = !!onClick;
  
  const badgeClasses = cn(
    commonStyles.badge,
    themeStyles.badge,
    commonStyles[variant],
    themeStyles[variant],
    commonStyles[size],
    themeStyles[size],
    pill && commonStyles.pill,
    isInteractive && commonStyles.interactive,
    className
  );
  
  const content = (
    <>
      {iconBefore && (
        <span 
          className={cn(commonStyles.badgeIcon, themeStyles.badgeIcon, commonStyles.badgeIconBefore)}
          aria-hidden="true"
        >
          {iconBefore}
        </span>
      )}
      {children}
      {iconAfter && (
        <span 
          className={cn(commonStyles.badgeIcon, themeStyles.badgeIcon, commonStyles.badgeIconAfter)}
          aria-hidden="true"
        >
          {iconAfter}
        </span>
      )}
    </>
  );
  
  if (isInteractive) {
    return (
      <button
        type="button"
        className={badgeClasses}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={badgeClasses}
      role={ariaLabel ? 'status' : undefined}
      aria-label={ariaLabel}
    >
      {content}
    </span>
  );
};
