// @AI-HINT: Root contracts page - redirects to role-specific contracts view
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
import Loading from '@/app/components/Loading/Loading';

export default function ContractsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace('/login?returnTo=/contracts');
      return;
    }

    const portalArea = localStorage.getItem('portal_area') || 'client';
    if (portalArea === 'freelancer') {
      router.replace('/freelancer/contracts');
    } else if (portalArea === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/client/contracts');
    }
  }, [router]);

  return <Loading text="Loading contracts..." />;
}
