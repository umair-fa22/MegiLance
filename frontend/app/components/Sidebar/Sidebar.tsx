// @AI-HINT: This is the Sidebar component. It provides the main navigation for the application dashboard. It is designed to be responsive, themed, and accessible, with a collapsible state and mobile drawer support, using a per-component CSS module architecture.
'use client';

import React, { useState, useId, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import SidebarNav from '../SidebarNav/SidebarNav';
import { MegiLanceLogo } from '../MegiLanceLogo/MegiLanceLogo';
import UserAvatar from '../UserAvatar/UserAvatar';

// AI-HINT: Import all necessary CSS modules. The theme-specific ones are passed as props to child components.
import commonStyles from './Sidebar.common.module.css';
import lightStyles from './Sidebar.light.module.css';
import darkStyles from './Sidebar.dark.module.css';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  userType?: 'admin' | 'client' | 'freelancer';
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

// AI-HINT: Role-aware navigation is provided by the shared SidebarNav component.

export default function Sidebar({ isCollapsed, toggleSidebar, userType, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const { resolvedTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const uniqueId = useId();
  const sidebarId = `${uniqueId}-sidebar`;
  const navId = `${uniqueId}-nav`;
  const sidebarRef = useRef<HTMLElement>(null);

  // Kill phantom Turbopack animation that persists in compiled CSS
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.style.animation = 'none';
    }
  }, []);

  // Handle keyboard shortcut for toggling sidebar
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '[' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      toggleSidebar();
    }
    // Escape closes mobile sidebar
    if (e.key === 'Escape' && isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  }, [toggleSidebar, isMobileOpen, onMobileClose]);

  // Close mobile sidebar on Escape key (window-level)
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onMobileClose) onMobileClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMobileOpen, onMobileClose]);

  const [user, setUser] = useState<{ name: string; avatar?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          name: parsedUser.full_name || parsedUser.name || 'User',
          avatar: parsedUser.profile_image_url || parsedUser.avatar,
          role: parsedUser.user_type || parsedUser.role || userType
        });
      }
    } catch {
      // Failed to parse user from localStorage
    }
  }, [userType]);

  // Listen for user updates from other components
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') {
        try {
          const parsedUser = e.newValue ? JSON.parse(e.newValue) : null;
          if (parsedUser) {
            setUser({
              name: parsedUser.full_name || parsedUser.name || 'User',
              avatar: parsedUser.profile_image_url || parsedUser.avatar,
              role: parsedUser.user_type || parsedUser.role || userType
            });
          }
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userType]);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <aside
      ref={sidebarRef}
      id={sidebarId}
      data-sidebar="true"
      data-mobile-open={isMobileOpen ? "true" : "false"}
      className={cn(
        commonStyles.sidebar,
        themeStyles.sidebar,
        isCollapsed ? commonStyles.sidebarCollapsed : commonStyles.sidebarExpanded,
        isMobileOpen && commonStyles.sidebarMobileOpen
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      aria-label={`Main navigation sidebar${isCollapsed ? ' (collapsed)' : ''}`}
    >
      <header className={cn(commonStyles.sidebarHeader, themeStyles.sidebarHeader)}>
        <div className={cn(commonStyles.logoContainer)}>
          <MegiLanceLogo className={cn(commonStyles.logoIcon, isHovered && commonStyles.logoIconHovered)} />
          <span
            className={cn(
              commonStyles.logoText,
              themeStyles.logoText,
              isCollapsed && !isMobileOpen && commonStyles.logoTextCollapsed
            )}
            aria-hidden={isCollapsed && !isMobileOpen}
          >
            MegiLance
          </span>
        </div>
        
        {/* Mobile close button */}
        {isMobileOpen && onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className={cn(commonStyles.mobileCloseButton, themeStyles.toggleButton)}
            aria-label="Close sidebar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        {/* Desktop toggle button */}
        {!isMobileOpen && (
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(commonStyles.toggleButton, themeStyles.toggleButton)}
            title={isCollapsed ? 'Expand Sidebar (Ctrl+[)' : 'Collapse Sidebar (Ctrl+[)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            aria-controls={navId}
          >
            {isCollapsed ? <ChevronRight size={20} aria-hidden="true" /> : <ChevronLeft size={20} aria-hidden="true" />}
          </button>
        )}
      </header>

      <nav id={navId} className={cn(commonStyles.sidebarNavContainer, themeStyles.sidebarNavContainer)} role="navigation">
        <SidebarNav isCollapsed={isCollapsed && !isMobileOpen} userType={userType} />
      </nav>

      <div className={commonStyles.divider} role="separator" aria-hidden="true"></div>

      <footer className={cn(commonStyles.sidebarFooter, themeStyles.sidebarFooter)}>
        <div className={cn(commonStyles.userInfo, themeStyles.userInfo)}>
          <div className={commonStyles.avatarWrapper}>
            <UserAvatar 
              src={user?.avatar} 
              name={user?.name || 'User'} 
              size="large" 
              className={commonStyles.avatar} 
            />
            <span className={commonStyles.onlineDot} aria-label="Online" />
          </div>
          <div
            className={cn(
              commonStyles.userDetails,
              isCollapsed && !isMobileOpen && commonStyles.userDetailsCollapsed
            )}
            aria-hidden={isCollapsed && !isMobileOpen}
          >
            <span className={cn(commonStyles.userName, themeStyles.userName)}>
              {user?.name || 'Loading...'}
            </span>
            <span className={cn(commonStyles.userRole, themeStyles.userRole)}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : (userType ? userType.charAt(0).toUpperCase() + userType.slice(1) : 'User')}
            </span>
          </div>
        </div>
      </footer>
    </aside>
  );
};