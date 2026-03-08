// @AI-HINT: Floating CTA button — appears on marketing pages after scroll, links to post-project
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import commonStyles from './FloatingCTA.common.module.css';
import lightStyles from './FloatingCTA.light.module.css';
import darkStyles from './FloatingCTA.dark.module.css';

interface FloatingCTAProps {
  text?: string;
  href?: string;
  showAfterPx?: number;
}

export default function FloatingCTA({
  text = 'Post a Project Free',
  href = '/post-project',
  showAfterPx = 600,
}: FloatingCTAProps) {
  const { resolvedTheme } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfterPx);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [showAfterPx]);

  if (!resolvedTheme) return null;
  const theme = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <Link
      href={href}
      className={cn(commonStyles.fab, theme.fab, visible && commonStyles.fabVisible)}
      aria-label={text}
    >
      <span className={cn(commonStyles.fabText, theme.fabText)}>{text}</span>
      <ArrowRight size={18} />
    </Link>
  );
}
