// @AI-HINT: Error boundary for main/public routes
// Next.js error.js convention for graceful error recovery
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Page error:', error);
    }
  }, [error]);

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center p-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center max-w-md space-y-5">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We&apos;re sorry for the inconvenience. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#4573df] text-white rounded-lg text-sm font-medium hover:bg-[#3a62c4] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4573df] focus:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
