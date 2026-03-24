// @AI-HINT: Community page route for the (main) layout.
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Community from './Community';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Community',
    description: 'Join the MegiLance community. Connect with freelancers, share knowledge, participate in events, and grow your professional network.',
    path: '/community',
    keywords: ['freelancer community', 'networking', 'remote workers', 'professional community'],
  });
}

export default function CommunityPage() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Community', path: '/community' }])
      )} />
      <Community />
    </>
  );
} 
