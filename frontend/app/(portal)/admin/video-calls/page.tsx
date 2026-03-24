// @AI-HINT: Admin Video Calls Page
'use client';

import dynamic from 'next/dynamic';

const VideoCallsPage = dynamic(() => import('../../freelancer/calls/page'), {
  ssr: false,
});

export default function AdminVideoCallsPage() {
  return <VideoCallsPage />;
}
