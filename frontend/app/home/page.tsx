// @AI-HINT: Dedicated /Home route (optional) reusing Home component for deep linking.
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

// Dynamically import the Home component
const Home = dynamic(() => import('./Home'), {
  loading: () => <Skeleton className="w-full h-96" />
});

export const metadata: Metadata = {
  title: 'Home – MegiLance Platform',
  description: 'Overview of MegiLance features: AI talent matching, secure USDC payments, and blockchain escrow.'
};

export default function HomeIndexPage() { return <Home />; }
