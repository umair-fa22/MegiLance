// @AI-HINT: Full-featured Notifications center with real-time updates, filtering, mark-as-read, and delete.
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import Button from '@/app/components/Button/Button';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, ExternalLink,
  DollarSign, Briefcase, MessageSquare, AlertTriangle, FileText,
  Clock, Shield, Send,
} from 'lucide-react';
import commonStyles from './Notifications.common.module.css';
import lightStyles from './Notifications.light.module.css';
import darkStyles from './Notifications.dark.module.css';

type FilterType = 'all' | 'unread' | 'system' | 'payment' | 'project' | 'message' | 'proposal' | 'alert';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'system', label: 'System' },
  { key: 'payment', label: 'Payments' },
  { key: 'project', label: 'Projects' },
  { key: 'message', label: 'Messages' },
  { key: 'proposal', label: 'Proposals' },
  { key: 'alert', label: 'Alerts' },
];

const ICON_MAP: Record<string, { icon: React.ReactNode; className: string }> = {
  system:   { icon: <Bell size={20} />,            className: 'iconSystem' },
  payment:  { icon: <DollarSign size={20} />,      className: 'iconPayment' },
  project:  { icon: <Briefcase size={20} />,       className: 'iconProject' },
  message:  { icon: <MessageSquare size={20} />,   className: 'iconMessage' },
  alert:    { icon: <AlertTriangle size={20} />,    className: 'iconAlert' },
  proposal: { icon: <Send size={20} />,            className: 'iconProposal' },
  contract: { icon: <FileText size={20} />,        className: 'iconProject' },
  security: { icon: <Shield size={20} />,          className: 'iconAlert' },
};

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Notifications() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const themed = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const {
    notifications, loading, hasMore,
    markAsRead, markAllAsRead, deleteNotification, loadMore,
  } = useNotifications({ autoFetch: true, pageSize: 20 });

  const [filter, setFilter] = useState<FilterType>('all');
  const [deleting, setDeleting] = useState<number | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.is_read);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const handleDelete = useCallback(async (id: number) => {
    setDeleting(id);
    try {
      await deleteNotification(id);
    } finally {
      setDeleting(null);
    }
  }, [deleteNotification]);

  const handleClick = useCallback((notif: Notification) => {
    if (!notif.is_read) markAsRead(notif.id);
    if (notif.action_url) router.push(notif.action_url);
  }, [markAsRead, router]);

  if (!resolvedTheme) return null;

  // Skeleton loading
  if (loading && notifications.length === 0) {
    return (
      <div className={cn(commonStyles.container, themed.container)}>
        <div className={commonStyles.header}>
          <div className={commonStyles.headerInfo}>
            <h1 className={themed.title}>Notifications</h1>
          </div>
        </div>
        <div className={commonStyles.skeleton} role="status" aria-label="Loading notifications">
          <span className={commonStyles.srOnly}>Loading notifications...</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn(commonStyles.skeletonItem, themed.skeletonItem)}>
              <div className={cn(commonStyles.skeletonIcon, themed.skeletonIcon)} />
              <div className={commonStyles.skeletonContent}>
                <div className={cn(commonStyles.skeletonLine, themed.skeletonLine)} />
                <div className={cn(commonStyles.skeletonLine, themed.skeletonLine)} />
                <div className={cn(commonStyles.skeletonLine, themed.skeletonLine)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themed.container)}>
      {/* Header */}
      <div className={commonStyles.header}>
        <div className={commonStyles.headerInfo}>
          <h1 className={themed.title}>Notifications</h1>
          <p className={themed.subtitle}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You\u2019re all caught up'}
          </p>
        </div>
        <div className={commonStyles.headerActions}>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              aria-label="Mark all notifications as read"
            >
              <CheckCheck size={16} />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <nav className={commonStyles.filterBar} role="tablist" aria-label="Notification filters">
        {FILTERS.map(f => {
          const isActive = filter === f.key;
          const count = f.key === 'all'
            ? notifications.length
            : f.key === 'unread'
              ? unreadCount
              : notifications.filter(n => n.type === f.key).length;

          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(f.key)}
              className={cn(
                commonStyles.filterBtn,
                themed.filterBtn,
                isActive && themed.filterBtnActive,
              )}
            >
              {f.label}
              {count > 0 && (
                <span className={cn(commonStyles.filterCount, themed.filterCount)}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className={cn(commonStyles.emptyState, themed.emptyState)} role="status">
          <div className={cn(commonStyles.emptyIcon, themed.emptyIcon)}>
            <BellOff size={36} />
          </div>
          <h3 className={themed.emptyTitle}>
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </h3>
          <p className={themed.emptyText}>
            {filter === 'all'
              ? 'When you receive notifications, they\u2019ll appear here.'
              : 'Try selecting a different filter to see more.'}
          </p>
        </div>
      ) : (
        <>
          <div className={commonStyles.list} role="list" aria-label="Notifications">
            {filtered.map(notif => {
              const iconData = ICON_MAP[notif.type] || ICON_MAP.system;
              const isDeleting = deleting === notif.id;

              return (
                <article
                  key={notif.id}
                  role="listitem"
                  className={cn(
                    commonStyles.notifItem,
                    themed.notifItem,
                    !notif.is_read && commonStyles.unread,
                    !notif.is_read && themed.unread,
                  )}
                  onClick={() => handleClick(notif)}
                  onKeyDown={e => { if (e.key === 'Enter') handleClick(notif); }}
                  tabIndex={0}
                  aria-label={`${notif.is_read ? '' : 'Unread: '}${notif.title} — ${notif.message}`}
                >
                  {/* Icon */}
                  <div className={cn(commonStyles.iconWrap, themed[iconData.className])}>
                    {iconData.icon}
                  </div>

                  {/* Content */}
                  <div className={commonStyles.content}>
                    <h3 className={cn(commonStyles.notifTitle, themed.notifTitle)}>
                      {notif.title}
                    </h3>
                    <p className={cn(commonStyles.notifMessage, themed.notifMessage)}>
                      {notif.message}
                    </p>
                    <div className={commonStyles.notifMeta}>
                      <span className={cn(commonStyles.notifTime, themed.notifTime)}>
                        <Clock size={12} />
                        {getRelativeTime(notif.created_at)}
                      </span>
                      <span className={cn(commonStyles.notifTypeBadge, themed.notifTypeBadge)}>
                        {notif.type}
                      </span>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && <span className={commonStyles.unreadDot} aria-hidden="true" />}

                  {/* Actions */}
                  <div className={commonStyles.actions}>
                    {!notif.is_read && (
                      <button
                        className={cn(commonStyles.actionBtn, themed.actionBtn)}
                        onClick={e => { e.stopPropagation(); markAsRead(notif.id); }}
                        aria-label={`Mark "${notif.title}" as read`}
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    {notif.action_url && (
                      <button
                        className={cn(commonStyles.actionBtn, themed.actionBtn)}
                        onClick={e => { e.stopPropagation(); router.push(notif.action_url!); }}
                        aria-label={`Open "${notif.title}"`}
                        title="View details"
                      >
                        <ExternalLink size={16} />
                      </button>
                    )}
                    <button
                      className={cn(commonStyles.actionBtn, themed.actionBtn)}
                      onClick={e => { e.stopPropagation(); handleDelete(notif.id); }}
                      aria-label={`Delete "${notif.title}"`}
                      title="Delete notification"
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className={commonStyles.loadMore}>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                isLoading={loading}
              >
                Load more notifications
              </Button>
            </div>
          )}

          {/* Pagination info */}
          <p className={cn(commonStyles.paginationInfo, themed.paginationInfo)} aria-live="polite">
            Showing {filtered.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );
}
