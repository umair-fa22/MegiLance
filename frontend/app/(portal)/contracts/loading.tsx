// @AI-HINT: Loading skeleton for contracts route - shows contract cards
'use client';

export default function ContractsLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      role="status"
      aria-label="Loading contracts"
    >
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>

      {/* Contract cards */}
      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 bg-gray-200 dark:bg-gray-700 rounded-xl space-y-3">
            <div className="flex justify-between">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-48" />
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-20" />
            </div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="flex gap-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
