// @AI-HINT: Hook for managing notifications with real-time WebSocket updates.
// Fetches, paginates, mark-as-read, and listens for incoming notifications.
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { notificationsApi, getAuthToken } from '@/lib/api';
import { useUnreadCounts } from '@/contexts/UnreadCountContext';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

interface UseNotificationsOptions {
  autoFetch?: boolean;
  pageSize?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoFetch = true, pageSize = 20 } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { connected, on, off } = useWebSocket();
  const { decrementNotifications, clearNotifications: clearCount, refreshCounts } = useUnreadCounts();
  const hasFetched = useRef(false);

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    try {
      const data: any = await notificationsApi.list(pageNum, pageSize);
      const items: Notification[] = (data?.notifications || data || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'system',
        title: n.title || 'Notification',
        message: n.message || n.description || '',
        is_read: n.is_read || false,
        action_url: n.action_url,
        created_at: n.created_at || new Date().toISOString(),
      }));

      if (append) {
        setNotifications(prev => [...prev, ...items]);
      } else {
        setNotifications(items);
      }
      setHasMore(items.length >= pageSize);
      setPage(pageNum);
    } catch (err) {
      console.error('[useNotifications] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      hasFetched.current = true;
      fetchNotifications(1);
    }
  }, [autoFetch, fetchNotifications]);

  // Real-time: listen for new notifications via WebSocket
  useEffect(() => {
    if (!connected) return;

    const handleNewNotification = (data: any) => {
      const notif: Notification = {
        id: data.id || Date.now(),
        type: data.type || 'system',
        title: data.title || 'New notification',
        message: data.message || data.description || '',
        is_read: false,
        action_url: data.action_url,
        created_at: data.created_at || new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev]);
    };

    on('notification', handleNewNotification);
    return () => {
      off('notification', handleNewNotification);
    };
  }, [connected, on, off]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      decrementNotifications(1);
    } catch (err) {
      console.error('[useNotifications] markAsRead error:', err);
    }
  }, [decrementNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      clearCount();
    } catch (err) {
      console.error('[useNotifications] markAllAsRead error:', err);
    }
  }, [clearCount]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  const refresh = useCallback(() => {
    fetchNotifications(1);
    refreshCounts();
  }, [fetchNotifications, refreshCounts]);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await notificationsApi.delete(notificationId);
      const removed = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (removed && !removed.is_read) {
        decrementNotifications(1);
      }
    } catch (err) {
      console.error('[useNotifications] delete error:', err);
    }
  }, [notifications, decrementNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    hasMore,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
  };
}
