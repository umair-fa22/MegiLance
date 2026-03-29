// @AI-HINT: Knowledge base, legal docs, file versions, video calls, notes/tags, activity feed, uploads, external projects, user feedback API
import { apiFetch } from './core';
import type { ResourceId } from './core';

export const knowledgeBaseApi = {
  getCategories: () => apiFetch('/knowledge-base/categories'),
  getArticles: (categoryId?: ResourceId, search?: string) => {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId.toString());
    if (search) params.append('search', search);
    return apiFetch(`/knowledge-base/articles?${params}`);
  },
  getArticle: (articleId: ResourceId) => apiFetch(`/knowledge-base/articles/${articleId}`),
  searchArticles: (query: string) =>
    apiFetch(`/knowledge-base/search?q=${encodeURIComponent(query)}`),
  getPopular: () => apiFetch('/knowledge-base/popular'),
  rateArticle: (articleId: ResourceId, helpful: boolean) =>
    apiFetch(`/knowledge-base/articles/${articleId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    }),
};

export const legalDocsApi = {
  getDocuments: () => apiFetch('/legal-documents/'),
  getDocument: (docType: string) => apiFetch(`/legal-documents/${docType}`),
  getVersion: (docType: string, version: string) =>
    apiFetch(`/legal-documents/${docType}/versions/${version}`),
  acceptDocument: (docType: string) =>
    apiFetch(`/legal-documents/${docType}/accept`, { method: 'POST' }),
  getAcceptanceHistory: () => apiFetch('/legal-documents/acceptance-history'),
};

// NOTE: fileVersionsApi was removed as dead code - never used in the app

export const videoCallsApi = {
  createRoom: (data: { participant_ids: string[]; scheduled_at?: string }) =>
    apiFetch('/video-calls/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRoom: (roomId: ResourceId) => apiFetch(`/video-calls/rooms/${roomId}`),
  joinRoom: (roomId: ResourceId) => apiFetch(`/video-calls/rooms/${roomId}/join`, { method: 'POST' }),
  leaveRoom: (roomId: ResourceId) => apiFetch(`/video-calls/rooms/${roomId}/leave`, { method: 'POST' }),
  endCall: (roomId: ResourceId) => apiFetch(`/video-calls/rooms/${roomId}/end`, { method: 'POST' }),
  getHistory: () => apiFetch('/video-calls/history'),
  getRecording: (roomId: ResourceId) => apiFetch(`/video-calls/rooms/${roomId}/recording`),
};

// NOTE: notesTagsApi was removed as dead code - never used in the app

export const activityFeedApi = {
  list: (filters?: { type?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/activity-feed/?${params}`);
  },
  get: (activityId: ResourceId) => apiFetch(`/activity-feed/${activityId}`),
  markAsRead: (activityId: ResourceId) =>
    apiFetch(`/activity-feed/${activityId}/read`, { method: 'POST' }),
  markAllAsRead: () => apiFetch('/activity-feed/read-all', { method: 'POST' }),
  getUnreadCount: () => apiFetch('/activity-feed/unread-count'),
};

export const uploadsApi = {
  upload: (type: 'avatar' | 'portfolio' | 'document', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ url: string }>(`/uploads/${type}`, {
      method: 'POST',
      body: formData,
    });
  },
};

export const externalProjectsApi = {
  list: (filters?: {
    query?: string;
    category?: string;
    source?: string;
    project_type?: string;
    experience_level?: string;
    min_budget?: number;
    tags?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '')
          params.append(key, value.toString());
      });
    }
    return apiFetch<{
      projects: Record<string, unknown>[];
      total: number;
      page: number;
      page_size: number;
      has_more: boolean;
      sources: string[];
      last_scraped: string | null;
    }>(`/external-projects?${params}`);
  },
  get: (projectId: ResourceId) =>
    apiFetch<Record<string, unknown>>(`/external-projects/${projectId}`),
  trackClick: (projectId: ResourceId) =>
    apiFetch<{ apply_url: string; tracked: boolean }>(`/external-projects/${projectId}/click`, {
      method: 'POST',
    }),
  getCategories: () =>
    apiFetch<{ categories: { name: string; count: number }[] }>('/external-projects-categories'),
  getStats: () =>
    apiFetch<{ total: number; by_source: Record<string, number>; last_scraped: string }>('/external-projects-stats'),
  triggerScrape: () =>
    apiFetch<{ message: string; scraped: number }>('/external-projects/scrape', { method: 'POST' }),
  flag: (projectId: ResourceId, reason: string) =>
    apiFetch(`/external-projects/${projectId}/flag?reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
    }),
};

export const userFeedbackApi = {
  submit: (data: { type: string; message: string; page?: string; rating?: number }) =>
    apiFetch('/user-feedback/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: (filters?: { type?: string; status?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/user-feedback/?${params}`);
  },
  get: (feedbackId: ResourceId) => apiFetch(`/user-feedback/${feedbackId}`),
  update: (feedbackId: ResourceId, data: { status?: string; admin_response?: string }) =>
    apiFetch(`/user-feedback/${feedbackId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
