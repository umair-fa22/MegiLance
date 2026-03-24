// @AI-HINT: Loading skeleton for search route - shows search bar + result cards
'use client';

export default function SearchLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      role="status"
      aria-label="Loading search"
    >
      {/* Search bar */}
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 bg-gray-200 dark:bg-gray-700 rounded-xl">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
              <div className="flex gap-2">
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-14" />
                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-14" />
              </div>
            </div>
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
