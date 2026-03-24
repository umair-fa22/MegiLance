// @AI-HINT: Loading skeleton for projects route - shows project grid
'use client';

export default function ProjectsLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      role="status"
      aria-label="Loading projects"
    >
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-36" />
        <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Search + filters */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Project cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-5 bg-gray-200 dark:bg-gray-700 rounded-xl space-y-3">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
            <div className="flex gap-2 pt-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16" />
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16" />
            </div>
            <div className="flex justify-between pt-2">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-20" />
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
