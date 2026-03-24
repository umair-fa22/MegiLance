// @AI-HINT: Loading skeleton for messages route - simulates conversation list + chat area
'use client';

export default function MessagesLoading() {
  return (
    <div
      className="flex h-[calc(100vh-4rem)] animate-pulse"
      role="status"
      aria-label="Loading messages"
    >
      {/* Conversation list sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-4 space-y-3 hidden md:block">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
        <div className="flex-1" />
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}
