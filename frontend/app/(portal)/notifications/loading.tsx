// @AI-HINT: Loading skeleton for notifications route
'use client';

export default function NotificationsLoading() {
  return (
    <div
      className="p-6 space-y-4 animate-pulse max-w-2xl"
      role="status"
      aria-label="Loading notifications"
    >
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40" />
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 bg-gray-200 dark:bg-gray-700 rounded-xl">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
