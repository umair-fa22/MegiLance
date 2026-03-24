// @AI-HINT: Portal landing page - redirects users to their appropriate dashboard based on role
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { getAuthToken } from '@/lib/api';
import commonStyles from './Portal.common.module.css';
import lightStyles from './Portal.light.module.css';
import darkStyles from './Portal.dark.module.css';

export default function PortalPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Redirect to appropriate dashboard based on user role
    const redirectToDashboard = async () => {
      try {
        const area = window.localStorage.getItem('portal_area');
        const token = getAuthToken();
        
        if (!token) {
          // No token - redirect to login
          router.replace('/login?redirect=/portal');
          return;
        }

        // Fetch user to get their role
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          // Token invalid - redirect to login
          window.localStorage.removeItem('access_token');
          window.localStorage.removeItem('refresh_token');
          window.localStorage.removeItem('user');
          router.replace('/login?redirect=/portal');
          return;
        }

        const user = await res.json();
        const role = (user.user_type || user.role || 'client').toLowerCase();

        // Redirect based on role
        if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (role === 'freelancer') {
          router.replace('/freelancer/dashboard');
        } else {
          router.replace('/client/dashboard');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Portal redirect error:', error);
        }
        router.replace('/login');
      }
      setChecking(false);
    };
    
    redirectToDashboard();
  }, [router]);

  // Show loading while redirecting
  if (checking) {
    const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
    return (
      <div className={cn(commonStyles.loadingWrapper, themeStyles.loadingWrapper)}>
        <div className={cn(commonStyles.loadingSpinner, themeStyles.loadingSpinner)} />
        <p className={cn(commonStyles.loadingText, themeStyles.loadingText)}>Redirecting to your dashboard...</p>
      </div>
    );
  }

  return null;
}
