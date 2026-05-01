// @AI-HINT: Freelancer video-call room shell with themed layout and accessible session context.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import VideoCall from '@/app/components/organisms/VideoCall/VideoCall';

import commonStyles from './VideoCalls.common.module.css';
import lightStyles from './VideoCalls.light.module.css';
import darkStyles from './VideoCalls.dark.module.css';

export default function VideoCallPage() {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <main className={cn(commonStyles.page, themeStyles.page)}>
      <header className={commonStyles.header}>
        <p className={cn(commonStyles.kicker, themeStyles.kicker)}>Video collaboration</p>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>Client Sync Room</h1>
        <p className={cn(commonStyles.description, themeStyles.description)}>
          Real-time WebRTC session for calls, screen-sharing, and project coordination.
        </p>
      </header>

      <section className={cn(commonStyles.callSurface, themeStyles.callSurface)} aria-label="Active video call session">
        <VideoCall roomId="sync-xyz-123" userName="Freelancer" />
      </section>
    </main>
  );
}
