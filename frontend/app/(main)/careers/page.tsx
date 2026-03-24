// @AI-HINT: Next.js route for Careers with BreadcrumbList for Google Rich Results.
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Careers from './Careers';

export function generateMetadata() {
  return buildMeta({
    title: 'Careers at MegiLance',
    description: 'Join the MegiLance team and help build the future of freelancing. Browse open positions in engineering, design, marketing, and more.',
    path: '/careers',
    keywords: ['MegiLance careers', 'tech jobs', 'startup jobs', 'remote careers'],
  });
}

export default function CareersPage() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Careers', path: '/careers' }])
      )} />
      <Careers />
    </>
  );
}
