// @AI-HINT: This is a shared, reusable branding panel for all authentication pages (Login, Signup, etc.). It centralizes the dynamic, role-based branding to ensure a consistent, premium user experience and follows the DRY principle.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// Import dedicated styles for the Branding Panel
import commonStyles from './BrandingPanel.common.module.css';
import lightStyles from './BrandingPanel.light.module.css';
import darkStyles from './BrandingPanel.dark.module.css';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';

export interface RoleConfig {
  brandIcon: LucideIcon;
  brandTitle: string;
  brandText: string;
}

export interface AuthBrandingPanelProps {
  roleConfig: RoleConfig;
}

const AuthBrandingPanel: React.FC<AuthBrandingPanelProps> = ({ roleConfig }) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a consistent theme during SSR to prevent hydration mismatch
  const effectiveTheme = mounted ? (resolvedTheme ?? 'dark') : 'dark';
  
  const styles = React.useMemo(() => {
    const themeStyles = effectiveTheme === 'dark' ? darkStyles : lightStyles;
    return {
      brandingPanel: cn(commonStyles.brandingPanel, themeStyles.brandingPanel),
      brandingContent: cn(commonStyles.brandingContent, themeStyles.brandingContent),
      brandingIconWrapper: cn(commonStyles.brandingIconWrapper, themeStyles.brandingIconWrapper),
      brandingIcon: cn(commonStyles.brandingIcon, themeStyles.brandingIcon),
      brandingTitle: cn(commonStyles.brandingTitle, themeStyles.brandingTitle),
      brandingText: cn(commonStyles.brandingText, themeStyles.brandingText),
      brandingFooter: cn(commonStyles.brandingFooter, themeStyles.brandingFooter),
    } as const;
  }, [effectiveTheme]);
  
  const { brandIcon: BrandIcon, brandTitle, brandText } = roleConfig;

  return (
    <div className={styles.brandingPanel}>
      <SectionGlobe variant="blue" size="lg" position="center" />
      <div className={styles.brandingContent} style={{ position: 'relative', zIndex: 2 }}>
        <div className={styles.brandingIconWrapper}>
          <BrandIcon className={styles.brandingIcon} />
        </div>
        <h2 className={styles.brandingTitle}>{brandTitle}</h2>
        <p className={styles.brandingText}>{brandText}</p>
      </div>
      <div className={styles.brandingFooter}>
        <p>&copy; {new Date().getFullYear()} MegiLance. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthBrandingPanel;
