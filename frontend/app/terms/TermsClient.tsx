// @AI-HINT: This is the Next.js route file for the Terms of Service page. It delegates to the Terms component.
'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

// Dynamically import the Terms component with SSR disabled
const Terms = dynamic(() => import('./Terms'), {
  loading: () => <Skeleton className="w-full h-96" />
});

const TermsPage = () => {
  return <Terms />;
};

export default TermsPage;
