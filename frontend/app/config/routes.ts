// @AI-HINT: Centralized route constants for MegiLance application.
// Use these constants instead of hardcoded paths throughout the app.

/**
 * Public routes - accessible without authentication
 */
export const PUBLIC_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  HOW_IT_WORKS: '/how-it-works',
  PRICING: '/pricing',
  CONTACT: '/contact',
  BLOG: '/blog',
  FAQ: '/faq',
  EXPLORE: '/explore',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  COOKIES: '/cookies',
} as const;

/**
 * Authentication routes
 */
export const AUTH_ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  TWO_FACTOR: '/two-factor',
} as const;

/**
 * Freelancer portal routes
 */
export const FREELANCER_ROUTES = {
  DASHBOARD: '/freelancer/dashboard',
  JOBS: '/freelancer/jobs',
  SAVED_JOBS: '/freelancer/saved-jobs',
  JOB_ALERTS: '/freelancer/job-alerts',
  PROJECTS: '/freelancer/projects',
  MY_JOBS: '/freelancer/my-jobs',
  PROPOSALS: '/freelancer/proposals',
  SUBMIT_PROPOSAL: '/freelancer/submit-proposal',
  CONTRACTS: '/freelancer/contracts',
  CONTRACT_DETAIL: (id: string) => `/freelancer/contracts/${id}`,
  GIGS: '/freelancer/gigs',
  CREATE_GIG: '/freelancer/gigs/create',
  MESSAGES: '/freelancer/messages',
  NOTIFICATIONS: '/freelancer/notifications',
  VIDEO_CALLS: '/freelancer/video-calls',
  EARNINGS: '/freelancer/earnings',
  WALLET: '/freelancer/wallet',
  WITHDRAW: '/freelancer/withdraw',
  INVOICES: '/freelancer/invoices',
  PROFILE: '/freelancer/profile',
  PORTFOLIO: '/freelancer/portfolio',
  SKILLS: '/freelancer/skills',
  REVIEWS: '/freelancer/reviews',
  RANK: '/freelancer/rank',
  SETTINGS: '/freelancer/settings',
  SETTINGS_PASSWORD: '/freelancer/settings/password',
  SETTINGS_SECURITY: '/freelancer/settings/security',
  SETTINGS_NOTIFICATIONS: '/freelancer/settings/notifications',
  SECURITY: '/freelancer/security',
  TIME_ENTRIES: '/freelancer/time-entries',
  FILES: '/freelancer/files',
  ANALYTICS: '/freelancer/analytics',
  HELP: '/freelancer/help',
  SUPPORT: '/freelancer/support',
} as const;

/**
 * Client portal routes
 */
export const CLIENT_ROUTES = {
  DASHBOARD: '/client/dashboard',
  POST_JOB: '/client/post-job',
  PROJECTS: '/client/projects',
  PROJECT_DETAIL: (id: string) => `/client/projects/${id}`,
  CREATE_PROJECT: '/client/projects/create',
  CONTRACTS: '/client/contracts',
  CONTRACT_DETAIL: (id: string) => `/client/contracts/${id}`,
  ESCROW: '/client/escrow',
  MESSAGES: '/client/messages',
  NOTIFICATIONS: '/client/notifications',
  VIDEO_CALLS: '/client/video-calls',
  PAYMENTS: '/client/payments',
  WALLET: '/client/wallet',
  INVOICES: '/client/invoices',
  SEARCH: '/client/search',
  HIRE: '/client/hire',
  FREELANCERS: '/client/freelancers',
  PROFILE: '/client/profile',
  REVIEWS: '/client/reviews',
  SETTINGS: '/client/settings',
  SECURITY: '/client/security',
  ANALYTICS: '/client/analytics',
  REPORTS: '/client/reports',
  HELP: '/client/help',
} as const;

