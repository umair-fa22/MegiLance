// @AI-HINT: Client Video Calls Page
'use client';

import dynamic from 'next/dynamic';

const VideoCallsPage = dynamic(() => import('../../freelancer/calls/page'), {
  ssr: false,
});

export default function ClientVideoCallsPage() {
  return <VideoCallsPage />;
}
