// @AI-HINT: Newsletter signup component with optimistic UI and basic validation.
'use client';
import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/app/shared/analytics/AnalyticsProvider';

import commonStyles from './NewsletterSignup.common.module.css';
import lightStyles from './NewsletterSignup.light.module.css';
import darkStyles from './NewsletterSignup.dark.module.css';

interface Props { compact?: boolean; }

const NewsletterSignup: React.FC<Props> = ({ compact }) => {
  const { track } = useAnalytics();
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    track('newsletter_attempt');
    setTimeout(() => {
      setStatus('success');
      track('newsletter_subscribed');
    }, 800);
  };

  if (status === 'success') {
    return <p role='status' className={cn(commonStyles.successMessage, themeStyles.successMessage)}>Thanks! Check your inbox to confirm.</p>;
  }

  return (
    <form onSubmit={submit} className={commonStyles.form} aria-label='Newsletter signup form'>
      <input
        type='email'
        aria-label='Email address'
        placeholder='you@example.com'
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (status==='error') setStatus('idle'); }}
        className={cn(commonStyles.input, themeStyles.input)}
        disabled={status==='loading'}
        required
      />
      <button
        type='submit'
        disabled={status==='loading'}
        className={cn(commonStyles.button, themeStyles.button)}
      >
        {status==='loading' ? '...' : compact ? 'Join' : 'Subscribe'}
      </button>
    </form>
  );
};

export default NewsletterSignup;
