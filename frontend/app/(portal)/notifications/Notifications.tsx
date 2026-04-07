// @AI-HINT: Notifications page under portal layout. Theme-aware, accessible. Fetches from notifications API.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer } from '@/app/components/Animations/StaggerContainer';
import { celebrationAnimation } from '@/app/components/Animations/LottieAnimation';
import { useToaster } from '@/app/components/molecules/Toast/ToasterProvider';
import { Loader2 } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import common from './Notifications.common.module.css';
import light from './Notifications.light.module.css';
import dark from './Notifications.dark.module.css';

const ALL = 'All';
const CATEGORIES = [ALL, 'System', 'Messages', 'Billing'] as const;

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  category: (typeof CATEGORIES)[number] | 'All';
  time: string;
  unread?: boolean;
};

const Notifications: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { notify } = useToaster();
  const [selected, setSelected] = useState<(typeof CATEGORIES)[number]>(ALL);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  // Fetch notifications from API
  interface RawNotification {
    id?: number | string;
    title?: string;
    type?: string;
    message?: string;
    content?: string;
    body?: string;
    created_at?: string;
    is_read?: boolean;
    unread?: boolean;
  }
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await notificationsApi.list();
        
        // Transform API data to NotificationItem format — handle paginated or direct array responses
        type NotificationsResponse = RawNotification[] | { notifications?: RawNotification[]; items?: RawNotification[] };
        const typedData = data as NotificationsResponse;
        const rawItems: RawNotification[] = Array.isArray(typedData) 
          ? typedData 
          : (typedData.notifications || typedData.items || []);
        const notifications: NotificationItem[] = rawItems.map((n: RawNotification, idx: number) => {
          // Map notification type to category
          let category: NotificationItem['category'] = 'System';
          const type = (n.type || '').toLowerCase();
          if (type.includes('message') || type.includes('chat')) category = 'Messages';
          else if (type.includes('payment') || type.includes('invoice') || type.includes('billing')) category = 'Billing';
          
          // Format timestamp
          const time = n.created_at 
            ? formatTimeAgo(new Date(n.created_at))
            : 'Recently';
          
          return {
            id: String(n.id || idx),
            title: n.title || n.type || 'Notification',
            body: n.message || n.content || n.body || '',
            category,
            time,
            unread: n.is_read === false || n.unread === true,
          };
        });

        setNotifs(notifications);
        setError(null);
      } catch (err) {
        setError('Failed to load notifications');
        // Provide fallback with empty array
        setNotifs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filtered = useMemo(
    () => (selected === ALL ? notifs : notifs.filter((i) => i.category === selected)),
    [selected, notifs]
  );

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
    } catch (e) {
      // Continue with local update even if API fails
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    setStatus('All notifications marked as read');
    notify({ title: 'Marked as read', description: 'All notifications are now read.', variant: 'success', duration: 2500 });
  };

  const clearAll = async () => {
    try {
      // API doesn't have clearAll, notifications will be removed locally
      // await api.notifications.clearAll();
    } catch (e) {
      // Continue with local update
    }
    setNotifs([]);
    setStatus('All notifications cleared');
    notify({ title: 'Notifications cleared', description: 'Your list is now empty.', variant: 'info', duration: 2500 });
  };

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(parseInt(id));
    } catch (e) {
      // Continue with local update
    }
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    const n = notifs.find((x) => x.id === id);
    setStatus(n ? `${n.title} marked as read` : 'Notification marked as read');
    notify({ title: 'Marked read', description: n ? n.title : 'Notification', variant: 'success', duration: 2200 });
  };

  const archive = async (id: string) => {
    try {
      await notificationsApi.delete(parseInt(id));
    } catch (e) {
      // Continue with local update
    }
    const n = notifs.find((x) => x.id === id);
    setNotifs((prev) => prev.filter((x) => x.id !== id));
    setStatus(n ? `${n.title} archived` : 'Notification archived');
    notify({ title: 'Archived', description: n ? n.title : 'Notification archived', variant: 'info', duration: 2200 });
  };

  if (loading) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div className={common.loadingState}>
            <Loader2 className={common.spinner} size={32} />
            <span>Loading notifications...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {error && (
            <div className={cn(common.errorBanner, themed.errorBanner)}>
              {error}
            </div>
          )}
          <ScrollReveal>
            <div className={common.header}>
              <h1 className={common.title}>Notifications</h1>
              <div className={common.filters} role="toolbar" aria-label="Filter notifications">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={common.chip}
                    aria-pressed={(selected === c) || undefined}
                    onClick={() => setSelected(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className={common.actionsBar} role="toolbar" aria-label="Notification actions">
                <button type="button" className={common.button} onClick={markAllRead}>Mark all read</button>
                <button type="button" className={cn(common.button, common.buttonSecondary)} onClick={clearAll}>Clear all</button>
                <p className={common.srOnly} aria-live="polite">{status}</p>
              </div>
            </div>
          </ScrollReveal>

          {notifs.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="You're all caught up! New notifications will appear here."
              animationData={celebrationAnimation}
              animationWidth={130}
              animationHeight={130}
              action={
                <button
                  type="button"
                  className={common.button}
                  onClick={() => notify({ title: 'All caught up', description: 'Nothing to review right now.', variant: 'info', duration: 2200 })}
                >
                  Refresh
                </button>
              }
            />
          ) : (
            <StaggerContainer delay={0.1} className={common.list} role="list" aria-label="Notification list">
            {filtered.map((n) => (
              <div key={n.id} role="listitem" className={common.item}>
                <div>
                  <div className={common.itemHeader}>
                    <span className={common.dot} aria-hidden="true" />
                    <div>
                      <div className={common.itemTitle}>{n.title}</div>
                      <div className={common.meta}>{n.time} • {n.category}</div>
                    </div>
                  </div>
                  <div className={common.itemBody}>{n.body}</div>
                </div>
                <div className={common.actions} aria-label={`Actions for ${n.title}`}>
                  <button className={common.button} onClick={() => markRead(n.id)}>Mark read</button>
                  <button className={cn(common.button, common.buttonSecondary)} onClick={() => archive(n.id)}>Archive</button>
                </div>
              </div>
            ))}
            </StaggerContainer>
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default Notifications;
