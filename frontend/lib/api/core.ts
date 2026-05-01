// @AI-HINT: Core API client — fetch wrapper, auth tokens, error class, retry logic, caching

/** Unified resource ID type — use for all API method parameters that accept IDs */
export type ResourceId = string | number;

// In production on DO App Platform: /api routes directly to backend
// In local dev: /api is proxied via next.config.js rewrites
const API_BASE_URL = '/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setRefreshToken(_token: string | null) {
  // Refresh token is now stored as httpOnly cookie by the backend.
  // Kept for backward compatibility — no-op.
}

export function getRefreshToken(): string | null {
  // Refresh token is httpOnly cookie — not accessible from JS.
  return '__httponly_cookie__';
}

export function clearAuthData() {
  authToken = null;
  if (typeof window !== 'undefined') {
    try {
      // Clean up any legacy tokens
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('portal_area');
      // Drop JS-accessible auth cookies
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

const REQUEST_TIMEOUT = 60000;

// Retry with exponential backoff + jitter
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableMethods: Set<string>;
  retryableStatuses: Set<number>;
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 500,
  maxDelay: 10000,
  retryableMethods: new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']),
  retryableStatuses: new Set([408, 429, 500, 502, 503, 504]),
};

function getRetryDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = exponentialDelay * 0.2 * Math.random();
  return Math.min(exponentialDelay + jitter, maxDelay);
}

function shouldRetry(method: string, status: number, attempt: number): boolean {
  if (attempt >= RETRY_CONFIG.maxRetries) return false;
  if (!RETRY_CONFIG.retryableMethods.has(method.toUpperCase())) return false;
  return RETRY_CONFIG.retryableStatuses.has(status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// === GET Response Cache with TTL ===
interface CacheEntry {
  data: unknown;
  timestamp: number;
  etag?: string;
}
const _responseCache = new Map<string, CacheEntry>();
const _CACHE_TTL = 30_000; // 30 seconds default cache TTL
const _CACHE_MAX_SIZE = 200;

function getCacheKey(endpoint: string): string {
  return `GET:${endpoint}`;
}

function getCachedResponse<T>(endpoint: string): T | null {
  const key = getCacheKey(endpoint);
  const entry = _responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > _CACHE_TTL) {
    _responseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCachedResponse(endpoint: string, data: unknown): void {
  const key = getCacheKey(endpoint);
  // Evict oldest entries if cache is full
  if (_responseCache.size >= _CACHE_MAX_SIZE) {
    const firstKey = _responseCache.keys().next().value;
    if (firstKey) _responseCache.delete(firstKey);
  }
  _responseCache.set(key, { data, timestamp: Date.now() });
}

/** Invalidate cached GET responses matching a prefix (e.g., after a mutation) */
export function invalidateCache(endpointPrefix?: string): void {
  if (!endpointPrefix) {
    _responseCache.clear();
    return;
  }
  const prefix = getCacheKey(endpointPrefix);
  for (const key of _responseCache.keys()) {
    if (key.startsWith(prefix)) {
      _responseCache.delete(key);
    }
  }
}

// === Connection quality detection ===
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Request deduplication for identical concurrent GET requests
const inflightRequests = new Map<string, Promise<unknown>>();

function getDedupeKey(endpoint: string, method: string): string | null {
  if (method.toUpperCase() !== 'GET') return null;
  return `GET:${endpoint}`;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function onTokenRefreshFailed() {
  refreshSubscribers.forEach(cb => cb(''));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  if (refreshSubscribers.length < 100) {
    refreshSubscribers.push(callback);
  }
}

async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    });

    if (!response.ok) {
      clearAuthData();
      return null;
    }

    const data = await response.json();
    const newToken = data.access_token;
    if (newToken) {
      setAuthToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    clearAuthData();
    return null;
  }
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  /** Set to true to skip the GET response cache for this request */
  skipCache = false
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const token = getAuthToken();
  const isPublicAuthEndpoint =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/register') ||
    endpoint.includes('/auth/refresh');
  const shouldUseResponseCache = method === 'GET' && !skipCache && !token && isPublicAuthEndpoint;

  // Offline check
  if (!isOnline()) {
    throw new APIError('You appear to be offline. Please check your connection.', 0, 'OFFLINE');
  }

  // Check GET cache before making request
  if (shouldUseResponseCache) {
    const cached = getCachedResponse<T>(endpoint);
    if (cached !== null) return cached;
  }

  // Invalidate related cache on mutations
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    // Invalidate cache for the resource being mutated
    const resourceBase = endpoint.split('?')[0].split('/').slice(0, 3).join('/');
    invalidateCache(resourceBase);
  }

  const dedupeKey = getDedupeKey(endpoint, method);
  if (dedupeKey) {
    const inflight = inflightRequests.get(dedupeKey);
    if (inflight) return inflight as Promise<T>;
  }

  const doFetch = async (): Promise<T> => {
    let lastError: APIError | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1, RETRY_CONFIG.baseDelay, RETRY_CONFIG.maxDelay);
        await sleep(delay);
      }

      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
      };

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: headers as HeadersInit,
          signal: controller.signal,
          credentials: 'include',
        });

        clearTimeout(timeoutId);

        // Rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          lastError = new APIError(
            `Too many requests. Please try again in ${waitSeconds} seconds.`,
            429,
            'RATE_LIMITED',
            { retryAfter: waitSeconds }
          );
          if (attempt < RETRY_CONFIG.maxRetries) {
            await sleep(waitSeconds * 1000);
            continue;
          }
          throw lastError;
        }

        // 401 — attempt token refresh
        if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
          if (!isRefreshing) {
            isRefreshing = true;
            const newToken = await attemptTokenRefresh();
            isRefreshing = false;

            if (newToken) {
              onTokenRefreshed(newToken);
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: headers as HeadersInit,
                credentials: 'include',
              });

              if (!retryResponse.ok) {
                const error = await retryResponse.json().catch(() => ({ detail: 'Request failed after token refresh' }));
                throw new APIError(error.detail || `HTTP ${retryResponse.status}`, retryResponse.status, error.error_type, error);
              }
              if (retryResponse.status === 204) return undefined as T;
              return retryResponse.json();
            } else {
              onTokenRefreshFailed();
              if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}&expired=true`;
              }
              throw new APIError('Session expired. Please log in again.', 401);
            }
          } else {
            return new Promise<T>((resolve, reject) => {
              addRefreshSubscriber((newToken: string) => {
                headers['Authorization'] = `Bearer ${newToken}`;
                fetch(`${API_BASE_URL}${endpoint}`, {
                  ...options,
                  headers: headers as HeadersInit,
                  credentials: 'include',
                })
                  .then(res => {
                    if (res.status === 204) return undefined as T;
                    if (!res.ok) throw new APIError('Request failed', res.status);
                    return res.json();
                  })
                  .then(resolve)
                  .catch(reject);
              });
            });
          }
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
          lastError = new APIError(
            error.detail || `HTTP ${response.status}`,
            response.status,
            error.error_type,
            error
          );
          if (shouldRetry(method, response.status, attempt)) {
            continue;
          }
          throw lastError;
        }

        if (response.status === 204) return undefined as T;
        const data = await response.json();

        // Cache successful GET responses
        if (shouldUseResponseCache) {
          setCachedResponse(endpoint, data);
        }

        return data;

      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof APIError) {
          lastError = error;
          if (shouldRetry(method, error.status, attempt)) {
            continue;
          }
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new APIError('Request timeout', 408);
          if (shouldRetry(method, 408, attempt)) {
            continue;
          }
          throw lastError;
        }

        lastError = new APIError(
          error instanceof Error ? error.message : 'Network error',
          0
        );
        if (shouldRetry(method, 0, attempt)) {
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new APIError('Request failed after retries', 0);
  };

  if (dedupeKey) {
    const promise = doFetch().finally(() => {
      inflightRequests.delete(dedupeKey);
    });
    inflightRequests.set(dedupeKey, promise);
    return promise;
  }

  return doFetch();
}
