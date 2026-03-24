// @AI-HINT: This is the Next.js route file for the Login page. It delegates to the Login component and passes theme via context/props only.
'use client';

import { Suspense } from 'react';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import Login from './Login';

const LoginPage = () => {
  return (
    <Suspense fallback={<Skeleton className="w-full h-96" />}>
      <Login />
    </Suspense>
  );
};

export default LoginPage;
