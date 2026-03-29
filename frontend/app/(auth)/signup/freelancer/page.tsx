// @AI-HINT: Redirect page for /signup/freelancer to /signup with freelancer role pre-selected
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/app/components/atoms/Loader/Loader';
import styles from '../../AuthShared.module.css';

export default function SignupFreelancerPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      window.localStorage.setItem('signup_role', 'freelancer');
    } catch (e) {
      // localStorage not available
    }
    router.replace('/signup?role=freelancer');
  }, [router]);

  return (
    <div className={styles.centered}>
      <Loader size="md" />
    </div>
  );
}
