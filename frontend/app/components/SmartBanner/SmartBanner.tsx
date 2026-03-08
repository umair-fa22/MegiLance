// @AI-HINT: Smart banner — dismissible top bar for promotions / CTAs on marketing pages
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { X, ArrowRight } from 'lucide-react';
import commonStyles from './SmartBanner.common.module.css';
import lightStyles from './SmartBanner.light.module.css';
import darkStyles from './SmartBanner.dark.module.css';

interface SmartBannerProps {
  id: string;
  text: string;
  ctaText?: string;
  href?: string;
}

export default function SmartBanner({
  id,
  text,
  ctaText = 'Get Started',
  href = '/post-project',
}: SmartBannerProps) {
  const { resolvedTheme } = useTheme();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const key = `banner_dismissed_${id}`;
    setDismissed(sessionStorage.getItem(key) === '1');
  }, [id]);

  const dismiss = () => {
    sessionStorage.setItem(`banner_dismissed_${id}`, '1');
    setDismissed(true);
  };

  if (!resolvedTheme || dismissed) return null;
  const theme = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.banner, theme.banner)} role="banner">
      <div className={commonStyles.bannerInner}>
        <p className={cn(commonStyles.bannerText, theme.bannerText)}>{text}</p>
        <Link href={href} className={cn(commonStyles.bannerCta, theme.bannerCta)}>
          {ctaText} <ArrowRight size={14} />
        </Link>
        <button
          className={cn(commonStyles.bannerClose, theme.bannerClose)}
          onClick={dismiss}
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
