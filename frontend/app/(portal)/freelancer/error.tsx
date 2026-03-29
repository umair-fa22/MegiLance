// @AI-HINT: Error boundary for freelancer portal routes
// Next.js error.js convention - catches runtime errors in freelancer section
'use client';

import React, { useEffect } from 'react';
import { RefreshCw, LayoutDashboard } from 'lucide-react';
import { LottieAnimation, errorAlertAnimation } from '@/app/components/Animations/LottieAnimation';

export default function FreelancerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Freelancer portal error:', error);
    }
  }, [error]);

  return (
    <div
      className="flex items-center justify-center min-h-[60vh] p-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center max-w-lg space-y-5">
        <div className="flex justify-center">
          <LottieAnimation
            animationData={errorAlertAnimation}
            width={120}
            height={120}
            loop={false}
            keepLastFrame
            ariaLabel="Error illustration"
          />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto">
          An unexpected error occurred while loading this page. Your data is safe.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs">
            <summary className="cursor-pointer text-gray-500 font-medium">Error details</summary>
            <pre className="mt-2 text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-gray-400">Digest: {error.digest}</p>
            )}
          </details>
        )}
        
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary,#4573df)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#4573df)] focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
          <a
            href="/freelancer/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
