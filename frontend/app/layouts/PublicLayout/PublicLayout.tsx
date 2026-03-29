/* @AI-HINT: PublicLayout provides the shared chrome (Header, Footer, skip links) for all public-facing pages. It is theme-aware and uses per-component CSS modules (common, light, dark). */
"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './PublicLayout.common.module.css';
import lightStyles from './PublicLayout.light.module.css';
import darkStyles from './PublicLayout.dark.module.css';
import SmartBanner from '@/app/components/molecules/SmartBanner/SmartBanner';

type Props = { children: React.ReactNode };

const PublicLayout: React.FC<Props> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const themeStyles = (mounted && resolvedTheme === 'dark') ? darkStyles : lightStyles;
  const styles = React.useMemo(() => ({
    root: cn(commonStyles.root, themeStyles.root),
    skipLink: cn(commonStyles.skipLink, themeStyles.skipLink),
    main: cn(commonStyles.main, themeStyles.main),
  }), [themeStyles]);

  return (
    <div className={styles.root}>
      <SmartBanner
        id="launch-promo"
        text="🚀 Post your first project free — AI matches you with top freelancers in 24h"
        ctaText="Post a Project"
        href="/post-project"
      />

      {/* @AI-HINT: PublicLayout - Marketing container only; AppChrome owns the sole <main id="main-content">. */}
      <div className={styles.main} role="presentation">
        {/* @AI-HINT: Layout - Constrain content to a readable width for improved rhythm. */}
        <div className={commonStyles.container}>
          {children}
        </div>
      </div>
      {/* Footer is handled globally by AppChrome for consistency. */}
    </div>
  );
};

export default PublicLayout;
