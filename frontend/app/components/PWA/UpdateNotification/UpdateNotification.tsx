// @AI-HINT: This component displays a theme-aware notification when a PWA update is available. It uses a modern, CSS-variable-driven approach for styling to ensure it perfectly matches the application's current theme.
'use client';

import React, { useState, useEffect } from 'react';

import Button from '@/app/components/Button/Button';
import commonStyles from './UpdateNotification.common.module.css';
import lightStyles from './UpdateNotification.light.module.css';
import darkStyles from './UpdateNotification.dark.module.css';

const UpdateNotification: React.FC = () => {
  const [isUpdateAvailable, setUpdateAvailable] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setServiceWorkerRegistration(reg);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (serviceWorkerRegistration && serviceWorkerRegistration.waiting) {
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // The page will reload once the new service worker has taken control.
      window.location.reload();
    }
  };

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div className={commonStyles.updateNotification}>
      <div className={commonStyles.content}>
        <p className={commonStyles.text}>A new version is available!</p>
        <Button variant="secondary" size="sm" onClick={handleUpdate}>Refresh</Button>
      </div>
    </div>
  );
};

export default UpdateNotification;
