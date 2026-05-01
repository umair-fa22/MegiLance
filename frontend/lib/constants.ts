// @AI-HINT: Shared constants used across the frontend application
// Centralizes magic strings and values to prevent hard-coding and typos

/**
 * Authentication constants
 */
export const AUTH = {
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user',
  THEME_KEY: 'megilance-theme',
  COOKIE_MAX_AGE: 30 * 60, // 30 minutes in seconds (matches access token lifetime)
  TOKEN_REFRESH_INTERVAL: 25 * 60 * 1000, // 25 minutes in ms
} as const;

/**
 * API paths
 */
export const API_PATHS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  PROJECTS: '/api/projects',
  PROPOSALS: '/api/proposals',
  CONTRACTS: '/api/contracts',
  PAYMENTS: '/api/payments',
  MESSAGES: '/api/messages',
  USERS: '/api/users',
  REVIEWS: '/api/reviews',
  NOTIFICATIONS: '/api/notifications',
  SEARCH: '/api/search',
  AI: '/api/ai',
} as const;

/**
 * Route paths (for navigation)
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Portal routes (protected)
  CLIENT_DASHBOARD: '/client/dashboard',
  FREELANCER_DASHBOARD: '/freelancer/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  MESSAGES: '/messages',
  SETTINGS: '/settings',
  
  // Public routes
  JOBS: '/jobs',
  FREELANCERS: '/freelancers',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  HOW_IT_WORKS: '/how-it-works',
  FAQ: '/faq',
  BLOG: '/blog',
  HIRE: '/hire',
  TALENT: '/talent',
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Breakpoints matching Tailwind defaults
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * Animation durations (ms)
 */
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  PAGE_TRANSITION: 400,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
} as const;

/**
 * File upload limits
 */
export const UPLOAD = {
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_PORTFOLIO_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
  ALLOWED_DOC_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] as const,
} as const;

/**
 * Toast/notification durations
 */
export const TOAST = {
  SUCCESS_DURATION: 3000,
  ERROR_DURATION: 5000,
  WARNING_DURATION: 4000,
  INFO_DURATION: 3000,
} as const;

/**
 * WebSocket configuration
 */
export const WS = {
  RECONNECT_MAX_ATTEMPTS: 15,
  RECONNECT_DELAY: 1000,
  RECONNECT_DELAY_MAX: 30000,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  EVENT_BUFFER_MAX: 50,
} as const;

/**
 * API caching configuration
 */
export const CACHE = {
  /** Default TTL for GET response cache (ms) */
  RESPONSE_TTL: 30000,
  /** Max number of cached responses */
  MAX_ENTRIES: 200,
  /** Dashboard auto-refresh interval (ms) */
  DASHBOARD_REFRESH: 60000,
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE = {
  /** Slow request warning threshold (ms) */
  SLOW_REQUEST_THRESHOLD: 3000,
  /** Request timeout (ms) */
  REQUEST_TIMEOUT: 60000,
  /** Debounce delay for search input (ms) */
  SEARCH_DEBOUNCE: 300,
  /** Throttle delay for scroll events (ms) */
  SCROLL_THROTTLE: 100,
} as const;

/**
 * Security constants
 */
export const SECURITY = {
  /** Maximum login attempts before showing CAPTCHA */
  MAX_LOGIN_ATTEMPTS: 5,
  /** Password minimum length */
  PASSWORD_MIN_LENGTH: 8,
  /** Inactivity timeout for auto-logout (ms) — 30 minutes */
  INACTIVITY_TIMEOUT: 30 * 60 * 1000,
} as const;

/**
 * Date/time format constants
 */
export const DATE_FORMAT = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  RELATIVE_THRESHOLD: 7 * 24 * 60 * 60 * 1000, // Show relative time within 7 days
} as const;
