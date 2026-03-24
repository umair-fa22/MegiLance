// @AI-HINT: Loading skeleton for proposals route
'use client';

export default function ProposalsLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      role="status"
      aria-label="Loading proposals"
    >
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-36" />

      {/* Proposal cards */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 bg-gray-200 dark:bg-gray-700 rounded-xl space-y-3">
            <div className="flex justify-between">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-56" />
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-20" />
            </div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
            <div className="flex gap-4 pt-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20" />
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
