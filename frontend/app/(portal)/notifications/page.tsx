// @AI-HINT: Portal route for Notifications - uses shared Notifications component with WebSocket, pagination, icons
'use client';

import dynamic from 'next/dynamic';

const Notifications = dynamic(() => import('@/app/components/organisms/Notifications/Notifications'), {
  ssr: false,
  loading: () => <div role="status" aria-label="Loading notifications" style={{ padding: '2rem', textAlign: 'center' }}>Loading notifications...</div>,
});

export default function PortalNotificationsPage() {
  return <Notifications />;
}
