// @AI-HINT: AppChrome is the top-level layout component. It intelligently renders the correct 'chrome' (header/footer) based on the route, distinguishing between public marketing pages and internal application portals.

'use client';

import React, { useState, useEffect } from 'react';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Header from '@/app/components/Header/Header';
import PublicFooter from '@/app/components/Layout/PublicFooter/PublicFooter';
import ThemeToggleButton from '@/app/components/ThemeToggleButton';
import FloatingActionButtons from '@/app/components/FloatingActionButtons/FloatingActionButtons';
import ChatbotAgent from '@/app/components/AI/ChatbotAgent/ChatbotAgent';
import InstallAppBanner from '@/app/components/PWA/InstallAppBanner/InstallAppBanner';
import UpdateNotification from '@/app/components/PWA/UpdateNotification/UpdateNotification';
import PageTransition from '@/app/components/Transitions/PageTransition';
import Breadcrumbs from '@/app/components/Breadcrumbs/Breadcrumbs';
import commonStyles from './AppChrome.common.module.css';
import lightStyles from './AppChrome.light.module.css';
import darkStyles from './AppChrome.dark.module.css';

// Separate client component for the logic that uses hooks
const AppChromeClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const themeStyles = (mounted && resolvedTheme === 'dark') ? darkStyles : lightStyles;

  /**
   * Determines if a given route should have minimal chrome.
   * This applies to authentication pages and the root of all authenticated portals,
   * which manage their own internal layouts, sidebars, and headers.
   * @param pathname The current URL pathname.
   * @returns {boolean} True if the route should be chrome-less.
   */
  function isPortalOrAuthRoute(pathname: string | null | undefined): boolean {
    if (!pathname) return false; 

    const normalizedPath = pathname.toLowerCase().replace(/\/$/, '');

    const portalOrAuthRoots = [
      // Standalone auth pages
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      // Root of authenticated portals
      '/admin',
      '/client',
      '/freelancer',
      // Portal routes
      '/portal',
    ];

    return portalOrAuthRoots.some(root => normalizedPath === root || normalizedPath.startsWith(`${root}/`));
  }

  const isMinimalChrome = isPortalOrAuthRoute(pathname);

  return (
    <div className={cn(commonStyles.wrapper, themeStyles.wrapper)} suppressHydrationWarning>
      {!isMinimalChrome && <Header />}
      {!isMinimalChrome && (
        <div className={commonStyles.breadcrumbContainer}>
          <Breadcrumbs />
        </div>
      )}
      
      <main id="main-content" role="main" className={isMinimalChrome ? commonStyles.mainContent : commonStyles.mainContentGrow}>
        <PageTransition variant="fade">
          {children}
        </PageTransition>
      </main>

      {!isMinimalChrome && <PublicFooter />}
      
      {/* Right-side floating actions - ALWAYS VISIBLE */}
      <FloatingActionButtons position="right" className={isMinimalChrome ? commonStyles.portalOffset : undefined}>
        <ChatbotAgent />
      </FloatingActionButtons>
      {/* Left-side floating actions - ALWAYS VISIBLE */}
      <FloatingActionButtons position="left" className={isMinimalChrome ? commonStyles.portalOffset : undefined}>
        <ThemeToggleButton />
      </FloatingActionButtons>
      
      <InstallAppBanner />
      <UpdateNotification />
    </div>
  );
};

// Server component
const AppChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AppChromeClient>{children}</AppChromeClient>;
};

export default AppChrome;