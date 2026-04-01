// @AI-HINT: Referral, career development, availability calendar, rate cards, proposal templates, gamification, time entries API
import { apiFetch } from './core';
import type { ResourceId } from './core';
import type {
  WeeklyPatternSlot, AvailabilityBlockUpdate,
  AvailabilityBookingUpdate, ProposalTemplateMilestone,
} from '@/types/api';

export const referralApi = {
  getMyCode: () => apiFetch('/referral-program/my-code'),
  generateCode: () => apiFetch('/referral-program/generate-code', { method: 'POST' }),
  validateCode: (code: string) => apiFetch(`/referral-program/validate/${code}`),
  applyCode: (code: string) => apiFetch(`/referral-program/apply/${code}`, { method: 'POST' }),
  getMyReferrals: (status?: string, page = 1, pageSize = 50) => {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (status) params.append('status', status);
    return apiFetch(`/referral-program/my-referrals?${params}`);
  },
  getStats: () => apiFetch('/referral-program/stats'),
  getRewards: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return apiFetch(`/referral-program/rewards${params}`);
  },
  withdrawRewards: (amount: number) =>
    apiFetch(`/referral-program/withdraw-rewards`, { method: 'POST', body: JSON.stringify({ amount }) }),
  getLeaderboard: (period = 'monthly', limit = 10) =>
    apiFetch(`/referral-program/leaderboard?period=${period}&limit=${limit}`),
  getCampaigns: () => apiFetch('/referral-program/campaigns'),
  sendInvite: (email: string, message?: string) =>
    apiFetch('/referral-program/invite/email', {
      method: 'POST',
      body: JSON.stringify({ email, message }),
    }),
  sendBulkInvites: (emails: string[]) =>
    apiFetch('/referral-program/invite/bulk', {
      method: 'POST',
      body: JSON.stringify({ emails }),
    }),
  getShareLinks: () => apiFetch('/referral-program/share-links'),
  getMilestones: () => apiFetch('/referral-program/milestones'),
};

