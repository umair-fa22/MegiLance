// @AI-HINT: Loading skeleton for favorites route
'use client';

export default function FavoritesLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      role="status"
      aria-label="Loading favorites"
    >
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-5 bg-gray-200 dark:bg-gray-700 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-32" />
            </div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
