// @AI-HINT: This component displays a theme-aware indicator when the app is offline. It uses a modern, CSS-variable-driven approach for styling to ensure it perfectly matches the application's current theme.
'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils';
import commonStyles from './OfflineIndicator.common.module.css';
import lightStyles from './OfflineIndicator.light.module.css';
import darkStyles from './OfflineIndicator.dark.module.css';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className={cn(commonStyles.offlineIndicator, lightStyles.offlineIndicator, darkStyles.offlineIndicator)}>
      <div className={cn(commonStyles.content, lightStyles.content, darkStyles.content)}>
        <WifiOff size={20} className={cn(commonStyles.icon, lightStyles.icon, darkStyles.icon)} />
        <span className={cn(commonStyles.text, lightStyles.text, darkStyles.text)}>
          You are currently offline. Some features may be unavailable.
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
