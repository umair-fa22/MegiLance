// @AI-HINT: Users, portal dashboards, verification, portfolio, skills API
import { apiFetch } from './core';
import type { ResourceId } from './core';
import type {
  OnboardingData, NotificationPreferencesData,
  PortfolioItemCreateData, SkillAssessmentSubmission,
} from '@/types/api';

export const usersApi = {
  completeOnboarding: (data: OnboardingData & Record<string, unknown>) =>
    apiFetch('/users/onboarding-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  search: (query: string, type: string) =>
    apiFetch(`/users/search?q=${query}&type=${type}`),

  getClients: () =>
    apiFetch('/users/clients'),

  getNotificationPreferences: () =>
    apiFetch('/users/me/notification-preferences'),

  updateNotificationPreferences: (data: NotificationPreferencesData) =>
    apiFetch('/users/me/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  get: (userId: ResourceId) =>
    apiFetch(`/users/${userId}`),

  completeProfile: (data: Record<string, unknown>) =>
    apiFetch('/users/me/complete-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getProfileCompleteness: () =>
    apiFetch('/users/me/profile-completeness'),
};

export const portalApi = {
  client: {
    getDashboardStats: () => apiFetch('/portal/client/dashboard/stats'),
    getProjects: (filters?: { status?: string; page?: number; page_size?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/portal/client/projects?${params}`);
    },
    getProposals: (filters?: { status?: string; page?: number; page_size?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/portal/client/proposals?${params}`);
    },
    getPayments: (page = 1, pageSize = 50) => 
      apiFetch(`/portal/client/payments?page=${page}&page_size=${pageSize}`),
    getMonthlySpending: (months = 6) => apiFetch<{spending: {name: string; spending: number}[]}>(`/portal/client/spending/monthly?months=${months}`),
    getWallet: () => apiFetch('/portal/client/wallet'),
  },
  freelancer: {
    getDashboardStats: () => apiFetch('/portal/freelancer/dashboard/stats'),
    getJobs: (filters?: { category?: string; page?: number; page_size?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/portal/freelancer/jobs?${params}`);
    },
    getProjects: (filters?: { status?: string; page?: number; page_size?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/portal/freelancer/projects?${params}`);
    },
    getProposals: (filters?: { status?: string; page?: number; page_size?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, value.toString());
        });
      }
      return apiFetch(`/proposals/?${params}`);
    },
    submitProposal: (data: {
      project_id: number;
      cover_letter: string;
      bid_amount: number;
      delivery_time: number;
    }) => {
      return apiFetch(`/portal/freelancer/proposals`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getPortfolio: () => apiFetch('/portal/freelancer/portfolio'),
    getSkills: () => apiFetch('/portal/freelancer/skills'),
    getEarnings: () => apiFetch('/portal/freelancer/earnings'),
    getMonthlyEarnings: (months = 6) => apiFetch<{earnings: {month: string; amount: number}[]}>(`/portal/freelancer/earnings/monthly?months=${months}`),
    getWallet: () => apiFetch('/portal/freelancer/wallet'),
    getPayments: (page = 1, pageSize = 50) => 
      apiFetch(`/portal/freelancer/payments?page=${page}&page_size=${pageSize}`),
    withdraw: (amount: number) => 
      apiFetch(`/portal/freelancer/withdraw`, { method: 'POST', body: JSON.stringify({ amount }) }),
  }
};

export const verificationApi = {
  getStatus: () => apiFetch('/verification/status'),
  getDocuments: (type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('document_type', type);
    if (status) params.append('status', status);
    return apiFetch(`/verification/documents?${params}`);
  },
  uploadDocument: (data: FormData) => 
    apiFetch('/verification/upload-document', {
      method: 'POST',
      body: data,
    }),
  uploadSelfie: (data: FormData) => 
    apiFetch('/verification/upload-selfie', {
      method: 'POST',
      body: data,
    }),
  getTiers: () => apiFetch('/verification/tiers'),
  getSupportedDocuments: () => apiFetch('/verification/supported-documents'),
  sendPhoneCode: (phoneNumber: string) => 
    apiFetch('/verification/phone/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    }),
  verifyPhoneCode: (phoneNumber: string, code: string) => 
    apiFetch('/verification/phone/verify', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, verification_code: code }),
    }),
};

export const portfolioApi = {
  createItem: (data: PortfolioItemCreateData | FormData) =>
    apiFetch('/portfolio/items', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  list: (userId?: ResourceId) =>
    apiFetch(`/portfolio${userId ? `?user_id=${userId}` : ''}`),

  get: (id: ResourceId) => apiFetch(`/portfolio/${id}`),

  update: (id: ResourceId, data: Partial<PortfolioItemCreateData>) =>
    apiFetch(`/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: ResourceId) =>
    apiFetch(`/portfolio/${id}`, { method: 'DELETE' }),
};

export const portfolioShowcaseApi = {
  getShowcase: (userId: ResourceId) => apiFetch(`/portfolio-showcase/user/${userId}`),
  updateLayout: (layout: Record<string, unknown>) =>
    apiFetch('/portfolio-showcase/layout', {
      method: 'PUT',
      body: JSON.stringify(layout),
    }),
  getTemplates: () => apiFetch('/portfolio-showcase/templates'),
  applyTemplate: (templateId: ResourceId) =>
    apiFetch(`/portfolio-showcase/templates/${templateId}/apply`, { method: 'POST' }),
  getAnalytics: () => apiFetch('/portfolio-showcase/analytics'),
  togglePublic: (isPublic: boolean) =>
    apiFetch('/portfolio-showcase/visibility', {
      method: 'PUT',
      body: JSON.stringify({ is_public: isPublic }),
    }),
};

export const skillsApi = {
  getQuestions: (skillId: ResourceId, level: string) => apiFetch(`/skills/${skillId}/questions?level=${level}`),
  submitAssessment: (data: SkillAssessmentSubmission) => apiFetch('/skills/assessments', { method: 'POST', body: JSON.stringify(data) }),
};

// NOTE: skillTaxonomyApi was removed as dead code - never used in the app

export const publicProfileApi = {
  getById: (userId: ResourceId) =>
    apiFetch(`/freelancers/id/${userId}`),

  getBySlug: (slug: string) =>
    apiFetch(`/freelancers/slug/${slug}`),

  getFeatured: (params?: {
    limit?: number; skills?: string; location?: string;
    min_rate?: number; max_rate?: number;
    experience_level?: string; availability?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) qs.append(k, v.toString());
      });
    }
    const q = qs.toString();
    return apiFetch(`/freelancers/featured${q ? `?${q}` : ''}`);
  },

  getStats: (userId: ResourceId) =>
    apiFetch(`/freelancers/${userId}/stats`),

  getPortfolio: (userId: ResourceId) =>
    apiFetch(`/freelancers/${userId}/portfolio`),

  getReviews: (userId: ResourceId, page = 1, pageSize = 10) =>
    apiFetch(`/freelancers/${userId}/reviews?page=${page}&page_size=${pageSize}`),
};
