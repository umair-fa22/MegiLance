// @AI-HINT: Client Notifications page - uses shared Notifications component
'use client';

import dynamic from 'next/dynamic';

const Notifications = dynamic(() => import('@/app/components/Notifications/Notifications'), {
  ssr: false,
  loading: () => <div role="status" aria-label="Loading notifications" style={{ padding: '2rem', textAlign: 'center' }}>Loading notifications...</div>,
});

export default function ClientNotificationsPage() {
  return <Notifications />;
}
