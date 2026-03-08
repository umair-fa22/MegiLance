// @AI-HINT: Offline fallback page for PWA - shown when user has no network connection
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { WifiOff, RefreshCw } from 'lucide-react';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem } from '@/app/components/3D';

import common from './Offline.common.module.css';
import light from './Offline.light.module.css';
import dark from './Offline.dark.module.css';

const OfflinePage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setOnline(true); window.location.reload(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);


  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="blue" size={350} blur={90} opacity={0.08} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="purple" size={300} blur={70} opacity={0.06} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={8} className="absolute inset-0" />
      </div>
      <main className={cn(common.page, themed.page)}>
        <ScrollReveal>
          <div className={cn(common.iconWrapper, themed.iconWrapper)}>
            <WifiOff size={40} color="#4573df" />
          </div>
          <h1 className={cn(common.title, themed.title)}>
            You&apos;re Offline
          </h1>
          <p className={cn(common.description, themed.description)}>
            It looks like you&apos;ve lost your internet connection. Check your network and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={cn(common.retryButton, themed.retryButton)}
            aria-label="Retry connection"
          >
            <RefreshCw size={18} /> Try Again
          </button>
          {online && <p className={cn(common.onlineMessage, themed.onlineMessage)}>Back online! Reloading...</p>}
        </ScrollReveal>
      </main>
    </PageTransition>
  );
};

export default OfflinePage;
