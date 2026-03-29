// @AI-HINT: Redirect page for /signup/client to /signup with client role pre-selected
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loader from '@/app/components/atoms/Loader/Loader';
import styles from '../../AuthShared.module.css';

export default function SignupClientPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      window.localStorage.setItem('signup_role', 'client');
    } catch (e) {
      // localStorage not available
    }
    router.replace('/signup?role=client');
  }, [router]);

  return (
    <div className={styles.centered}>
      <Loader size="md" />
    </div>
  );
}
