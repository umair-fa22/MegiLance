// @AI-HINT: Global error boundary page for Next.js App Router — catches runtime errors
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Error.common.module.css';
import lightStyles from './Error.light.module.css';
import darkStyles from './Error.dark.module.css';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build merged styles
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    errorCode: cn(commonStyles.errorCode, themeStyles.errorCode),
    title: cn(commonStyles.title, themeStyles.title),
    description: cn(commonStyles.description, themeStyles.description),
    actions: commonStyles.actions,
    primaryButton: cn(commonStyles.primaryButton, themeStyles.primaryButton),
    secondaryButton: cn(commonStyles.secondaryButton, themeStyles.secondaryButton),
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <main className={cn(commonStyles.container, lightStyles.container)}>
        <h1 className={cn(commonStyles.errorCode, lightStyles.errorCode)}>500</h1>
        <h2 className={cn(commonStyles.title, lightStyles.title)}>Something went wrong</h2>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.errorCode}>500</h1>
      <h2 className={styles.title}>Something went wrong</h2>
      <p className={styles.description}>
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={reset} className={styles.primaryButton}>
          Try Again
        </button>
        <Link href="/" className={styles.secondaryButton}>
          Go Home
        </Link>
      </div>
    </main>
  );
}
