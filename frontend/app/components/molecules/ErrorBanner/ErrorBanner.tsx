// @AI-HINT: Accessible error banner with recovery actions (Try Again, Go Home)
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './ErrorBanner.common.module.css';
import lightStyles from './ErrorBanner.light.module.css';
import darkStyles from './ErrorBanner.dark.module.css';

export interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showGoHome?: boolean;
  className?: string;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
  showGoHome = true,
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.banner, themeStyles.banner, className)} role="alert" aria-live="assertive">
      <div className={cn(commonStyles.content, themeStyles.content)}>
        <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}>
          <AlertTriangle className={cn(commonStyles.icon, themeStyles.icon)} aria-hidden="true" />
        </div>
        <div className={cn(commonStyles.textWrapper, themeStyles.textWrapper)}>
          <h3 className={cn(commonStyles.title, themeStyles.title)}>{title}</h3>
          <p className={cn(commonStyles.message, themeStyles.message)}>{message}</p>
        </div>
      </div>

      <div className={cn(commonStyles.actions, themeStyles.actions)}>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {showGoHome && (
          <Link href="/" className={cn(commonStyles.goHomeBtn)}>
            <Button variant="link" size="sm">
              Go Home
            </Button>
          </Link>
        )}
        {onDismiss && (
          <button
            type="button"
            className={cn(commonStyles.dismissBtn, themeStyles.dismissBtn)}
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;
