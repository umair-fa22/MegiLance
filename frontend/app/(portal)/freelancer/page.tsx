// @AI-HINT: Freelancer root page - redirects to freelancer dashboard
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/app/components/Loading/Loading';

export default function FreelancerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/freelancer/dashboard');
  }, [router]);

  return <Loading text="Loading dashboard..." />;
}
