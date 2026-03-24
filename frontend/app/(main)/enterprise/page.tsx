// @AI-HINT: Public Enterprise page. Investor-grade marketing placeholder; server component.
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Enterprise from './Enterprise';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Enterprise Freelance Marketplace - Hire Developers & Designers at Scale',
    description: 'MegiLance Enterprise: hire freelance web developers, designers, and experts at scale. Dedicated account managers, SSO, compliance-ready freelancer management. The best Upwork alternative for enterprise.',
    path: '/enterprise',
    keywords: [
      'enterprise freelancing', 'hire freelancers enterprise', 'upwork alternative enterprise',
      'hire web developer enterprise', 'managed freelance teams', 'corporate freelance marketplace',
    ],
  });
}

export default function EnterprisePage() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Enterprise', path: '/enterprise' }])
      )} />
      <Enterprise />
    </>
  );
}
