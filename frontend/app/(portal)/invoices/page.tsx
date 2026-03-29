// @AI-HINT: Root invoices page - redirects to role-specific invoices view
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
import Loading from '@/app/components/atoms/Loading/Loading';

export default function InvoicesRedirect() {
  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace('/login?returnTo=/invoices');
      return;
    }

    const portalArea = localStorage.getItem('portal_area') || 'client';
    if (portalArea === 'freelancer') {
      router.replace('/freelancer/invoices');
    } else if (portalArea === 'admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/client/invoices');
    }
  }, [router]);

  return <Loading text="Loading invoices..." />;
}
