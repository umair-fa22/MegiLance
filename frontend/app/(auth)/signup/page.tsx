// @AI-HINT: This is the Next.js route file for the Signup page under the (auth) route group.
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

// Dynamically import the Signup component
const Signup = dynamic(() => import('./Signup'), {
  loading: () => <Skeleton className="w-full h-96" />
});

export default function SignupPage() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-96" />}>
      <Signup />
    </Suspense>
  );
}
