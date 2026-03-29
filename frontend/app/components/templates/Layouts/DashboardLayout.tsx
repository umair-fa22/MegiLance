// @AI-HINT: This is the DashboardLayout component. It provides the main structural layout for all authenticated pages, combining the Sidebar with the main content area.
'use client';

import React, { useState } from 'react';
import Sidebar from '@/app/components/organisms/Sidebar/Sidebar';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// AI-HINT: Import all necessary CSS modules for the layout.
import commonStyles from './DashboardLayout.common.module.css';
import lightStyles from './DashboardLayout.light.module.css';
import darkStyles from './DashboardLayout.dark.module.css';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!resolvedTheme) {
    return null; // Don't render until theme is resolved
  }

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  // Collapsed state is reflected via a CSS class to avoid inline styles

  return (
    <div
      className={cn(
        commonStyles.dashboardLayout,
        themeStyles.dashboardLayout,
        isCollapsed && commonStyles.collapsed
      )}
    >
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <main className={cn(commonStyles.mainContent, themeStyles.mainContent)}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
