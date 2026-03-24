// @AI-HINT: This component displays a theme-aware banner prompting users to install the PWA. It uses a modern, CSS-variable-driven approach for styling to ensure it perfectly matches the application's current theme.
'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import commonStyles from './InstallAppBanner.common.module.css';
import lightStyles from './InstallAppBanner.light.module.css';
import darkStyles from './InstallAppBanner.dark.module.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  if (!deferredPrompt || isDismissed) {
    return null;
  }

  return (
    <div className={commonStyles.installAppBanner}>
      <div className={commonStyles.content}>
        <p className={commonStyles.text}>Get the full MegiLance experience. Install the app on your device.</p>
        <div className={commonStyles.actions}>
          <Button variant="primary" onClick={handleInstallClick}>Install App</Button>
          <button 
            onClick={handleDismiss} 
            className={commonStyles.closeButton}
            aria-label="Dismiss install banner"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppBanner;
