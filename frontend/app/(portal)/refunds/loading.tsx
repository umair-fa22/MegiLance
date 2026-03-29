// @AI-HINT: Loading UI for refunds routes
'use client';

import { LottieAnimation, loadingDotsAnimation } from '@/app/components/Animations/LottieAnimation';

export default function RefundsLoading() {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-label="Loading refunds"
    >
      <div className="flex flex-col items-center gap-4">
        <LottieAnimation
          animationData={loadingDotsAnimation}
          width={80}
          height={80}
          ariaLabel="Loading refund information"
        />
        <div className="space-y-2 w-48">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  );
}
