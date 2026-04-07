import React from 'react';
import VideoCall from '@/app/components/organisms/VideoCall/VideoCall';

export default function VideoCallPage() {
  return (
    <div style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1>Client Sync</h1>
      <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Live WebRTC session.</p>
      <VideoCall roomId="sync-xyz-123" userName="Freelancer" />
    </div>
  );
}
