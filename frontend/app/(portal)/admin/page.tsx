// @AI-HINT: Admin root page - redirects to admin dashboard
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/app/components/Loading/Loading';

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return <Loading text="Loading admin panel..." />;
}
