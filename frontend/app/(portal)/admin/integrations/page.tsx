// @AI-HINT: Admin Integrations page wrapper
'use client';

import dynamic from 'next/dynamic';
import Loading from '@/app/components/atoms/Loading/Loading';

const Integrations = dynamic(() => import('./Integrations'), {
  loading: () => <Loading text="Loading integrations..." />,
  ssr: false,
});

export default function AdminIntegrationsPage() {
  return <Integrations />;
}
