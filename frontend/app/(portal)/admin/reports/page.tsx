// @AI-HINT: Admin Reports page wrapper
'use client';

import dynamic from 'next/dynamic';
import Loading from '@/app/components/atoms/Loading/Loading';

const Reports = dynamic(() => import('./Reports'), {
  loading: () => <Loading text="Loading reports..." />,
  ssr: false,
});

export default function AdminReportsPage() {
  return <Reports />;
}
