// @AI-HINT: Custom hook for managing authentication state and user profile
// Handles login/logout, token refresh, and user data fetching
// Security best practices: Secure cookie storage, proper token lifecycle, cleanup on unmount
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import api, {
  setAuthToken,
  clearAuthData,
  getAuthToken,
  APIError,
} from "@/lib/api";

export interface User {
  id: number;
  email: string;
  name: string;
  user_type: "client" | "freelancer" | "admin";
  role: string;
  bio?: string;
  skills?: string;
  hourly_rate?: number;
  profile_image_url?: string;
  avatar_url?: string; // Alternative avatar field from some API responses
  location?: string;
  title?: string;
  is_verified?: boolean;
  joined_at?: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface UserApiResponse {
  id: number | string;
  email: string;
  name?: string;
  full_name?: string;
  user_type?: string;
  role?: string;
  bio?: string;
  skills?: string;
  hourly_rate?: number;
  profile_image_url?: string;
  avatar_url?: string;
  location?: string;
  title?: string;
  is_verified?: boolean;
  joined_at?: string;
}

/**
 * Normalize user data from various API response shapes
 */
function normalizeUser(userData: UserApiResponse): User {
  if (!userData || !userData.email || !userData.id) {
    throw new Error("Invalid user data received from API");
  }
  return {
    id: Number(userData.id),
    email: userData.email,
    name: userData.name || userData.full_name || "",
    user_type: (
      userData.user_type ||
      userData.role ||
      "client"
    ).toLowerCase() as User["user_type"],
    role: userData.role || userData.user_type || "client",
    bio: userData.bio,
    skills: userData.skills,
    hourly_rate: userData.hourly_rate,
    profile_image_url: userData.profile_image_url || userData.avatar_url,
    location: userData.location,
    title: userData.title,
    is_verified: userData.is_verified,
    joined_at: userData.joined_at,
  };
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);

  // Token refresh interval ref
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // AbortController for cancelling in-flight requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  const isAuthenticated = useMemo(() => !!user, [user]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Multi-tab session sync: use a dedicated localStorage broadcast key
  // (StorageEvent only fires for localStorage changes, not sessionStorage)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_logout_broadcast") {
        if (e.newValue === "true") {
          // Logout triggered in another tab
          if (isMounted.current) {
            setUser(null);
            setError(null);
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Load user on mount. Browser sessions rely on backend httpOnly cookies.
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Verify session and get fresh user data. This works with either
        // an in-memory bearer token or the backend-managed httpOnly cookie.
        const userData = await api.auth.me();
        const normalized = normalizeUser(userData);

        if (isMounted.current) {
          setUser(normalized);
          setError(null);
        }

        // Set up token refresh interval on page reload (refresh every 25 minutes)
        if (refreshIntervalRef.current)
          clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = setInterval(
          async () => {
            try {
              const refreshed = await api.auth.refreshToken();
              if (refreshed?.access_token) {
                setAuthToken(refreshed.access_token);
              }
            } catch {
              // Reactive refresh on 401 will handle this
            }
          },
          25 * 60 * 1000,
        );
      } catch (err) {
        console.error("Failed to load user:", err);
        if (err instanceof APIError && err.status === 401) {
          // Token expired, clear all auth data
          clearAuthData();
          if (isMounted.current) setUser(null);
        }
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : "Failed to load user");
        }
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (isMounted.current) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const response = await api.auth.login(email, password);

        // Check if 2FA is required
        if ("requires_2fa" in response && response.requires_2fa) {
          throw new Error("2FA_REQUIRED");
        }

        const normalized = normalizeUser(response.user);

        if (isMounted.current) setUser(normalized);
        setAuthToken(response.access_token);

        // Set up token refresh interval (refresh every 25 minutes, token expires in 30)
        if (refreshIntervalRef.current)
          clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = setInterval(
          async () => {
            try {
              const refreshed = await api.auth.refreshToken();
              if (refreshed?.access_token) {
                setAuthToken(refreshed.access_token);
              }
            } catch {
              // Reactive refresh on 401 will handle this
            }
          },
          25 * 60 * 1000,
        );

        // Redirect based on role, respecting returnTo query param
        const searchParams = new URLSearchParams(window.location.search);
        const returnTo = searchParams.get("returnTo");

        // Only allow safe returnTo paths (prevent open redirect)
        const safeReturnTo =
          returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : null;

        const clientDefault = (() => {
          if (normalized.user_type !== "client") return null;
          try {
            return localStorage.getItem("onboarding_complete") === "true"
              ? "/client/dashboard"
              : "/onboarding/client";
          } catch {
            return "/client/dashboard";
          }
        })();

        const redirectPath =
          safeReturnTo ||
          (normalized.user_type === "admin"
            ? "/admin/dashboard"
            : normalized.user_type === "freelancer"
              ? "/freelancer/dashboard"
              : (clientDefault ?? "/client/dashboard"));

        router.push(redirectPath);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        if (isMounted.current) setError(message);
        throw err;
      } finally {
        if (isMounted.current) setIsLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    // Notify backend about the logout (fire-and-forget)
    try {
      api.auth.logout().catch(() => {});
    } catch {
      /* best effort */
    }

    clearAuthData();
    // Broadcast logout to other tabs via localStorage (StorageEvent mechanism)
    localStorage.setItem("auth_logout_broadcast", "true");
    localStorage.removeItem("auth_logout_broadcast");
    if (isMounted.current) setUser(null);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.auth.me();
      const normalized = normalizeUser(userData);

      if (isMounted.current) setUser(normalized);
    } catch (err) {
      console.error("Failed to refresh user:", err);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<User>) => {
      try {
        await api.auth.updateProfile(data);
        await refreshUser();
      } catch (err) {
        console.error("Failed to update profile:", err);
        throw err;
      }
    },
    [refreshUser],
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    updateProfile,
  };
}

/**
 * Lightweight check: is there a non-expired auth token present?
 * Useful in server components or quick gating without full hook.
 */
export function hasValidAuthToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getAuthToken());
}

export default useAuth;
