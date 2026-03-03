// @AI-HINT: Dedicated Features showcase page with categorized feature grid, interactive UI
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Features from './Features';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Platform Features - AI Matching, Payments, Collaboration | MegiLance',
    description: 'Explore MegiLance features: AI-powered matching, blockchain payments, real-time collaboration, skill assessments, and more.',
    path: '/features',
    keywords: [
      'freelance platform features', 'AI matching', 'secure payments',
      'escrow', 'collaboration tools', 'freelancer tools', 'MegiLance features',
    ],
  });
}

export default function FeaturesPage() {
  return (
    <>
      <script {...jsonLdScriptProps(buildBreadcrumbJsonLd([{ name: 'Features', path: '/features' }]))} />
      <Features />
    </>
  );
}
