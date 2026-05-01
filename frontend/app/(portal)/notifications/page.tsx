// @AI-HINT: Portal route for Notifications - uses shared Notifications component with WebSocket, pagination, icons
'use client';

import dynamic from 'next/dynamic';
import commonStyles from './Notifications.common.module.css';

const Notifications = dynamic(() => import('@/app/components/organisms/Notifications/Notifications'), {
  ssr: false,
  loading: () => (
    <div role="status" aria-label="Loading notifications" className={commonStyles.loadingState}>
      <div className={commonStyles.spinner} aria-hidden="true" />
      <p>Loading notifications...</p>
    </div>
  ),
});

export default function PortalNotificationsPage() {
  return <Notifications />;
}
