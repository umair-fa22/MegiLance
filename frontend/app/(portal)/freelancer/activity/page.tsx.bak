// @AI-HINT: Activity feed showing user actions, notifications, and timeline
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { activityFeedApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import commonStyles from './Activity.common.module.css';
import lightStyles from './Activity.light.module.css';
import darkStyles from './Activity.dark.module.css';

interface ActivityItem {
  id: string;
  type: 'proposal' | 'contract' | 'payment' | 'message' | 'review' | 'milestone' | 'profile' | 'project' | 'badge';
  action: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  related_id?: string;
  related_type?: string;
  created_at: string;
  read: boolean;
}

interface ActivityFilter {
  type: string;
  label: string;
  icon: string;
}

const activityFilters: ActivityFilter[] = [
  { type: 'all', label: 'All Activity', icon: '📋' },
  { type: 'proposal', label: 'Proposals', icon: '📝' },
  { type: 'contract', label: 'Contracts', icon: '📄' },
  { type: 'payment', label: 'Payments', icon: '💰' },
  { type: 'message', label: 'Messages', icon: '💬' },
  { type: 'review', label: 'Reviews', icon: '⭐' },
  { type: 'milestone', label: 'Milestones', icon: '🎯' },
  { type: 'project', label: 'Projects', icon: '📁' },
];

const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    proposal: '📝',
    contract: '📄',
    payment: '💰',
    message: '💬',
    review: '⭐',
    milestone: '🎯',
    profile: '👤',
    project: '📁',
    badge: '🏆',
  };
  return icons[type] || '📌';
};

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const groupByDate = (items: ActivityItem[]): Map<string, ActivityItem[]> => {
  const groups = new Map<string, ActivityItem[]>();
  
  items.forEach(item => {
    const date = new Date(item.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(item);
  });
  
  return groups;
};

export default function ActivityPage() {
  const { resolvedTheme } = useTheme();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadActivities();
  }, [activeFilter]);

  const loadActivities = async (append = false) => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: append ? page + 1 : 1,
        limit: 20,
      };
      if (activeFilter !== 'all') {
        params.type = activeFilter;
      }
      
      const response = await activityFeedApi.list(params);
      const items = (response as any).items || [];
      
      if (append) {
        setActivities(prev => [...prev, ...items]);
        setPage(prev => prev + 1);
      } else {
        setActivities(items);
        setPage(1);
      }
      setHasMore(items.length === 20);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await (activityFeedApi as any).markAsRead(id);
      setActivities(prev =>
        prev.map(a => (a.id === id ? { ...a, read: true } : a))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await (activityFeedApi as any).markAllAsRead();
      setActivities(prev => prev.map(a => ({ ...a, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const unreadCount = activities.filter(a => !a.read).length;
  const groupedActivities = groupByDate(
    activeFilter === 'all' ? activities : activities.filter(a => a.type === activeFilter)
  );

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={15} className="absolute inset-0" />
        <div className="absolute top-[60%] right-[15%] opacity-10"><FloatingCube /></div>
        <div className="absolute top-[20%] left-[10%] opacity-10"><FloatingSphere /></div>
      </div>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerTop}>
              <div>
                <h1 className={cn(commonStyles.title, themeStyles.title)}>Activity Feed</h1>
                <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                  Track all your recent actions and updates
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={cn(commonStyles.markAllButton, themeStyles.markAllButton)}
                >
                  Mark all as read ({unreadCount})
                </button>
              )}
            </div>

            <div className={cn(commonStyles.filters, themeStyles.filters)}>
              {activityFilters.map(filter => (
                <button
                  key={filter.type}
                  onClick={() => setActiveFilter(filter.type)}
                  className={cn(
                    commonStyles.filterButton,
                    themeStyles.filterButton,
                    activeFilter === filter.type && commonStyles.filterActive,
                    activeFilter === filter.type && themeStyles.filterActive
                  )}
                >
                  <span className={commonStyles.filterIcon}>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {loading && activities.length === 0 ? (
          <div className={cn(commonStyles.loading, themeStyles.loading)}>
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            <span className={commonStyles.emptyIcon}>📭</span>
            <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>No Activity Yet</h3>
            <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
              Your recent actions and updates will appear here
            </p>
          </div>
        ) : (
          <div className={commonStyles.timeline}>
            {Array.from(groupedActivities.entries()).map(([dateGroup, items]) => (
              <div key={dateGroup} className={commonStyles.dateGroup}>
                <h3 className={cn(commonStyles.dateHeader, themeStyles.dateHeader)}>
                  {dateGroup}
                </h3>
                <StaggerContainer className={commonStyles.activities}>
                  {items.map(activity => (
                    <StaggerItem
                      key={activity.id}
                      className={cn(
                        commonStyles.activityCard,
                        themeStyles.activityCard,
                        !activity.read && commonStyles.unread,
                        !activity.read && themeStyles.unread
                      )}
                      onClick={() => !activity.read && markAsRead(activity.id)}
                    >
                      <div className={cn(commonStyles.activityIcon, themeStyles.activityIcon)}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className={commonStyles.activityContent}>
                        <div className={commonStyles.activityTop}>
                          <span className={cn(commonStyles.activityAction, themeStyles.activityAction)}>
                            {activity.action}
                          </span>
                          <span className={cn(commonStyles.activityTime, themeStyles.activityTime)}>
                            {getRelativeTime(activity.created_at)}
                          </span>
                        </div>
                        <h4 className={cn(commonStyles.activityTitle, themeStyles.activityTitle)}>
                          {activity.title}
                        </h4>
                        <p className={cn(commonStyles.activityDesc, themeStyles.activityDesc)}>
                          {activity.description}
                        </p>
                        {activity.related_type && (
                          <span className={cn(commonStyles.relatedLink, themeStyles.relatedLink)}>
                            View {activity.related_type} →
                          </span>
                        )}
                      </div>
                      {!activity.read && (
                        <span className={cn(commonStyles.unreadDot, themeStyles.unreadDot)} />
                      )}
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            ))}

            {hasMore && (
              <div className={commonStyles.loadMoreContainer}>
                <button
                  onClick={() => loadActivities(true)}
                  disabled={loading}
                  className={cn(commonStyles.loadMoreButton, themeStyles.loadMoreButton)}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
