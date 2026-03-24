// @AI-HINT: Loading skeleton for payments route - shows balance card + transaction list
'use client';

export default function PaymentsLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      role="status"
      aria-label="Loading payments"
    >
      {/* Balance card */}
      <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-xl max-w-md" />

      {/* Action buttons */}
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32" />
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20" />
              </div>
            </div>
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
