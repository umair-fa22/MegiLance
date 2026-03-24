// @AI-HINT: This component establishes the primary layout structure for the dashboard, featuring a sidebar and a main content area. This is a foundational piece for a premium, production-ready user experience.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { User } from '../../types';

import Sidebar from '../Sidebar/Sidebar';

import commonStyles from './DashboardLayout.common.module.css';
import lightStyles from './DashboardLayout.light.module.css';
import darkStyles from './DashboardLayout.dark.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user }) => {
  const { resolvedTheme } = useTheme();

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar user={user} />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
