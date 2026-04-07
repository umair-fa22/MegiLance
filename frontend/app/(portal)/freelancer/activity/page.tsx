// @AI-HINT: Activity feed showing user actions, notifications, and timeline with stats, search, and detail expansion
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { activityFeedApi } from '@/lib/api';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Button from '@/app/components/atoms/Button/Button';
import {
  Activity, Bell, BellOff, Search, Filter, ChevronDown, ChevronUp,
  FileText, DollarSign, MessageSquare, Star, Target, User, FolderOpen,
  Trophy, Pin, Calendar, Clock, CheckCircle, ArrowRight, Eye,
  Briefcase, Send, AlertCircle, X, RefreshCw, TrendingUp, Zap
} from 'lucide-react';
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

const ACTIVITY_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  proposal: { icon: Send, color: '#3b82f6' },
  contract: { icon: FileText, color: '#8b5cf6' },
  payment: { icon: DollarSign, color: '#10b981' },
  message: { icon: MessageSquare, color: '#06b6d4' },
  review: { icon: Star, color: '#f59e0b' },
  milestone: { icon: Target, color: '#ef4444' },
  profile: { icon: User, color: '#6366f1' },
  project: { icon: FolderOpen, color: '#ec4899' },
  badge: { icon: Trophy, color: '#f97316' },
};

const FILTER_ITEMS = [
  { type: 'all', label: 'All', icon: Activity },
  { type: 'proposal', label: 'Proposals', icon: Send },
  { type: 'contract', label: 'Contracts', icon: FileText },
  { type: 'payment', label: 'Payments', icon: DollarSign },
  { type: 'message', label: 'Messages', icon: MessageSquare },
  { type: 'review', label: 'Reviews', icon: Star },
  { type: 'milestone', label: 'Milestones', icon: Target },
  { type: 'project', label: 'Projects', icon: FolderOpen },
];

const TIME_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

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

const isWithinTimePeriod = (dateString: string, period: string): boolean => {
  if (period === 'all') return true;
  const date = new Date(dateString);
  const now = new Date();
  if (period === 'today') return date.toDateString() === now.toDateString();
  if (period === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }
  if (period === 'month') {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  }
  return true;
};

