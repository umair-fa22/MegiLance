// @AI-HINT: Error boundary for payments route - financial operations need clear error recovery
'use client';

import React, { useEffect } from 'react';
import { RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function PaymentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Payments error:', error);
    }
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6" role="alert" aria-live="assertive">
      <div className="text-center max-w-lg space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Payment Section Error
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto">
          We couldn&apos;t load your payment information. No transactions have been affected. Please try again.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs">
            <summary className="cursor-pointer text-gray-500 font-medium">Error details</summary>
            <pre className="mt-2 text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4573df] text-white rounded-lg text-sm font-medium hover:bg-[#3a62c4] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4573df] focus:ring-offset-2"
            aria-label="Retry loading payments"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
          <a
            href="/client/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Return to dashboard"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
