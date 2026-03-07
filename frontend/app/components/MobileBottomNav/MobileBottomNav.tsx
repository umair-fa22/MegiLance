// @AI-HINT: Persistent bottom tab navigation for mobile screens. Shows 5 primary actions with badges, role-aware routing, and active state indicators. Only visible on screens <= 768px.
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  Bell,
  Briefcase,
  Users,
  LineChart,
} from 'lucide-react';
import { useUnreadCounts } from '@/contexts/UnreadCountContext';

import commonStyles from './MobileBottomNav.common.module.css';
import lightStyles from './MobileBottomNav.light.module.css';
import darkStyles from './MobileBottomNav.dark.module.css';

interface MobileBottomNavProps {
  userType: 'client' | 'freelancer' | 'admin';
}

interface TabItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeKey?: 'messages' | 'notifications';
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ userType }) => {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { counts: unreadCounts } = useUnreadCounts();

  const tabs: TabItem[] = useMemo(() => {
    const base = `/${userType}`;
    switch (userType) {
      case 'freelancer':
        return [
          { label: 'Home', href: `${base}/dashboard`, icon: <LayoutDashboard size={20} /> },
          { label: 'Jobs', href: `${base}/jobs`, icon: <Search size={20} /> },
          { label: 'Messages', href: `${base}/messages`, icon: <MessageSquare size={20} />, badgeKey: 'messages' },
          { label: 'Alerts', href: `${base}/notifications`, icon: <Bell size={20} />, badgeKey: 'notifications' },
        ];
      case 'client':
        return [
          { label: 'Home', href: `${base}/dashboard`, icon: <LayoutDashboard size={20} /> },
          { label: 'Post Job', href: `${base}/post-job`, icon: <Briefcase size={20} /> },
          { label: 'Messages', href: `${base}/messages`, icon: <MessageSquare size={20} />, badgeKey: 'messages' },
          { label: 'Alerts', href: `${base}/notifications`, icon: <Bell size={20} />, badgeKey: 'notifications' },
        ];
      case 'admin':
        return [
          { label: 'Home', href: `${base}/dashboard`, icon: <LayoutDashboard size={20} /> },
          { label: 'Users', href: `${base}/users`, icon: <Users size={20} /> },
          { label: 'Messages', href: `${base}/messages`, icon: <MessageSquare size={20} />, badgeKey: 'messages' },
          { label: 'Analytics', href: `${base}/analytics`, icon: <LineChart size={20} /> },
        ];
      default:
        return [];
    }
  }, [userType]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <nav
      className={cn(commonStyles.bottomNav, themeStyles.bottomNav)}
      aria-label="Mobile navigation"
      role="navigation"
    >
      {tabs.map((tab) => {
        const isActive = pathname !== null && (
          pathname === tab.href || pathname.startsWith(tab.href + '/')
        );
        const badge = tab.badgeKey ? unreadCounts[tab.badgeKey] : 0;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              commonStyles.tabItem,
              themeStyles.tabItem,
              isActive && commonStyles.tabItemActive,
              isActive && themeStyles.tabItemActive
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={cn(commonStyles.tabIconWrap, isActive && commonStyles.tabIconWrapActive)}>
              {tab.icon}
              {badge > 0 && (
                <span className={commonStyles.tabBadge} aria-label={`${badge} unread`}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            <span className={cn(commonStyles.tabLabel, themeStyles.tabLabel, isActive && themeStyles.tabLabelActive)}>
              {tab.label}
            </span>
            {isActive && <span className={cn(commonStyles.activeIndicator, themeStyles.activeIndicator)} />}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
