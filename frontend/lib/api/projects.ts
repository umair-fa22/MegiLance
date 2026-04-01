// @AI-HINT: Projects, proposals, milestones, contracts API
import { apiFetch } from './core';
import type { ResourceId } from './core';
import type {
  ContractCreateData, MilestoneCreateData, MilestoneUpdateData,
} from '@/types/api';

export const projectsApi = {
  list: (filters?: { status?: string; category?: string; page?: number; page_size?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/projects?${params}`);
  },

  create: (data: { title: string; description: string; category: string; budget_type?: string; budget_min?: number; budget_max?: number; experience_level?: string; estimated_duration?: string; skills?: string[]; status?: string }) =>
    apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (projectId: ResourceId) =>
    apiFetch(`/projects/${projectId}`),

  getMyProjects: () =>
    apiFetch('/projects/my-projects'),

  update: (projectId: ResourceId, data: Partial<{ title: string; description: string; category: string; budget_type: string; budget_min: number; budget_max: number; experience_level: string; estimated_duration: string; skills: string[]; status: string }>) =>
    apiFetch(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (projectId: ResourceId) =>
    apiFetch(`/projects/${projectId}`, { method: 'DELETE' }),
};

export const contractsApi = {
  list: (filters?: { status?: string; page?: number; page_size?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/contracts?${params}`);
  },

  create: (data: ContractCreateData) =>
    apiFetch('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (contractId: ResourceId) =>
    apiFetch(`/contracts/${contractId}`),

  update: (contractId: ResourceId, data: Partial<ContractCreateData>) =>
    apiFetch(`/contracts/${contractId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  accept: (contractId: ResourceId) =>
    apiFetch(`/contracts/${contractId}`, { 
      method: 'PUT', 
      body: JSON.stringify({ status: 'active' }) 
    }),

  complete: (contractId: ResourceId) =>
    apiFetch(`/contracts/${contractId}`, { 
      method: 'PUT', 
      body: JSON.stringify({ status: 'completed' }) 
    }),

  createDirect: (data: {
    freelancer_id: number;
    title: string;
    description: string;
    rate_type: string;
    rate: number;
    start_date?: string;
  }) =>
    apiFetch('/contracts/direct', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const proposalsApi = {
  list: (filters?: { project_id?: number; page?: number; page_size?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return apiFetch(`/proposals?${params}`);
  },

  getDrafts: (projectId?: ResourceId) => {
    const params = projectId ? `?project_id=${projectId}` : '';
    return apiFetch(`/proposals/drafts${params}`);
  },

  getByProject: (projectId: ResourceId) =>
    apiFetch(`/proposals/project/${projectId}`),

  create: (data: {
    project_id: number;
    cover_letter: string;
    bid_amount?: number;
    estimated_hours?: number;
    hourly_rate?: number;
    availability?: string;
    attachments?: string;
  }) =>
    apiFetch('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveDraft: (data: {
    project_id: number;
    cover_letter?: string;
    bid_amount?: number;
    estimated_hours?: number;
    hourly_rate?: number;
    availability?: string;
  }) =>
    apiFetch('/proposals/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitDraft: (proposalId: ResourceId) =>
    apiFetch(`/proposals/${proposalId}/submit`, { method: 'POST' }),

  get: (proposalId: ResourceId) =>
    apiFetch(`/proposals/${proposalId}`),

  update: (proposalId: ResourceId, data: Partial<{ cover_letter: string; bid_amount: number; estimated_hours: number; hourly_rate: number; availability: string }>) =>
    apiFetch(`/proposals/${proposalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  accept: (proposalId: ResourceId) =>
    apiFetch(`/proposals/${proposalId}/accept`, { method: 'POST' }),

  reject: (proposalId: ResourceId, reason?: string) =>
    apiFetch(`/proposals/${proposalId}/reject`, {
      method: 'POST',
      body: reason ? JSON.stringify({ reason }) : undefined,
    }),

  withdraw: (proposalId: ResourceId) =>
    apiFetch(`/proposals/${proposalId}/withdraw`, { method: 'POST' }),

  delete: (proposalId: ResourceId) =>
    apiFetch(`/proposals/${proposalId}`, { method: 'DELETE' }),
};

export const milestonesApi = {
  create: (data: MilestoneCreateData) =>
    apiFetch('/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  list: (projectId: ResourceId) => apiFetch(`/milestones?project_id=${projectId}`),
  
  get: (id: ResourceId) => apiFetch(`/milestones/${id}`),
  
  update: (id: ResourceId, data: MilestoneUpdateData) => 
    apiFetch(`/milestones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: (id: ResourceId) => 
    apiFetch(`/milestones/${id}`, { method: 'DELETE' }),

  submit: (id: ResourceId, data: { deliverables: string; submission_notes?: string }) =>
    apiFetch(`/milestones/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approve: (id: ResourceId, data: { approval_notes?: string }) =>
    apiFetch(`/milestones/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reject: (id: ResourceId, reason: string) =>
    apiFetch(`/milestones/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_notes: reason }),
    }),
};
