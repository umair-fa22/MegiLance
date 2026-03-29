// @AI-HINT: Client root page - redirects to client dashboard
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/app/components/atoms/Loading/Loading';

export default function ClientRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/client/dashboard');
  }, [router]);

  return <Loading text="Loading dashboard..." />;
}
