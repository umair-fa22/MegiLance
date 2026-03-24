// @AI-HINT: Freelancer Video Calls Page - redirects to calls page
'use client';

import dynamic from 'next/dynamic';

const VideoCallsPage = dynamic(() => import('../calls/page'), {
  ssr: false,
});

export default function FreelancerVideoCallsPage() {
  return <VideoCallsPage />;
}
