// @AI-HINT: Error boundary for auth routes (login, signup, etc.)
// Follows Next.js error.js file convention for graceful error recovery
'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './AuthError.common.module.css';
import lightStyles from './AuthError.light.module.css';
import darkStyles from './AuthError.dark.module.css';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth error:', error);
    }
  }, [error]);

  return (
    <div
      className={cn(commonStyles.container, themeStyles.container)}
      role="alert"
      aria-live="assertive"
    >
      <div className={cn(commonStyles.card, themeStyles.card)}>
        <div className={cn(commonStyles.iconWrap, themeStyles.iconWrap)}>
          <AlertTriangle />
        </div>
        <h2 className={cn(commonStyles.title, themeStyles.title)}>Something went wrong</h2>
        <p className={cn(commonStyles.message, themeStyles.message)}>
          We encountered an error loading this page. Please try again.
        </p>
        <div className={commonStyles.actions}>
          <Button variant="primary" size="md" onClick={reset}>
            Try again
          </Button>
          <Button variant="secondary" size="md" onClick={() => router.push('/login')}>
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
