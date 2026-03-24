import type { Metadata } from 'next';
import SupportClient from './SupportClient';
import { buildMeta, buildBreadcrumbJsonLd, buildContactPageJsonLd, jsonLdScriptProps } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Support Center - Help, Guides & Documentation',
    description: 'Get help with your MegiLance account. Browse comprehensive guides, FAQs, tutorials, and documentation. Contact our support team for project disputes, payment issues, and account management.',
    path: '/support',
    keywords: [
      'MegiLance support', 'freelance help center', 'MegiLance help', 'freelance guides',
      'freelance platform support', 'payment help freelance', 'dispute resolution freelance',
    ],
  });
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(buildContactPageJsonLd())} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Support', path: '/support' }])
      )} />
      <SupportClient />
    </>
  );
}
