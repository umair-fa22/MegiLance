// @AI-HINT: Reusable ErrorBoundary to catch unexpected render errors and show a user-friendly fallback.
'use client';

import React, { useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './ErrorBoundary.common.module.css';
import lightStyles from './ErrorBoundary.light.module.css';
import darkStyles from './ErrorBoundary.dark.module.css';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const info = { componentStack: errorInfo.componentStack || '' };
    this.setState({ errorInfo: info });
    
    // Call custom error handler if provided
    this.props.onError?.(error, info);

    // Log error only in development or when needed for debugging
    if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || process.env.DEBUG_ERRORS)) {
      console.error('Error caught in boundary:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }

    // Report to error tracking service in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // This would integrate with Sentry, LogRocket, or similar
      try {
        // window.reportError?.(error, info);
      } catch {
        // Silently fail if error reporting fails
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state when resetKeys change (allows error recovery)
    if (this.state.hasError && this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ThemedFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

// Themed fallback component to access theme in client components
interface ThemedFallbackProps {
  error: Error | null;
  errorInfo: { componentStack: string } | null;
  onReset: () => void;
}

function ThemedFallback({ error, errorInfo, onReset }: ThemedFallbackProps) {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div 
      role="alert" 
      aria-live="assertive"
      aria-atomic="true"
      className={styles.container}
    >
      <div className={styles.icon} aria-hidden="true">
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      
      <h2 className={styles.title}>Something went wrong</h2>
      <p className={styles.message}>
        We're sorry, but something unexpected happened. Please try refreshing the page or going back to the home page.
      </p>
      
      {showDetails && error && (
        <details className={styles.details}>
          <summary className={styles.detailsSummary}>Error Details (Development Only)</summary>
          <pre className={styles.errorStack}>
            <strong>Error:</strong> {error.message}
            {'\n\n'}
            <strong>Stack:</strong>
            {'\n'}{error.stack}
            {errorInfo?.componentStack && (
              <>
                {'\n\n'}
                <strong>Component Stack:</strong>
                {'\n'}{errorInfo.componentStack}
              </>
            )}
          </pre>
        </details>
      )}

      <div className={styles.actions}>
        <button 
          type="button" 
          onClick={onReset}
          className={styles.tryAgainButton}
          aria-label="Try again without refreshing"
        >
          Try Again
        </button>
        <button 
          type="button" 
          onClick={handleRefresh}
          className={styles.refreshButton}
          aria-label="Refresh the page"
        >
          Refresh Page
        </button>
        <button 
          type="button" 
          onClick={handleGoHome}
          className={styles.homeButton}
          aria-label="Go to home page"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
