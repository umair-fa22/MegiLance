// @AI-HINT: This component displays a list of recent projects in a premium, sortable table. It's designed for a scannable overview of project status, progress, and deadlines, a key feature in production-ready project management dashboards.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { cn } from '@/lib/utils';
import { useDashboardData } from '@/hooks/useDashboardData';
import { RecentProject } from '../../types';

import commonStyles from './DashboardRecentProjects.common.module.css';
import lightStyles from './DashboardRecentProjects.light.module.css';
import darkStyles from './DashboardRecentProjects.dark.module.css';

const statusStyles: Record<RecentProject['status'], string> = {
  'In Progress': 'inProgress',
  'Review': 'review',
  'Completed': 'completed',
  'Overdue': 'overdue',
};

const DashboardRecentProjects: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { data, loading, error } = useDashboardData();

  const styles = React.useMemo(() => {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return { ...commonStyles, ...themeStyles } as { [k: string]: string };
  }, [resolvedTheme]);

  if (loading) {
    return (
      <div className={styles.recentProjectsCard} aria-busy={loading || undefined} aria-live="polite">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Recent Projects</h2>
          <span className={styles.skeletonText} />
        </div>
        <div className={styles.skeletonTable} />
      </div>
    );
  }

  if (error || !data?.recentProjects?.length) {
    return (
      <div className={styles.recentProjectsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Recent Projects</h2>
        </div>
        <EmptyState title="No recent projects" description="You have no active or recent projects at the moment." />
      </div>
    );
  }

  return (
    <div className={styles.recentProjectsCard}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Recent Projects</h2>
        <Link href="/projects" className={styles.viewAllLink}>
          View All
        </Link>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Client</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody>
          {data.recentProjects.map((project) => (
            <tr key={project.id}>
              <td>{project.title}</td>
              <td>{project.client}</td>
              <td>
                <span className={cn(styles.statusBadge, styles[statusStyles[project.status]])}>
                  <span className={cn(styles.statusDot, styles[`${statusStyles[project.status]}Dot`])}></span>
                  {project.status}
                </span>
              </td>
              <td>
                <progress
                  className={styles.progress}
                  value={project.progress}
                  max={100}
                  aria-label={`Progress ${project.progress}%`}
                />
              </td>
              <td>{project.deadline}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardRecentProjects;
