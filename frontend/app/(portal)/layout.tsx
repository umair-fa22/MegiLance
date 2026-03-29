// @AI-HINT: This is the layout for all authenticated user portals. It uses the AppLayout component to provide a consistent shell with a sidebar and navbar.
// CRITICAL: This layout requires authentication - unauthenticated users are redirected to login.

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppLayout from '../components/templates/AppLayout/AppLayout';
import { getAuthToken, clearAuthData } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { UnreadCountProvider } from '@/contexts/UnreadCountContext';
import Loading from '@/app/components/atoms/Loading/Loading';

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated: useAuthIsAuthed, isLoading: authLoading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // If hook is still loading and hasn't settled, don't interrupt
    if (authLoading) return;

    if (!useAuthIsAuthed || !user) {
      const currentPath = pathname || '/client/dashboard';
      setIsAuthenticated(false);
      router.replace(`/login?returnTo=${encodeURIComponent(currentPath)}`);
      return;
    }

    const role = (user.user_type || user.role || 'client').toLowerCase();
    
    // Check role-based access
    if (pathname?.startsWith('/admin') && role !== 'admin') {
      router.replace(`/${role}/dashboard`);
      return;
    }
    if (pathname?.startsWith('/client') && role !== 'client' && role !== 'admin') {
      router.replace(`/${role}/dashboard`);
      return;
    }
    if (pathname?.startsWith('/freelancer') && role !== 'freelancer' && role !== 'admin') {
      router.replace(`/${role}/dashboard`);
      return;
    }

    // Ensure session properties match
    window.localStorage.setItem('portal_area', role);
    setIsAuthenticated(true);
  }, [pathname, router, useAuthIsAuthed, authLoading, user]);

  // Show loading while checking authentication
  if (authLoading || isAuthenticated === null) {
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