/**
 * Admin portal routes
 */
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  ANALYTICS: '/admin/analytics',
  SEARCH_ANALYTICS: '/admin/search-analytics',
  METRICS: '/admin/metrics',
  USERS: '/admin/users',
  PROJECTS: '/admin/projects',
  DISPUTES: '/admin/disputes',
  DISPUTE_DETAIL: (id: string) => `/admin/disputes/${id}`,
  MESSAGES: '/admin/messages',
  CALENDAR: '/admin/calendar',
  VIDEO_CALLS: '/admin/video-calls',
  PAYMENTS: '/admin/payments',
  PAYMENTS_INVOICES: '/admin/payments/invoices',
  PAYMENTS_REFUNDS: '/admin/payments/refunds',
  PAYMENTS_MULTICURRENCY: '/admin/payments/multicurrency',
  BILLING: '/admin/billing',
  MODERATION: '/admin/moderation',
  FRAUD_DETECTION: '/admin/fraud-detection',
  SECURITY: '/admin/security',
  AUDIT: '/admin/audit',
  COMPLIANCE: '/admin/compliance',
  HEALTH: '/admin/health',
  API_KEYS: '/admin/api-keys',
  WEBHOOKS: '/admin/webhooks',
  FEATURE_FLAGS: '/admin/feature-flags',
  EMAIL_TEMPLATES: '/admin/email-templates',
  INTEGRATIONS: '/admin/integrations',
  EXPORT: '/admin/export',
  BLOG: '/admin/blog',
  BLOG_CREATE: '/admin/blog/create',
  BLOG_EDIT: (id: string) => `/admin/blog/${id}`,
  CATEGORIES: '/admin/categories',
  SKILLS: '/admin/skills',
  TAGS: '/admin/tags',
  BRANDING: '/admin/branding',
  PROFILE: '/admin/profile',
  SETTINGS: '/admin/settings',
  REPORTS: '/admin/reports',
  FEEDBACK: '/admin/feedback',
  AI_MONITORING: '/admin/ai-monitoring',
  SUPPORT: '/admin/support',
  HELP: '/admin/help',
} as const;

/**
 * Shared portal routes (accessible by multiple user types)
 */
export const SHARED_ROUTES = {
  DASHBOARD: '/dashboard',
  SEARCH: '/search',
  MESSAGES: '/messages',
  NOTIFICATIONS: '/notifications',
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  PROPOSALS: '/proposals',
  CONTRACTS: '/contracts',
  CONTRACT_DETAIL: (id: string) => `/contracts/${id}`,
  CONTRACT_WORKROOM: (id: string) => `/contracts/${id}/workroom`,
  CONTRACT_REVIEW: (id: string) => `/contracts/${id}/review`,
  DISPUTES: '/disputes',
  DISPUTE_CREATE: '/disputes/create',
  DISPUTE_DETAIL: (id: string) => `/disputes/${id}`,
  PAYMENTS: '/payments',
  ADD_FUNDS: '/payments/add-funds',
  INVOICES: '/invoices',
  CREATE_INVOICE: '/invoices/create',
  REFUNDS: '/refunds',
  CREATE_REFUND: '/refunds/create',
  SETTINGS: '/settings',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_2FA: '/settings/security/2fa',
  SETTINGS_PAYOUT: '/settings/payout-methods',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  FAVORITES: '/favorites',
  AUDIT_LOGS: '/audit-logs',
  COMPLETE_PROFILE: '/complete-profile',
  CREATE_PROJECT: '/create-project',
  HELP: '/help',
  SUPPORT: '/support',
  SUPPORT_NEW: '/support/new',
} as const;

/**
 * API routes (for internal use)
 */
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  USERS: '/api/users',
  PROJECTS: '/api/projects',
  PROPOSALS: '/api/proposals',
  CONTRACTS: '/api/contracts',
  MESSAGES: '/api/messages',
  NOTIFICATIONS: '/api/notifications',
  PAYMENTS: '/api/payments',
  REVIEWS: '/api/reviews',
  SEARCH: '/api/search',
} as const;

/**
 * External URLs
 */
export const EXTERNAL_URLS = {
  GITHUB: 'https://github.com/ghulam-mujtaba5/MegiLance',
  TWITTER: 'https://twitter.com/megilance',
  LINKEDIN: 'https://linkedin.com/company/megilance',
  SUPPORT_EMAIL: 'mailto:support@megilance.com',
} as const;

/**
 * Helper to get dashboard route based on user role
 */
export function getDashboardRoute(role: 'freelancer' | 'client' | 'admin'): string {
  switch (role) {
    case 'freelancer':
      return FREELANCER_ROUTES.DASHBOARD;
    case 'client':
      return CLIENT_ROUTES.DASHBOARD;
    case 'admin':
      return ADMIN_ROUTES.DASHBOARD;
    default:
      return SHARED_ROUTES.DASHBOARD;
  }
}

/**
 * Helper to check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const publicPaths = Object.values(PUBLIC_ROUTES);
  const authPaths = Object.values(AUTH_ROUTES);
  return !publicPaths.includes(pathname as any) && !authPaths.includes(pathname as any);
}

/**
 * Helper to get the portal type from a pathname
 */
export function getPortalType(pathname: string): 'freelancer' | 'client' | 'admin' | 'shared' | null {
  if (pathname.startsWith('/freelancer')) return 'freelancer';
  if (pathname.startsWith('/client')) return 'client';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) return 'shared';
  return null;
}
