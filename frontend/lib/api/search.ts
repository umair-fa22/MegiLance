// @AI-HINT: Search, categories, tags, favorites, saved searches, search analytics API
import { apiFetch } from './core';
import type { ResourceId } from './core';
import type { SavedSearchData } from '@/types/api';

export const searchApi = {
  projects: (query: string, filters?: {
    budget_min?: number;
    budget_max?: number;
    category?: string;
    skills?: string[];
    page?: number;
    page_size?: number;
  }) => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      const { page = 1, page_size = 20, ...rest } = filters;
      params.append('limit', page_size.toString());
      params.append('offset', ((page - 1) * page_size).toString());

      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    return apiFetch(`/search/projects?${params}`);
  },

  freelancers: (query: string, filters?: {
    skills?: string[];
    hourly_rate_min?: number;
    hourly_rate_max?: number;
    page?: number;
    page_size?: number;
  }) => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    return apiFetch(`/search/freelancers?${params}`);
  },

  global: (query: string) =>
    apiFetch(`/search?q=${encodeURIComponent(query)}`),

  autocomplete: (query: string) =>
    apiFetch(`/search/autocomplete?q=${encodeURIComponent(query)}`),

  suggestions: (query: string) =>
    apiFetch(`/search/suggestions?q=${encodeURIComponent(query)}`),

  getTrending: (type: 'projects' | 'freelancers' = 'projects', limit = 10) =>
    apiFetch(`/search/trending?type=${type}&limit=${limit}`),
};

export const categoriesApi = {
  list: () => apiFetch(\'/categories\'),
  getTree: () => apiFetch('/categories/tree'),
  getBySlug: (slug: string) => apiFetch(`/categories/${slug}`),
  create: (data: { name: string; slug: string; description?: string }) =>
    apiFetch(\'/categories\', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: ResourceId, data: { name: string; slug: string; description?: string }) =>
    apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: ResourceId) =>
    apiFetch(`/categories/${id}`, { method: 'DELETE' }),
};

export const tagsApi = {
  list: (filters?: { type?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/tags?${params}`);
  },

  create: (data: { name: string; type: 'skill' | 'priority' | 'location' | 'budget' | 'general' }) =>
    apiFetch(\'/tags\', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (tagId: ResourceId) => apiFetch(`/tags/${tagId}`),

  update: (tagId: ResourceId, data: { name?: string; type?: string }) =>
    apiFetch(`/tags/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (tagId: ResourceId) =>
    apiFetch(`/tags/${tagId}`, { method: 'DELETE' }),

  getPopular: () =>
    apiFetch('/tags/popular'),

  getProjectTags: (projectId: ResourceId) =>
    apiFetch(`/tags/projects/${projectId}/tags`),

  addToProject: (projectId: ResourceId, tagId: ResourceId) =>
    apiFetch(`/tags/projects/${projectId}/tags/${tagId}`, { method: 'POST' }),

  removeFromProject: (projectId: ResourceId, tagId: ResourceId) =>
    apiFetch(`/tags/projects/${projectId}/tags/${tagId}`, { method: 'DELETE' }),
};

export const favoritesApi = {
  list: (targetType?: 'project' | 'freelancer' | 'client', page = 1, pageSize = 20) =>
    apiFetch(`/favorites?${new URLSearchParams({ 
      ...(targetType && { target_type: targetType }), 
      page: page.toString(), 
      page_size: pageSize.toString() 
    })}`),

  create: (targetType: 'project' | 'freelancer' | 'client', targetId: ResourceId) =>
    apiFetch(\'/favorites\', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId }),
    }),

  delete: (favoriteId: ResourceId) =>
    apiFetch(`/favorites/${favoriteId}`, { method: 'DELETE' }),

  check: (targetType: string, targetId: ResourceId) =>
    apiFetch(`/favorites/check/${targetType}/${targetId}`),
};

export const searchesApi = {
  getSaved: (category?: string, alertsOnly = false) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (alertsOnly) params.set('alerts_only', 'true');
    const qs = params.toString();
    return apiFetch(`/saved-searches${qs ? `?${qs}` : ''}`);
  },

  get: (id: ResourceId) => apiFetch(`/saved-searches/${id}`),

  save: (data: SavedSearchData) =>
    apiFetch('/saved-searches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: ResourceId, data: Partial<SavedSearchData>) =>
    apiFetch(`/saved-searches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: ResourceId) =>
    apiFetch(`/saved-searches/${id}`, { method: 'DELETE' }),

  execute: (id: ResourceId) =>
    apiFetch(`/saved-searches/${id}/execute`, { method: 'POST' }),

  toggleAlert: (id: ResourceId, enable: boolean, frequency = 'daily') =>
    apiFetch(`/saved-searches/${id}/alert`, {
      method: 'POST',
      body: JSON.stringify({ enable, frequency }),
    }),
};

export const searchAnalyticsApi = {
  getOverview: (period = '30d') => apiFetch(`/search-analytics/overview?period=${period}`),
  getTopQueries: (limit = 20) => apiFetch(`/search-analytics/top-queries?limit=${limit}`),
  getZeroResults: (limit = 20) => apiFetch(`/search-analytics/zero-results?limit=${limit}`),
  getClickThrough: (period = '30d') => apiFetch(`/search-analytics/click-through?period=${period}`),
  getTrends: (query: string, period = '30d') =>
    apiFetch(`/search-analytics/trends?query=${encodeURIComponent(query)}&period=${period}`),
};
