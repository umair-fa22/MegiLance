// @AI-HINT: Loading UI for admin portal routes
// Uses Next.js loading.js convention - wrapped in Suspense automatically
'use client';

import { LottieAnimation, loadingDotsAnimation } from '@/app/components/Animations/LottieAnimation';

export default function AdminLoading() {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-label="Loading admin content"
    >
      <div className="flex flex-col items-center gap-4">
        <LottieAnimation
          animationData={loadingDotsAnimation}
          width={80}
          height={80}
          ariaLabel="Loading admin content"
        />
        <div className="space-y-2 w-56">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mx-auto" />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Loading admin panel...
          </p>
        </div>
      </div>
    </div>
  );
}
