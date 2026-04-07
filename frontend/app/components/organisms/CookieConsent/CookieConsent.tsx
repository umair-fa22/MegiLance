// @AI-HINT: Cookie consent banner with localStorage persistence. Shows once, remembers choice.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './CookieConsent.common.module.css';
import lightStyles from './CookieConsent.light.module.css';
import darkStyles from './CookieConsent.dark.module.css';

const STORAGE_KEY = 'megilance_cookie_consent';

const CookieConsent: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (!resolvedTheme || !visible) return null;

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const handleAccept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch { /* localStorage unavailable */ }
    setVisible(false);
  };

  const handleDecline = () => {
    try { localStorage.setItem(STORAGE_KEY, 'declined'); } catch { /* localStorage unavailable */ }
    setVisible(false);
  };

  return (
    <div className={cn(commonStyles.banner, themeStyles.banner)} role="alert" aria-live="polite">
      <p className={cn(commonStyles.text, themeStyles.text)}>
        We use cookies to enhance your experience. By continuing, you agree to our{' '}
        <a href="/privacy" className={cn(commonStyles.link, themeStyles.link)}>Privacy Policy</a>.
      </p>
      <div className={commonStyles.actions}>
        <Button variant="ghost" size="sm" onClick={handleDecline}>Decline</Button>
        <Button variant="primary" size="sm" onClick={handleAccept}>Accept</Button>
      </div>
    </div>
  );
};

export default CookieConsent;
