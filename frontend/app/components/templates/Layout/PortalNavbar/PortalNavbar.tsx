// @AI-HINT: Redesigned portal navbar with breadcrumbs, notifications, help menu, quick actions, and modern UX.
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  Bell, Search, HelpCircle, Sun, Moon, LogOut, User, Settings, 
  X, Check, CheckCheck, MessageSquare, FileText,
  Briefcase, CreditCard, AlertCircle, Clock, ChevronRight,
  Keyboard, BookOpen, Mail, Shield, Wallet, Menu, Home
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfileMenu, { ProfileMenuItem } from '@/app/components/molecules/ProfileMenu/ProfileMenu';
import { clearAuthData } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import {
  clientNavItems,
  freelancerNavItems,
  adminNavItems,
  NavItem as ConfigNavItem
} from '@/app/config/navigation';

import commonStyles from './PortalNavbar.common.module.css';
import lightStyles from './PortalNavbar.light.module.css';
import darkStyles from './PortalNavbar.dark.module.css';

interface PortalNavbarProps {
  userType?: 'client' | 'freelancer' | 'admin' | 'general';
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

// Format time ago helper
function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default function PortalNavbar({ userType = 'client', onMenuToggle, isSidebarOpen = false }: PortalNavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const [user, setUser] = useState<{ name: string; email?: string; avatar?: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Real-time notifications via WebSocket
  const { notifications: rawNotifications, unreadCount, markAsRead: hookMarkAsRead, markAllAsRead: hookMarkAllAsRead } = useNotifications();
  const { user: authUser, logout } = useAuth();
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Map hook notifications to the UI format
  const notifications = rawNotifications.slice(0, 10).map(n => ({
    id: String(n.id),
    type: (n.type || 'system') as 'message' | 'project' | 'payment' | 'alert' | 'system',
    title: n.title || 'Notification',
    description: n.message || '',
    time: formatTimeAgo(n.created_at || ''),
    read: n.is_read || false,
    actionUrl: n.action_url,
  }));

  useEffect(() => {
    setMounted(true);
    if (authUser) {
      setUser({
        name: authUser.name || 'User',
        email: authUser.email,
        avatar: authUser.profile_image_url || authUser.avatar_url
      });
    } else {
      try {
        const storedUser = window.localStorage.getItem('user') || window.sessionStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            name: parsedUser.full_name || parsedUser.name || 'User',
            email: parsedUser.email,
            avatar: parsedUser.profile_image_url || parsedUser.avatar || parsedUser.avatar_url
          });
        }
      } catch {
        // Failed to parse user data
      }
    }
  }, [authUser]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setShowHelpMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector(`.${commonStyles.searchInput}`) as HTMLInputElement;
        searchInput?.focus();
      }
      // Escape to close dropdowns
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowHelpMenu(false);
        setShowSearchResults(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const markAsRead = (id: string) => {
    hookMarkAsRead(Number(id));
  };

  const markAllAsRead = () => {
    hookMarkAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className={commonStyles.notifIconMessage} />;
      case 'project': return <Briefcase size={16} className={commonStyles.notifIconProject} />;
      case 'payment': return <CreditCard size={16} className={commonStyles.notifIconPayment} />;
      case 'alert': return <AlertCircle size={16} className={commonStyles.notifIconAlert} />;
      default: return <Bell size={16} className={commonStyles.notifIconSystem} />;
    }
  };

  const menuItems: ProfileMenuItem[] = [
    { 
      label: 'View Profile', 
      href: userType === 'general' ? '/profile' : `/${userType}/profile`, 
      icon: <User size={16} /> 
    },
    { 
      label: 'Account Settings', 
      href: userType === 'general' ? '/settings' : `/${userType}/settings`, 
      icon: <Settings size={16} /> 
    },
    { 
      label: 'Wallet & Payments', 
      href: userType === 'general' ? '/wallet' : `/${userType}/wallet`, 
      icon: <Wallet size={16} /> 
    },
    { 
      label: 'Security', 
      href: userType === 'general' ? '/settings' : `/${userType}/settings?tab=security`, 
      icon: <Shield size={16} /> 
    },
    { 
      label: 'Sign Out', 
      onClick: handleLogout, 
      icon: <LogOut size={16} /> 
    },
  ];

  const helpMenuItems = [
    { label: 'Help Center', href: '/help', icon: <BookOpen size={16} />, description: 'Browse help articles' },
    { label: 'Keyboard Shortcuts', icon: <Keyboard size={16} />, description: 'Ctrl+K to search', onClick: () => {} },
    { label: 'Contact Support', href: `/${userType}/support`, icon: <Mail size={16} />, description: 'Get help from our team' },
    { label: 'Help Articles', href: '/help', icon: <FileText size={16} />, description: 'Browse guides & FAQs' },
  ];

  // Build breadcrumb segments from the current pathname
  const breadcrumbs = useMemo(() => {
    if (!pathname) return [{ label: 'Dashboard', href: '' }];
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [{ label: 'Dashboard', href: '/' }];

    // First segment is the portal area (client/freelancer/admin)
    const area = segments[0];
    const crumbs: { label: string; href: string }[] = [];

    // Dashboard root
    crumbs.push({ label: 'Dashboard', href: `/${area}/dashboard` });

    // Build path crumbs for remaining segments (skip the area itself)
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (seg === 'dashboard') continue; // Already added
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      const href = '/' + segments.slice(0, i + 1).join('/');
      crumbs.push({ label, href });
    }

    // If we only have Dashboard (i.e. the path was /client or /client/dashboard), return just that
    if (crumbs.length === 1) return crumbs;
    return crumbs;
  }, [pathname]);

  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) return null;

  return (
    <header className={cn(commonStyles.navbar, styles.navbar)}>
      <div className={cn(commonStyles.container, styles.container)}>
        <div className={commonStyles.leftSection}>
          {/* Mobile hamburger menu */}
          {onMenuToggle && (
            <button 
              className={cn(
                commonStyles.menuButton,
                styles.menuButton,
                isSidebarOpen && commonStyles.menuButtonActive
              )}
              onClick={onMenuToggle}
              aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isSidebarOpen}
              title="Menu"
            >
              <span className={cn(commonStyles.hamburgerLine, commonStyles.hamburgerLine1)} />
              <span className={cn(commonStyles.hamburgerLine, commonStyles.hamburgerLine2)} />
              <span className={cn(commonStyles.hamburgerLine, commonStyles.hamburgerLine3)} />
            </button>
          )}

          {/* Mobile page title (shown when breadcrumbs are hidden) */}
          <h1 className={cn(commonStyles.mobilePageTitle, styles.breadcrumbCurrent)}>{pageTitle}</h1>
          
          {/* Breadcrumb navigation */}
          <nav aria-label="Breadcrumb" className={commonStyles.breadcrumb}>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && (
                    <ChevronRight size={14} className={cn(commonStyles.breadcrumbSeparator, styles.breadcrumbSeparator)} aria-hidden="true" />
                  )}
                  {isLast ? (
                    <span className={cn(commonStyles.breadcrumbCurrent, styles.breadcrumbCurrent)} aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href} className={cn(commonStyles.breadcrumbLink, styles.breadcrumbLink)}>
                      {idx === 0 && <Home size={14} className={commonStyles.breadcrumbHomeIcon} />}
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Enhanced Search */}
        <div className={cn(commonStyles.searchContainer, styles.searchContainer)} ref={searchRef}>
          <Search size={18} className={commonStyles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search... (Ctrl+K)" 
            className={cn(commonStyles.searchInput, styles.searchInput)}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                setShowSearchResults(false);
                router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
          />
          {searchQuery && (
            <button 
              className={commonStyles.searchClear}
              onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          
          {/* Search Results Dropdown — filters navigation items by query */}
          {showSearchResults && (() => {
            const q = searchQuery.toLowerCase();
            const navItems = userType === 'admin' ? adminNavItems
              : userType === 'freelancer' ? freelancerNavItems
              : clientNavItems;
            
            // Flatten nav items including submenu children
            const allItems: ConfigNavItem[] = [];
            for (const item of navItems) {
              if (item.label.toLowerCase().includes(q)) allItems.push(item);
              if (item.submenu) {
                for (const sub of item.submenu) {
                  if (sub.label.toLowerCase().includes(q)) allItems.push(sub);
                }
              }
            }
            const matchedItems = allItems.slice(0, 6);

            return (
              <div className={cn(commonStyles.searchDropdown, styles.searchDropdown)}>
                {matchedItems.length > 0 && (
                  <div className={commonStyles.searchSection}>
                    <span className={commonStyles.searchSectionTitle}>Pages</span>
                    {matchedItems.map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        className={commonStyles.searchItem}
                        onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                      >
                        <FileText size={14} /> {item.label}
                      </Link>
                    ))}
                  </div>
                )}
                <div className={commonStyles.searchSection}>
                  <span className={commonStyles.searchSectionTitle}>Actions</span>
                  <Link 
                    href={`/search?q=${encodeURIComponent(searchQuery.trim())}`} 
                    className={commonStyles.searchItem}
                    onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                  >
                    <Search size={14} /> Search &quot;{searchQuery}&quot; across platform
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>

        <div className={commonStyles.rightSection}>
          {/* Theme Toggle */}
          <button 
            className={cn(commonStyles.actionButton, styles.actionButton)} 
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Help Menu - hidden on mobile, accessible via sidebar */}
          <div className={cn(commonStyles.dropdownWrapper, commonStyles.hideOnMobile)} ref={helpRef}>
            <button 
              className={cn(commonStyles.actionButton, styles.actionButton)} 
              aria-label="Help"
              onClick={() => setShowHelpMenu(!showHelpMenu)}
              title="Help & Resources"
            >
              <HelpCircle size={20} />
            </button>
            
            {showHelpMenu && (
              <div className={cn(commonStyles.helpDropdown, styles.helpDropdown)}>
                <div className={commonStyles.helpHeader}>
                  <span className={commonStyles.helpTitle}>Help & Resources</span>
                </div>
                <div className={commonStyles.helpItems}>
                  {helpMenuItems.map((item, idx) => (
                    item.href ? (
                      <Link 
                        key={idx} 
                        href={item.href} 
                        className={commonStyles.helpItem}
                        onClick={() => setShowHelpMenu(false)}
                      >
                        <span className={commonStyles.helpItemIcon}>{item.icon}</span>
                        <div className={commonStyles.helpItemContent}>
                          <span className={commonStyles.helpItemLabel}>{item.label}</span>
                          <span className={commonStyles.helpItemDesc}>{item.description}</span>
                        </div>
                      </Link>
                    ) : (
                      <button 
                        key={idx} 
                        className={commonStyles.helpItem}
                        onClick={() => { item.onClick?.(); setShowHelpMenu(false); }}
                      >
                        <span className={commonStyles.helpItemIcon}>{item.icon}</span>
                        <div className={commonStyles.helpItemContent}>
                          <span className={commonStyles.helpItemLabel}>{item.label}</span>
                          <span className={commonStyles.helpItemDesc}>{item.description}</span>
                        </div>
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Notifications */}
          <div className={commonStyles.dropdownWrapper} ref={notificationRef}>
            <button 
              className={cn(commonStyles.actionButton, styles.actionButton, showNotifications && commonStyles.actionButtonActive)} 
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className={commonStyles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className={cn(commonStyles.notificationDropdown, styles.notificationDropdown)}>
                <div className={commonStyles.notificationHeader}>
                  <span className={commonStyles.notificationTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      className={commonStyles.markAllRead}
                      onClick={markAllAsRead}
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>
                
                <div className={commonStyles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={commonStyles.emptyNotifications}>
                      <Bell size={32} className={commonStyles.emptyIcon} />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={cn(
                          commonStyles.notificationItem, 
                          styles.notificationItem,
                          !notif.read && commonStyles.unread
                        )}
                        onClick={() => {
                          markAsRead(notif.id);
                          if (notif.actionUrl) router.push(notif.actionUrl);
                          setShowNotifications(false);
                        }}
                      >
                        <div className={commonStyles.notificationIcon}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className={commonStyles.notificationContent}>
                          <span className={commonStyles.notificationItemTitle}>{notif.title}</span>
                          <span className={commonStyles.notificationDesc}>{notif.description}</span>
                          <span className={commonStyles.notificationTime}>
                            <Clock size={12} /> {notif.time}
                          </span>
                        </div>
                        {!notif.read && (
                          <button 
                            className={commonStyles.markRead}
                            onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <Link 
                  href={`/${userType}/notifications`} 
                  className={commonStyles.viewAllLink}
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          {user && (
            <ProfileMenu 
              userName={user.name}
              userEmail={user.email}
              userImageUrl={user.avatar}
              menuItems={menuItems}
              className="ml-2"
            />
          )}
        </div>
      </div>
    </header>
  );
};
