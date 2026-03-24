'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { User } from './types';

import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardMetrics from './components/DashboardMetrics/DashboardMetrics';
import DashboardRecentProjects from './components/DashboardRecentProjects/DashboardRecentProjects';
import DashboardActivityFeed from './components/DashboardActivityFeed/DashboardActivityFeed';
import DashboardLayout from './components/DashboardLayout/DashboardLayout'; // Import the new layout
import commonStyles from './dashboard.common.module.css';
import lightStyles from './dashboard.light.module.css';
import darkStyles from './dashboard.dark.module.css';

// @AI-HINT: This is the main Dashboard component, serving as the central hub for all roles.
// It has been completely redesigned with a premium, production-ready UI and layout.
// It uses a responsive grid to ensure a perfect experience on all devices.

interface DashboardProps {
  userRole: 'admin' | 'client' | 'freelancer';
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, user }) => {
    const { resolvedTheme } = useTheme();

    const styles = React.useMemo(() => {
        const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
        return { ...commonStyles, ...themeStyles };
    }, [resolvedTheme]);
  
    return (
        <DashboardLayout user={user}>
            <div className={styles.header}>
                <DashboardHeader user={user} userRole={userRole} styles={styles} />
            </div>
            {/* The rest of the dashboard content will now be children of the main content area in DashboardLayout */}
            <div className={styles.metrics}>
                <DashboardMetrics />
            </div>
            <div className={styles.contentGrid}>
                <div className={styles.recentProjects}>
                    <DashboardRecentProjects />
                </div>
                <div className={styles.activityFeed}>
                    <DashboardActivityFeed />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
