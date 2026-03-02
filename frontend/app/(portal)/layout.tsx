// @AI-HINT: This is the layout for all authenticated user portals. It uses the AppLayout component to provide a consistent shell with a sidebar and navbar.
// CRITICAL: This layout requires authentication - unauthenticated users are redirected to login.

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '../components/AppLayout/AppLayout';
import { getAuthToken, clearAuthData, authApi } from '@/lib/api';
import { UnreadCountProvider } from '@/contexts/UnreadCountContext';
import Loading from '../components/Loading/Loading';

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const lastVerified = React.useRef<number>(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        
        if (!token) {
          const currentPath = pathname || '/client/dashboard';
          setIsAuthenticated(false);
          router.replace(`/login?returnTo=${encodeURIComponent(currentPath)}`);
          return;
        }

        // Skip re-validation if verified within the last 5 minutes
        const now = Date.now();
        if (isAuthenticated && lastVerified.current && now - lastVerified.current < 5 * 60 * 1000) {
          return;
        }

        // Validate token with backend
        const user = await authApi.me();
        const role = (user.user_type || user.role || 'client').toLowerCase();
        setUserRole(role);
        window.localStorage.setItem('user', JSON.stringify(user));
        window.localStorage.setItem('portal_area', role);

        // Check role-based access for specific portal sections
        if (pathname?.startsWith('/admin') && role !== 'admin') {
          router.replace('/client/dashboard');
          return;
        }

        lastVerified.current = now;
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        clearAuthData();
        router.replace('/login');
      }
    };

    checkAuth();
  }, [pathname, router, isAuthenticated]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return <Loading size="lg" text="Verifying authentication..." fullscreen />;
  }

  // Don't render if not authenticated (redirecting)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <UnreadCountProvider>
      <AppLayout>
        {children}
      </AppLayout>
    </UnreadCountProvider>
  );
}
