// @AI-HINT: Webhooks, API keys, teams, workflows, branding, email templates, integrations API
import { apiFetch } from './core';
import type { ResourceId } from './core';
import type { WorkflowAction } from '@/types/api';

export const webhooksApi = {
  list: () => apiFetch(\'/webhooks\'),
  create: (data: { url: string; events: string[]; secret?: string }) =>
    apiFetch(\'/webhooks\', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (webhookId: ResourceId) => apiFetch(`/webhooks/${webhookId}`),
  update: (webhookId: ResourceId, data: Partial<{ url: string; events: string[]; secret: string; is_active: boolean; status: string }>) =>
    apiFetch(`/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (webhookId: ResourceId) => apiFetch(`/webhooks/${webhookId}`, { method: 'DELETE' }),
  test: (webhookId: ResourceId) => apiFetch(`/webhooks/${webhookId}/test`, { method: 'POST' }),
  getLogs: (webhookId: ResourceId) => apiFetch(`/webhooks/${webhookId}/logs`),
  getEvents: () => apiFetch('/webhooks/events'),
};

export const apiKeysApi = {
  list: () => apiFetch(\'/api-keys\'),
  create: (data: { name: string; scopes: string[]; expires_at?: string }) =>
    apiFetch(\'/api-keys\', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (keyId: ResourceId) => apiFetch(`/api-keys/${keyId}`),
  revoke: (keyId: ResourceId) => apiFetch(`/api-keys/${keyId}`, { method: 'DELETE' }),
  getUsage: (keyId: ResourceId) => apiFetch(`/api-keys/${keyId}/usage`),
};

export const teamsApi = {
  list: () => apiFetch(\'/teams\'),
  create: (data: { name: string; description?: string }) =>
    apiFetch(\'/teams\', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (teamId: ResourceId) => apiFetch(`/teams/${teamId}`),
  update: (teamId: ResourceId, data: Partial<{ name: string; description: string }>) =>
    apiFetch(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (teamId: ResourceId) => apiFetch(`/teams/${teamId}`, { method: 'DELETE' }),
  getMembers: (teamId: ResourceId) => apiFetch(`/teams/${teamId}/members`),
  addMember: (teamId: ResourceId, userId: ResourceId, role = 'member') =>
    apiFetch(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    }),
  removeMember: (teamId: ResourceId, userId: ResourceId) =>
    apiFetch(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),
  updateMemberRole: (teamId: ResourceId, userId: ResourceId, role: string) =>
    apiFetch(`/teams/${teamId}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};

export const workflowApi = {
  list: () => apiFetch(\'/workflows\'),
  create: (data: { name: string; trigger: string; actions: WorkflowAction[] }) =>
    apiFetch(\'/workflows\', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  get: (workflowId: ResourceId) => apiFetch(`/workflows/${workflowId}`),
  update: (workflowId: ResourceId, data: Partial<{ name: string; trigger: string; actions: WorkflowAction[] }>) =>
    apiFetch(`/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (workflowId: ResourceId) => apiFetch(`/workflows/${workflowId}`, { method: 'DELETE' }),
  enable: (workflowId: ResourceId) => apiFetch(`/workflows/${workflowId}/enable`, { method: 'POST' }),
  disable: (workflowId: ResourceId) => apiFetch(`/workflows/${workflowId}/disable`, { method: 'POST' }),
  getLogs: (workflowId: ResourceId) => apiFetch(`/workflows/${workflowId}/logs`),
  getTriggers: () => apiFetch('/workflows/triggers'),
  getActions: () => apiFetch('/workflows/actions'),
};

export const brandingApi = {
  getConfig: (organizationId: ResourceId) => apiFetch(`/branding/config/${organizationId}`),
  createConfig: (config: {
    organization_id: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  }) =>
    apiFetch('/branding/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  updateConfig: (organizationId: ResourceId, update: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    logo_url?: string;
    custom_css?: string;
  }) =>
    apiFetch(`/branding/config/${organizationId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    }),
  uploadLogo: (organizationId: ResourceId, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/branding/config/${organizationId}/logo`, {
      method: 'POST',
      body: formData,
    });
  },
  uploadFavicon: (organizationId: ResourceId, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(`/branding/config/${organizationId}/favicon`, {
      method: 'POST',
      body: formData,
    });
  },
  getPresets: () => apiFetch('/branding/presets'),
  applyPreset: (organizationId: ResourceId, presetId: ResourceId) =>
    apiFetch(`/branding/config/${organizationId}/apply-preset?preset_id=${presetId}`, { method: 'POST' }),
  previewBranding: (organizationId: ResourceId) => apiFetch(`/branding/config/${organizationId}/preview`),
  setupCustomDomain: (organizationId: ResourceId, domain: string) =>
    apiFetch(`/branding/config/${organizationId}/custom-domain?domain=${encodeURIComponent(domain)}`, { method: 'POST' }),
  checkDomainStatus: (organizationId: ResourceId) => apiFetch(`/branding/config/${organizationId}/domain-status`),
  deleteConfig: (organizationId: ResourceId) => apiFetch(`/branding/config/${organizationId}`, { method: 'DELETE' }),
};

export const emailTemplatesApi = {
  list: (includeInactive = false) =>
    apiFetch(`/email-templates?include_inactive=${includeInactive}`),
  getTypes: () => apiFetch('/email-templates/types'),
  get: (templateId: ResourceId) => apiFetch(`/email-templates/${templateId}`),
  create: (data: { template_type: string; name: string; subject: string; html_body: string; text_body?: string; variables?: string[] }) =>
    apiFetch('/email-templates', { method: 'POST', body: JSON.stringify(data) }),
  update: (templateId: ResourceId, data: Record<string, unknown>) =>
    apiFetch(`/email-templates/${templateId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (templateId: ResourceId) =>
    apiFetch(`/email-templates/${templateId}`, { method: 'DELETE' }),
  preview: (templateId: ResourceId, sampleData?: Record<string, unknown>) =>
    apiFetch(`/email-templates/${templateId}/preview`, { method: 'POST', body: JSON.stringify({ sample_data: sampleData }) }),
  duplicate: (templateId: ResourceId) =>
    apiFetch(`/email-templates/${templateId}/duplicate`, { method: 'POST' }),
};

export const integrationsApi = {
  list: () => apiFetch(\'/integrations\'),
  get: (integrationId: ResourceId) => apiFetch(`/integrations/${integrationId}`),
  connect: (provider: string, data?: Record<string, string>) =>
    apiFetch(`/integrations/${provider}/connect`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  disconnect: (integrationId: ResourceId) =>
    apiFetch(`/integrations/${integrationId}/disconnect`, { method: 'POST' }),
  sync: (integrationId: ResourceId) =>
    apiFetch(`/integrations/${integrationId}/sync`, { method: 'POST' }),
  getSettings: (integrationId: ResourceId) =>
    apiFetch(`/integrations/${integrationId}/settings`),
  updateSettings: (integrationId: ResourceId, settings: Record<string, unknown>) =>
    apiFetch(`/integrations/${integrationId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getAvailable: () => apiFetch('/integrations/available'),
};
