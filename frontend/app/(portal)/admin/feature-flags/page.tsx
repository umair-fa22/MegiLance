// @AI-HINT: Admin Feature Flags page wrapper
'use client';

import dynamic from 'next/dynamic';
import Loading from '@/app/components/atoms/Loading/Loading';

const FeatureFlags = dynamic(() => import('./FeatureFlags'), {
  loading: () => <Loading text="Loading feature flags..." />,
  ssr: false,
});

export default function AdminFeatureFlagsPage() {
  return <FeatureFlags />;
}
