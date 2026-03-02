// @AI-HINT: Root disputes page - redirects to role-specific disputes view
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
import Loading from '@/app/components/Loading/Loading';

export default function DisputesRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace('/login?returnTo=/disputes');
      return;
    }

    const portalArea = localStorage.getItem('portal_area') || 'client';
    if (portalArea === 'admin') {
      router.replace('/admin/disputes');
    } else {
      router.replace('/disputes/create');
    }
  }, [router]);

  return <Loading text="Loading disputes..." />;
}
