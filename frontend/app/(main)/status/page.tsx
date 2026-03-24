// @AI-HINT: Status page route for the (main) layout.
import type { Metadata } from 'next';
import { buildMeta } from '@/lib/seo';
import Status from './Status';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'System Status',
    description: 'Real-time MegiLance platform status. Check uptime, API health, and service availability.',
    path: '/status',
    noindex: true,
  });
}

export default function StatusPage() {
  return <Status />;
} 
