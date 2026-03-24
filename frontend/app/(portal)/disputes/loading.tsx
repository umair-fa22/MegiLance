// @AI-HINT: Loading skeleton for disputes route
'use client';

export default function DisputesLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      role="status"
      aria-label="Loading disputes"
    >
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-5 bg-gray-200 dark:bg-gray-700 rounded-xl space-y-3">
            <div className="flex justify-between">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-48" />
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-24" />
            </div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="flex gap-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
