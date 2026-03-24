// @AI-HINT: Loading skeleton for settings route - shows settings sections
'use client';

export default function SettingsLoading() {
  return (
    <div
      className="p-6 space-y-6 animate-pulse max-w-3xl"
      role="status"
      aria-label="Loading settings"
    >
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />

      {/* Settings sections */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-5 bg-gray-200 dark:bg-gray-700 rounded-xl space-y-4">
          <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-40" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg" />
            <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
