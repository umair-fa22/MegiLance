// @AI-HINT: This is the Next.js route file for the Privacy Policy page. It delegates to the Privacy component.
'use client';

import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

// Dynamically import the Privacy component with SSR disabled
const Privacy = dynamic(() => import('./Privacy'), {
  loading: () => <Skeleton className="w-full h-96" />
});

const PrivacyPage = () => {
  return <Privacy />;
};

export default PrivacyPage;
