// @AI-HINT: This component displays a feed of recent user and system activities in a premium timeline format. It's designed to be clear, scannable, and informative, enhancing user engagement and providing transparency—hallmarks of a premium SaaS experience.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { DollarSign, Briefcase, ListTodo, Users } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

import commonStyles from './DashboardActivityFeed.common.module.css';
import lightStyles from './DashboardActivityFeed.light.module.css';
import darkStyles from './DashboardActivityFeed.dark.module.css';

// Map string names from API data to actual React icon components
const iconMap: { [key: string]: React.ElementType } = {
  FaDollarSign: DollarSign,
  FaBriefcase: Briefcase,
  FaTasks: ListTodo,
  FaUsers: Users,
};

const DashboardActivityFeed: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { data, loading, error } = useDashboardData();

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles } as { [k: string]: string };
  }, [resolvedTheme]);

  if (loading) {
    return (
      <div className={styles.activityFeedCard} aria-busy={loading || undefined} aria-live="polite">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Activity Feed</h2>
          <span className={styles.skeletonText} />
        </div>
        <ul className={styles.activityList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className={styles.activityItem}>
              <div className={styles.timeline}></div>
              <div className={styles.activityIconContainer} />
              <div className={styles.activityContent}>
                <div className={styles.skeletonText} />
                <div className={styles.skeletonText} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error || !data?.activityFeed?.length) {
    return (
      <div className={styles.activityFeedCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Activity Feed</h2>
          <Link href="/activity" className={styles.viewAllLink}>
            View All
          </Link>
        </div>
        <div className={styles.emptyState}>No recent activity.</div>
      </div>
    );
  }

  return (
    <div className={styles.activityFeedCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Activity Feed</h2>
        <Link href="/dashboard" className={styles.viewAllLink}>
          View All
        </Link>
      </div>
      <ul className={styles.activityList}>
        {data.activityFeed.map((activity) => {
          const IconComponent = iconMap[activity.icon];
          return (
            <li key={activity.id} className={styles.activityItem}>
              <div className={styles.timeline}></div>
              <div className={styles.activityIconContainer}>
                {IconComponent && <IconComponent className={styles.activityIcon} />}
              </div>
              <div className={styles.activityContent}>
                <p>{activity.message}</p>
                <p className={styles.activityTimestamp}>{activity.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DashboardActivityFeed;
