// @AI-HINT: This component renders the header for the main dashboard. It's designed to be a reusable and focused component, following premium SaaS development practices by separating concerns. It includes the welcome title, subtitle, and primary actions like notifications.

'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { User } from '../../types';

interface DashboardHeaderProps {
  userRole: 'admin' | 'client' | 'freelancer';
  user: User;
  styles: { [key: string]: string };
}

const getWelcomeMessage = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Oversee and manage the platform.';
    case 'client':
      return 'Manage your projects and hiring.';
    case 'freelancer':
    default:
      return 'Here is your project and task overview.';
  }
};

// @AI-HINT: This component renders the header for the main dashboard. It's designed to be a reusable and focused component, following premium SaaS development practices by separating concerns. It includes the welcome title, subtitle, and primary actions like notifications. Now fully theme-switchable.

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userRole, user, styles }) => {
  return (
    <div className={styles.dashboardHeader}>
      <div className={styles.welcome}>
        <h1 className={styles.title}>Welcome back, {user.fullName}!</h1>
        <p className={styles.subtitle}>{getWelcomeMessage(userRole)}</p>
      </div>
      <div className={styles.actions}>
        <button className={styles.notificationBtn} aria-label={`View ${user.notificationCount} notifications`}>
          <Bell className={styles.notificationIcon} size={20} />
          {user && user.notificationCount > 0 && (
            <span className={styles.notificationBadge}>{user.notificationCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
