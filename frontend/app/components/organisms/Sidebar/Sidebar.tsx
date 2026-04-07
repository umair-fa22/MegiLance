// @AI-HINT: This is the Sidebar component. It provides the main navigation for the application dashboard. It is designed to be responsive, themed, and accessible, with a collapsible state and mobile drawer support, using a per-component CSS module architecture.
'use client';

import React, { useState, useId, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import SidebarNav from '../SidebarNav/SidebarNav';
import { MegiLanceLogo } from '@/app/components/atoms/MegiLanceLogo/MegiLanceLogo';
import UserAvatar from '@/app/components/atoms/UserAvatar/UserAvatar';
import { useAuth } from '@/hooks/useAuth';

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

  const { user: authUser } = useAuth();
  const [user, setUser] = useState<{ name: string; avatar?: string; role?: string } | null>(null);

  useEffect(() => {
    if (authUser) {
      setUser({
        name: authUser.name || 'User',
        avatar: authUser.profile_image_url || authUser.avatar_url,
        role: authUser.user_type || authUser.role || userType
      });
    } else {
      // Fallback to storage if useAuth hasn't loaded yet
      try {
        const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            name: parsedUser.full_name || parsedUser.name || 'User',
            avatar: parsedUser.profile_image_url || parsedUser.avatar || parsedUser.avatar_url,
            role: parsedUser.user_type || parsedUser.role || userType
          });
        }
      } catch {
        // Ignore
      }
    }
  }, [authUser, userType]);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <motion.aside
 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring' as const, stiffness: 200, damping: 20 }}       ref={sidebarRef}
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
      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }} className={cn(commonStyles.sidebarHeader, themeStyles.sidebarHeader)}>
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
      </motion.header>

      <nav id={navId} className={cn(commonStyles.sidebarNavContainer, themeStyles.sidebarNavContainer)} role="navigation">
        <SidebarNav isCollapsed={isCollapsed && !isMobileOpen} userType={userType} />
      </nav>

      <div className={commonStyles.divider} role="separator" aria-hidden="true"></div>

      <motion.footer initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }} className={cn(commonStyles.sidebarFooter, themeStyles.sidebarFooter)}>
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
      </motion.footer>
    </motion.aside>
  );
};

