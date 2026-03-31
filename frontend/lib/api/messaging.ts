// @AI-HINT: Messaging, notifications, communication, realtime presence API
import { apiFetch } from './core';
import type { ResourceId } from './core';
import type { ConversationCreateData } from '@/types/api';

export const messagesApi = {
  createConversation: (data: ConversationCreateData | FormData) =>
    apiFetch('/conversations', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  getConversations: (filters?: { status?: string; archived?: boolean; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/conversations?${params}`);
  },

  getConversation: (conversationId: ResourceId) =>
    apiFetch(`/conversations/${conversationId}`),

  updateConversation: (conversationId: ResourceId, data: { status?: string; is_archived?: boolean }) =>
    apiFetch(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  sendMessage: (data: { conversation_id?: number; receiver_id?: number; project_id?: number; content: string; message_type?: string }) =>
    apiFetch('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMessages: (conversationId: ResourceId, page = 1, pageSize = 50) =>
    apiFetch(`/messages?conversation_id=${conversationId}&page=${page}&page_size=${pageSize}`),

  getMessage: (messageId: ResourceId) =>
    apiFetch(`/messages/${messageId}`),

  updateMessage: (messageId: ResourceId, data: { content?: string; is_read?: boolean }) =>
    apiFetch(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteMessage: (messageId: ResourceId) =>
    apiFetch(`/messages/${messageId}`, { method: 'DELETE' }),

  getUnreadCount: () =>
    apiFetch('/messages/unread/count'),
};

export const notificationsApi = {
  list: (page = 1, pageSize = 20) =>
    apiFetch(`/notifications?page=${page}&page_size=${pageSize}`),

  markAsRead: (notificationId: ResourceId) =>
    apiFetch(`/notifications/${notificationId}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ is_read: true }) 
    }),

  markAllAsRead: () =>
    apiFetch('/notifications/mark-all-read', { method: 'POST' }),

  delete: (notificationId: ResourceId) =>
    apiFetch(`/notifications/${notificationId}`, { method: 'DELETE' }),
};

export const communicationApi = {
  sendSMS: (phoneNumber: string, message: string) =>
    apiFetch('/communication/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, message }),
    }),
  sendEmail: (to: string, subject: string, body: string, template?: string) =>
    apiFetch('/communication/email/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body, template }),
    }),
  sendPush: (userId: ResourceId, title: string, body: string, data?: Record<string, unknown>) =>
    apiFetch('/communication/push/send', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, title, body, data }),
    }),
  getHistory: (channel?: string, page = 1, pageSize = 50) => {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (channel) params.append('channel', channel);
    return apiFetch(`/communication/history?${params}`);
  },
  getPreferences: () => apiFetch('/communication/preferences'),
  updatePreferences: (preferences: Record<string, unknown>) =>
    apiFetch('/communication/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),
};

export const realtimeApi = {
  getOnlineUsers: () =>
    apiFetch<{ online_users: number[]; count: number }>('/realtime/online-users'),

  isUserOnline: (userId: ResourceId) =>
    apiFetch<{ user_id: number; online: boolean }>(`/realtime/user-status/${userId}`),

  getNotificationCount: () =>
    apiFetch<{ unread_count: number }>('/notifications/unread/count'),
};
