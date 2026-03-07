// @AI-HINT: This is the main AppLayout component that creates the shell for authenticated users, combining the Sidebar and Navbar for a cohesive application experience.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import PortalNavbar from '../Layout/PortalNavbar/PortalNavbar';
import PortalFooter from '../Layout/PortalFooter/PortalFooter';
import MobileBottomNav from '../MobileBottomNav/MobileBottomNav';
import { ChatbotAgent } from '@/app/components/AI';
import CommandPalette from '@/app/components/CommandPalette/CommandPalette';

import ErrorBoundary from '@/app/components/ErrorBoundary/ErrorBoundary';

import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import commonStyles from './AppLayout.common.module.css';
import lightStyles from './AppLayout.light.module.css';
import darkStyles from './AppLayout.dark.module.css';

// @AI-HINT: Build profile menu links based on current area (client/freelancer/admin/general)
// so that portal pages use the portal layout instead of the public website layout.

interface UserData {
  fullName: string;
  full_name?: string;
  email: string;
  bio?: string;
  avatar?: string;
  avatar_url?: string;
  notificationCount?: number;
}

const DEFAULT_USER: UserData = {
  fullName: 'User',
  email: '',
  bio: '',
  avatar: '/mock-avatar.svg',
  notificationCount: 0,
};

function getStoredUser(): UserData {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = window.localStorage.getItem('user');
    if (!raw) return DEFAULT_USER;
    const parsed = JSON.parse(raw);
    return {
      fullName: parsed.full_name || parsed.fullName || parsed.name || 'User',
      email: parsed.email || '',
      bio: parsed.bio || parsed.title || '',
      avatar: parsed.avatar_url || parsed.avatar || '/mock-avatar.svg',
      notificationCount: parsed.notificationCount || 0,
    };
  } catch {
    return DEFAULT_USER;
  }
}

const COLLAPSED_KEY = 'sidebar_collapsed';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSED_KEY) === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<UserData>(DEFAULT_USER);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  // Load real user data from localStorage (set by portal layout auth check)
  useEffect(() => {
    setUser(getStoredUser());
    // Listen for storage changes (e.g. user updates profile in another tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') setUser(getStoredUser());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const area: 'client' | 'freelancer' | 'admin' = useMemo(() => {
    if (!pathname) return 'client';
    if (pathname.startsWith('/client')) return 'client';
    if (pathname.startsWith('/freelancer')) return 'freelancer';
    if (pathname.startsWith('/admin')) return 'admin';
    return 'client';
  }, [pathname]);

  // Announce route changes to screen readers
  const [routeAnnouncement, setRouteAnnouncement] = useState('');
  useEffect(() => {
    if (pathname) {
      const pageName = pathname.split('/').pop() || 'Home';
      const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');
      setRouteAnnouncement(`Navigated to ${formattedName} page`);
    }
  }, [pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Ctrl+K / Cmd+K command palette shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Remember the current portal area for cross-route redirects from public pages
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('portal_area', area);
    }
  }, [area]);

  const toggleSidebar = useCallback(() => {
    // On mobile, toggle mobile-open state instead
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => {
        const next = !prev;
        window.localStorage.setItem(COLLAPSED_KEY, String(next));
        return next;
      });
    }
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const themeStyles = (resolvedTheme === 'dark') ? darkStyles : lightStyles;

  return (
    <>
      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className={cn(commonStyles.skipLink, themeStyles.skipLink)}
      >
        Skip to main content
      </a>
      
      {/* Live region for route announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className={commonStyles.srOnly}
      >
        {routeAnnouncement}
      </div>

      <div className={cn(commonStyles.appLayout, themeStyles.appLayout)} suppressHydrationWarning>
        {/* Mobile overlay backdrop */}
        <div
          className={cn(
            commonStyles.mobileOverlay,
            themeStyles.mobileOverlay,
            isMobileOpen && commonStyles.mobileOverlayVisible,
            isMobileOpen && themeStyles.mobileOverlayVisible
          )}
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />

        <Sidebar 
          isCollapsed={isCollapsed} 
          toggleSidebar={toggleSidebar} 
          userType={(area as string) === 'general' ? undefined : area}
          isMobileOpen={isMobileOpen}
          onMobileClose={closeMobileSidebar}
        />

        <div className={cn(
          commonStyles.mainContent,
          isCollapsed && commonStyles.mainContentCollapsed
        )}>
          <PortalNavbar userType={area} onMenuToggle={toggleSidebar} isSidebarOpen={isMobileOpen} />

          <ErrorBoundary>
            <main 
              id="main-content" 
              className={cn(commonStyles.pageContent, themeStyles.pageContent)}
              role="main"
              aria-label={`${area.charAt(0).toUpperCase() + area.slice(1)} Dashboard content`}
            >
              {children}
            </main>
          </ErrorBoundary>

          <div className={commonStyles.footerWrapper}>
            <PortalFooter />
          </div>

          <ErrorBoundary>
            <ChatbotAgent />
          </ErrorBoundary>
        </div>

        {/* Mobile bottom tab navigation */}
        <MobileBottomNav userType={area} />
      </div>

      {/* Command Palette — Ctrl+K */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        userRole={area}
      />
    </>
  );
};

export default AppLayout;
