// @AI-HINT: Root proposals redirect - redirects to role-specific proposals page
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
import Loading from '@/app/components/Loading/Loading';

export default function ProposalsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    const portalArea = localStorage.getItem('portal_area') || 'freelancer';
    
    if (!authToken) {
      router.replace('/login');
      return;
    }

    // Redirect based on role
    if (portalArea.toLowerCase() === 'client') {
      router.replace('/client/projects');
    } else if (portalArea.toLowerCase() === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/freelancer/proposals');
    }
  }, [router]);

  return <Loading text="Redirecting to proposals..." />;
}
