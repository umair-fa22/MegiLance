// @AI-HINT: Loading skeleton for dashboard route - shows layout skeleton while data loads
'use client';

export default function DashboardLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse"
      role="status"
      aria-label="Loading dashboard"
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>

      {/* Table */}
      <div className="space-y-3">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-48" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
