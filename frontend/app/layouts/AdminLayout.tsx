// @AI-HINT: This is the AdminLayout, used for all admin-facing pages. It includes the SidebarNav with admin links.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import SidebarNav from '@/app/components/SidebarNav/SidebarNav';
import commonStyles from './DashboardLayout.common.module.css';
import lightStyles from './DashboardLayout.light.module.css';
import darkStyles from './DashboardLayout.dark.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;


  return (
    <div className={cn(commonStyles.layout, themeStyles.layout)}>
      <SidebarNav theme={resolvedTheme} userType="admin" />
      <main className={commonStyles.main}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
