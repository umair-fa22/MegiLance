// @AI-HINT: Root refunds page - redirects to refund creation
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
import Loading from '@/app/components/Loading/Loading';

export default function RefundsRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace('/login?returnTo=/refunds');
      return;
    }

    const portalArea = localStorage.getItem('portal_area') || 'client';
    if (portalArea === 'admin') {
      router.replace('/admin/refunds');
    } else {
      router.replace('/refunds/create');
    }
  }, [router]);

  return <Loading text="Loading refunds..." />;
}
