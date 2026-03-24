// @AI-HINT: This is the DashboardLayout, used for client and freelancer pages. It includes the SidebarNav and a main content area.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import SidebarNav from '@/app/components/SidebarNav/SidebarNav';
import commonStyles from './DashboardLayout.common.module.css';
import lightStyles from './DashboardLayout.light.module.css';
import darkStyles from './DashboardLayout.dark.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: 'client' | 'freelancer';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userType }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.layout, themeStyles.layout)}>
      <SidebarNav theme={resolvedTheme} userType={userType} />
      <main className={commonStyles.main}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