export default function ActivityPage() {
  const { resolvedTheme } = useTheme();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [timePeriod, setTimePeriod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadActivities();
  }, [activeFilter]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
      const _api: any = activityFeedApi;
      const response = await _api.list(params);
      const items = response?.items || [];
      if (append) {
        setActivities(prev => [...prev, ...items]);
        setPage(prev => prev + 1);
      } else {
        setActivities(items);
        setPage(1);
      }
      setHasMore(items.length === 20);
    } catch {
      setActivities(prev => append ? prev : []);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const _api: any = activityFeedApi;
      await _api.markAsRead(id);
      setActivities(prev =>
        prev.map(a => (a.id === id ? { ...a, read: true } : a))
      );
    } catch {
      setToast({ message: 'Failed to mark as read', type: 'error' });
    }
  };

  const markAllAsRead = async () => {
    try {
      const _api: any = activityFeedApi;
      await _api.markAllAsRead();
      setActivities(prev => prev.map(a => ({ ...a, read: true })));
      setToast({ message: 'All marked as read', type: 'success' });
    } catch {
      setToast({ message: 'Failed to mark all as read', type: 'error' });
    }
  };

  // Apply filters - useMemo must be before conditional return
  const filtered = useMemo(() => {
    let result = activities;
    if (activeFilter !== 'all') {
      result = result.filter(a => a.type === activeFilter);
    }
    if (timePeriod !== 'all') {
      result = result.filter(a => isWithinTimePeriod(a.created_at, timePeriod));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activities, activeFilter, timePeriod, searchQuery]);

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const unreadCount = activities.filter(a => !a.read).length;
  const todayCount = activities.filter(a => {
    const d = new Date(a.created_at);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const groupedActivities = groupByDate(filtered);

  const renderActivityIcon = (type: string) => {
    const config = ACTIVITY_ICONS[type] || { icon: Pin, color: '#64748b' };
    const Icon = config.icon;
    return (
      <div className={cn(commonStyles.activityIcon, themeStyles.activityIcon)} style={{ color: config.color }}>
        <Icon size={20} />
      </div>
    );
  };

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerTop}>
              <div>
                <h1 className={cn(commonStyles.title, themeStyles.title)}>
                  <Activity size={28} className={commonStyles.titleIcon} />
                  Activity Feed
                </h1>
                <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                  Track all your recent actions and updates
                </p>
              </div>
              <div className={commonStyles.headerActions}>
                {unreadCount > 0 && (
                  <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                    <CheckCircle size={16} />
                    Mark all read ({unreadCount})
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => loadActivities()}
                  className={cn(commonStyles.refreshBtn, themeStyles.refreshBtn)}
                  aria-label="Refresh activities"
                >
                  <RefreshCw size={18} className={loading ? commonStyles.spinning : ''} />
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className={cn(commonStyles.statsBar, themeStyles.statsBar)}>
              <div className={commonStyles.statItem}>
                <div className={cn(commonStyles.statIcon, themeStyles.statIconTotal)}>
                  <Zap size={18} />
                </div>
                <div>
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{activities.length}</span>
                  <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total</span>
                </div>
              </div>
              <div className={commonStyles.statItem}>
                <div className={cn(commonStyles.statIcon, themeStyles.statIconUnread)}>
                  <Bell size={18} />
                </div>
                <div>
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{unreadCount}</span>
                  <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Unread</span>
                </div>
              </div>
              <div className={commonStyles.statItem}>
                <div className={cn(commonStyles.statIcon, themeStyles.statIconToday)}>
                  <TrendingUp size={18} />
                </div>
                <div>
                  <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{todayCount}</span>
                  <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Today</span>
                </div>
              </div>
            </div>

            {/* Search + Time Filter */}
            <div className={commonStyles.searchRow}>
              <div className={cn(commonStyles.searchBox, themeStyles.searchBox)}>
                <Search size={18} className={commonStyles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className={commonStyles.searchClear} aria-label="Clear search">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className={cn(commonStyles.timePeriod, themeStyles.timePeriod)}>
                {TIME_FILTERS.map(tf => (
                  <button
                    type="button"
                    key={tf.value}
                    onClick={() => setTimePeriod(tf.value)}
                    className={cn(
                      commonStyles.timeBtn,
                      themeStyles.timeBtn,
                      timePeriod === tf.value && commonStyles.timeBtnActive,
                      timePeriod === tf.value && themeStyles.timeBtnActive,
                    )}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filters */}
            <div className={cn(commonStyles.filters, themeStyles.filters)}>
              {FILTER_ITEMS.map(filter => {
                const Icon = filter.icon;
                return (
                  <button
                    type="button"
                    key={filter.type}
                    onClick={() => setActiveFilter(filter.type)}
                    className={cn(
                      commonStyles.filterButton,
                      themeStyles.filterButton,
                      activeFilter === filter.type && commonStyles.filterActive,
                      activeFilter === filter.type && themeStyles.filterActive
                    )}
                  >
                    <Icon size={16} />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Content */}
        {loading && activities.length === 0 ? (
          <div className={cn(commonStyles.loading, themeStyles.loading)}>
            <RefreshCw size={24} className={commonStyles.spinning} />
            <span>Loading activity...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            <BellOff size={48} />
            <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>
              {searchQuery || activeFilter !== 'all' || timePeriod !== 'all'
                ? 'No Matching Activity'
                : 'No Activity Yet'}
            </h3>
            <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
              {searchQuery || activeFilter !== 'all' || timePeriod !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Your recent actions and updates will appear here'}
            </p>
          </div>
        ) : (
          <div className={commonStyles.timeline}>
            {Array.from(groupedActivities.entries()).map(([dateGroup, items]) => (
              <div key={dateGroup} className={commonStyles.dateGroup}>
                <div className={cn(commonStyles.dateHeader, themeStyles.dateHeader)}>
                  <Calendar size={14} />
                  <span>{dateGroup}</span>
                  <span className={cn(commonStyles.dateCount, themeStyles.dateCount)}>
                    {items.length} {items.length === 1 ? 'activity' : 'activities'}
                  </span>
                </div>
                <StaggerContainer className={commonStyles.activities}>
                  {items.map((activity, idx) => {
                    const isExpanded = expandedId === activity.id;
                    return (
                      <StaggerItem key={activity.id}>
                        <div
                          className={cn(
                            commonStyles.activityCard,
                            themeStyles.activityCard,
                            !activity.read && commonStyles.unread,
                            !activity.read && themeStyles.unread,
                            isExpanded && commonStyles.expanded,
                          )}
                        >
                          {/* Timeline connector */}
                          {idx < items.length - 1 && (
                            <div className={cn(commonStyles.connector, themeStyles.connector)} />
                          )}
                          {renderActivityIcon(activity.type)}
                          <div className={commonStyles.activityContent}>
                            <div className={commonStyles.activityTop}>
                              <span className={cn(commonStyles.typeBadge, themeStyles.typeBadge)}
                                style={{ borderColor: ACTIVITY_ICONS[activity.type]?.color || '#64748b' }}
                              >
                                {activity.type}
                              </span>
                              <div className={commonStyles.activityTopRight}>
                                <span className={cn(commonStyles.activityTime, themeStyles.activityTime)}>
                                  <Clock size={12} />
                                  {getRelativeTime(activity.created_at)}
                                </span>
                                {!activity.read && (
                                  <span className={cn(commonStyles.unreadDot, themeStyles.unreadDot)} />
                                )}
                              </div>
                            </div>
                            <h4 className={cn(commonStyles.activityTitle, themeStyles.activityTitle)}>
                              {activity.title}
                            </h4>
                            <p className={cn(commonStyles.activityDesc, themeStyles.activityDesc)}>
                              {activity.description}
                            </p>

                            {/* Expandable metadata */}
                            {isExpanded && activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className={cn(commonStyles.metadata, themeStyles.metadata)}>
                                {Object.entries(activity.metadata).map(([key, val]) => (
                                  <div key={key} className={commonStyles.metaItem}>
                                    <span className={cn(commonStyles.metaKey, themeStyles.metaKey)}>{key}</span>
                                    <span className={cn(commonStyles.metaValue, themeStyles.metaValue)}>{String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action row */}
                            <div className={commonStyles.activityActions}>
                              {activity.related_type && (
                                <button type="button" className={cn(commonStyles.viewLink, themeStyles.viewLink)}>
                                  <Eye size={14} />
                                  View {activity.related_type}
                                </button>
                              )}
                              {(activity.metadata && Object.keys(activity.metadata).length > 0) && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                                  className={cn(commonStyles.expandBtn, themeStyles.expandBtn)}
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  {isExpanded ? 'Less' : 'Details'}
                                </button>
                              )}
                              {!activity.read && (
                                <button
                                  type="button"
                                  onClick={() => markAsRead(activity.id)}
                                  className={cn(commonStyles.markReadBtn, themeStyles.markReadBtn)}
                                >
                                  <CheckCircle size={14} />
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </div>
            ))}

            {hasMore && (
              <div className={commonStyles.loadMoreContainer}>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => loadActivities(true)}
                  isLoading={loading}
                >
                  {loading ? 'Loading...' : 'Load More Activities'}
                </Button>
                <span className={cn(commonStyles.showingCount, themeStyles.showingCount)}>
                  Showing {filtered.length} activities
                </span>
              </div>
            )}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(
            commonStyles.toast,
            themeStyles.toast,
            toast.type === 'error' && commonStyles.toastError,
            toast.type === 'error' && themeStyles.toastError,
          )}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