export const careerApi = {
  getPaths: (category?: string) => {
    const params = category ? `?category=${category}` : '';
    return apiFetch(`/career/paths${params}`);
  },
  getPath: (pathId: ResourceId) => apiFetch(`/career/paths/${pathId}`),
  getMyProgress: () => apiFetch('/career/my-progress'),
  createGoal: (data: { title: string; target_skill: string; target_level: string; deadline?: string }) =>
    apiFetch('/career/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getGoals: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return apiFetch(`/career/goals${params}`);
  },
  updateGoal: (goalId: ResourceId, data: { progress?: number; status?: string }) =>
    apiFetch(`/career/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteGoal: (goalId: ResourceId) => apiFetch(`/career/goals/${goalId}`, { method: 'DELETE' }),
  findMentors: (skill?: string, minExperience = 0) => {
    const params = new URLSearchParams({ min_experience: minExperience.toString() });
    if (skill) params.append('skill', skill);
    return apiFetch(`/career/mentors?${params}`);
  },
  requestMentorship: (mentorId: ResourceId, message: string, goals: string[]) =>
    apiFetch('/career/mentorship/request', {
      method: 'POST',
      body: JSON.stringify({ mentor_id: mentorId, message, goals }),
    }),
  getMentorshipRequests: () => apiFetch('/career/mentorship/requests'),
  respondToMentorship: (requestId: ResourceId, action: 'accept' | 'reject') =>
    apiFetch(`/career/mentorship/requests/${requestId}?action=${action}`, { method: 'PUT' }),
  getRecommendations: () => apiFetch('/career/recommendations'),
  analyzeSkillGaps: (targetRole: string) =>
    apiFetch(`/career/skill-gap-analysis?target_role=${encodeURIComponent(targetRole)}`),
  startAssessment: (skill: string) =>
    apiFetch('/career/skill-assessment', {
      method: 'POST',
      body: JSON.stringify({ skill }),
    }),
  getCertifications: () => apiFetch('/career/certifications'),
};

export const availabilityApi = {
  getSchedule: (startDate: string, endDate: string) =>
    apiFetch(`/availability/schedule?start_date=${startDate}&end_date=${endDate}`),
  getWeeklyPattern: () => apiFetch('/availability/weekly-pattern'),
  updateWeeklyPattern: (pattern: WeeklyPatternSlot[]) =>
    apiFetch('/availability/weekly-pattern', {
      method: 'PUT',
      body: JSON.stringify(pattern),
    }),
  createBlock: (data: {
    start_datetime: string;
    end_datetime: string;
    status: string;
    title?: string;
    is_recurring?: boolean;
  }) =>
    apiFetch('/availability/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBlocks: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiFetch(`/availability/blocks?${params}`);
  },
  updateBlock: (blockId: ResourceId, data: AvailabilityBlockUpdate) =>
    apiFetch(`/availability/blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBlock: (blockId: ResourceId) => apiFetch(`/availability/blocks/${blockId}`, { method: 'DELETE' }),
  getUserAvailableSlots: (userId: ResourceId, date: string, durationMinutes = 60) =>
    apiFetch(`/availability/user/${userId}/available-slots?date=${date}&duration_minutes=${durationMinutes}`),
  createBooking: (data: {
    freelancer_id: string;
    start_datetime: string;
    end_datetime: string;
    title: string;
  }) =>
    apiFetch('/availability/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBookings: (status?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return apiFetch(`/availability/bookings?${params}`);
  },
  updateBooking: (bookingId: ResourceId, data: AvailabilityBookingUpdate) =>
    apiFetch(`/availability/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancelBooking: (bookingId: ResourceId) =>
    apiFetch(`/availability/bookings/${bookingId}`, { method: 'DELETE' }),
  getSettings: () => apiFetch('/availability/settings'),
  updateSettings: (settings: Record<string, unknown>) =>
    apiFetch('/availability/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getSyncStatus: () => apiFetch('/availability/sync-status'),
  syncCalendar: (provider: 'google' | 'outlook' | 'apple') =>
    apiFetch(`/availability/sync/${provider}`, { method: 'POST' }),
};

export const rateCardsApi = {
  getMyCards: () => apiFetch('/rate-cards/my-cards'),
  create: (data: {
    name: string;
    rate_type: string;
    base_rate: number;
    currency?: string;
    description?: string;
  }) =>
    apiFetch('/rate-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (rateCardId: ResourceId) => apiFetch(`/rate-cards/${rateCardId}`),
  update: (rateCardId: ResourceId, data: Partial<{ name: string; rate_type: string; base_rate: number; currency: string; description: string }>) =>
    apiFetch(`/rate-cards/${rateCardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (rateCardId: ResourceId) => apiFetch(`/rate-cards/${rateCardId}`, { method: 'DELETE' }),
  getPackages: (rateCardId: ResourceId) => apiFetch(`/rate-cards/${rateCardId}/packages`),
  createPackage: (rateCardId: ResourceId, data: {
    name: string;
    description: string;
    price: number;
    deliverables: string[];
    estimated_duration: string;
    revisions?: number;
  }) =>
    apiFetch(`/rate-cards/${rateCardId}/packages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePackage: (packageId: ResourceId, data: Partial<{ name: string; description: string; price: number; deliverables: string[]; estimated_duration: string; revisions: number }>) =>
    apiFetch(`/rate-cards/packages/${packageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePackage: (packageId: ResourceId) =>
    apiFetch(`/rate-cards/packages/${packageId}`, { method: 'DELETE' }),
  getModifiers: (rateCardId: ResourceId) => apiFetch(`/rate-cards/${rateCardId}/modifiers`),
  createModifier: (rateCardId: ResourceId, data: { name: string; type: string; value: number; description?: string }) =>
    apiFetch(`/rate-cards/${rateCardId}/modifiers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUserRateCards: (userId: ResourceId) => apiFetch(`/rate-cards/user/${userId}`),
  calculate: (data: { rate_card_id: string; hours?: number; package_id?: string; modifiers?: string[] }) =>
    apiFetch('/rate-cards/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const proposalTemplatesApi = {
  getMyTemplates: (tag?: string, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (tag) params.append('tag', tag);
    return apiFetch(`/proposal-templates?${params}`);
  },
  create: (data: {
    name: string;
    cover_letter: string;
    description?: string;
    milestones_template?: ProposalTemplateMilestone[];
    default_rate?: number;
    tags?: string[];
  }) =>
    apiFetch('/proposal-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (templateId: ResourceId) => apiFetch(`/proposal-templates/${templateId}`),
  update: (templateId: ResourceId, data: Partial<{ name: string; cover_letter: string; description: string; milestones_template: ProposalTemplateMilestone[]; default_rate: number; tags: string[] }>) =>
    apiFetch(`/proposal-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (templateId: ResourceId) => apiFetch(`/proposal-templates/${templateId}`, { method: 'DELETE' }),
  duplicate: (templateId: ResourceId, newName?: string) =>
    apiFetch(`/proposal-templates/${templateId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ new_name: newName }),
    }),
  browsePublic: (category?: string, search?: string, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return apiFetch(`/proposal-templates/public/browse?${params}`);
  },
  usePublicTemplate: (templateId: ResourceId) =>
    apiFetch(`/proposal-templates/public/${templateId}/use`, { method: 'POST' }),
  getVariables: () => apiFetch('/proposal-templates/variables'),
  preview: (templateId: ResourceId, variables: Record<string, string>) =>
    apiFetch(`/proposal-templates/${templateId}/preview`, {
      method: 'POST',
      body: JSON.stringify(variables),
    }),
  getAnalytics: () => apiFetch('/proposal-templates/analytics'),
  generate: (templateId: ResourceId, projectId: ResourceId, variables?: Record<string, string>) =>
    apiFetch(`/proposal-templates/${templateId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, variables }),
    }),
};

export const gamificationApi = {
  getMyRank: async () => {
    try {
      return await apiFetch('/gamification/my-rank');
    } catch {
      return { rank: 'Silver', percentile: 50, points: 1250, level: 3, _isMock: true };
    }
  },
  getBadges: () => apiFetch('/gamification/badges'),
  getLeaderboard: (limit = 10) => apiFetch(`/gamification/leaderboard?limit=${limit}`),
  getAchievements: () => apiFetch('/gamification/achievements'),
};

export const timeEntriesApi = {
  list: (contractId?: number, page = 1, pageSize = 50) => {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
    if (contractId) params.append('contract_id', contractId.toString());
    return apiFetch(`/time-entries?${params}`);
  },

  create: (data: {
    contract_id: number;
    description: string;
    hours: number;
    date: string;
  }) =>
    apiFetch('/time-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: ResourceId, data: {
    description?: string;
    hours?: number;
    date?: string;
  }) =>
    apiFetch(`/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: ResourceId) =>
    apiFetch(`/time-entries/${id}`, { method: 'DELETE' }),

  getSummary: (contractId: number) =>
    apiFetch(`/time-entries/summary?contract_id=${contractId}`),

  start: (contractId: number, description: string, billable = true, hourlyRate?: number) =>
    apiFetch('/time-entries/start', {
      method: 'POST',
      body: JSON.stringify({ contract_id: contractId, description, billable, hourly_rate: hourlyRate }),
    }),

  stop: (id: ResourceId) =>
    apiFetch(`/time-entries/${id}/stop`, { method: 'POST' }),

  approve: (id: ResourceId) =>
    apiFetch(`/time-entries/${id}/approve`, { method: 'POST' }),

  reject: (id: ResourceId, reason: string) =>
    apiFetch(`/time-entries/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
