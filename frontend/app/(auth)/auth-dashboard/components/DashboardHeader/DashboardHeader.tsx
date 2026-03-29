// @AI-HINT: Premium dashboard header with modern icon bar, quick actions, and role-specific CTAs.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Calendar,
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  Settings,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '../../types';

import commonStyles from './DashboardHeader.common.module.css';
import lightStyles from './DashboardHeader.light.module.css';
import darkStyles from './DashboardHeader.dark.module.css';

interface DashboardHeaderProps {
  userRole: 'admin' | 'client' | 'freelancer';
  user: User;
  styles: { [key: string]: string }; // Legacy prop - keeping for backward compatibility
}

const getWelcomeMessage = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Platform overview and management tools';
    case 'client':
      return 'Manage your projects and find talent';
    case 'freelancer':
    default:
      return 'Track your projects and opportunities';
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Role-specific quick actions
const getQuickActions = (role: string) => {
  switch (role) {
    case 'admin':
      return [
        { label: 'Users', icon: Users, href: '/admin/users', color: 'blue' },
        { label: 'Reports', icon: TrendingUp, href: '/admin/reports', color: 'green' },
        { label: 'Settings', icon: Settings, href: '/admin/settings', color: 'purple' },
      ];
    case 'client':
      return [
        { label: 'Post Job', icon: Plus, href: '/client/post-job', color: 'primary', isPrimary: true },
        { label: 'Find Talent', icon: Search, href: '/client/talent', color: 'blue' },
        { label: 'My Projects', icon: Briefcase, href: '/client/projects', color: 'green' },
      ];
    case 'freelancer':
    default:
      return [
        { label: 'Find Work', icon: Search, href: '/freelancer/find-work', color: 'primary', isPrimary: true },
        { label: 'Proposals', icon: FileText, href: '/freelancer/proposals', color: 'blue' },
        { label: 'Schedule', icon: Calendar, href: '/freelancer/schedule', color: 'green' },
      ];
  }
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userRole, user }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const quickActions = getQuickActions(userRole);
  const firstName = user.fullName?.split(' ')[0] || 'there';

  if (!mounted) {
    return (
      <div className={cn(commonStyles.header, lightStyles.header)}>
        <div className={commonStyles.headerTitle}>
          <h1>Welcome back!</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.header, themeStyles.header)}>
      {/* Welcome Section */}
      <div className={commonStyles.headerTitle}>
        <div className={commonStyles.greetingRow}>
          <Sparkles size={20} className={cn(commonStyles.greetingIcon, themeStyles.greetingIcon)} />
          <span className={cn(commonStyles.greetingTime, themeStyles.greetingTime)}>
            {getGreeting()}
          </span>
        </div>
        <h1 className={themeStyles.title}>
          Welcome back, {firstName}!
        </h1>
        <p className={themeStyles.subtitle}>
          {getWelcomeMessage(userRole)}
        </p>
      </div>

      {/* Quick Actions */}
      <div className={commonStyles.headerActions}>
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={cn(
              commonStyles.actionButton,
              themeStyles.actionButton,
              action.isPrimary && commonStyles.actionButtonPrimary,
              action.isPrimary && themeStyles.actionButtonPrimary
            )}
          >
            <action.icon size={18} />
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
