// @AI-HINT: Compare index — lists all competitor comparison pages for internal linking + SEO
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, buildItemListJsonLd, jsonLdScriptProps, BASE_URL } from '@/lib/seo';
import CompareIndexClient from './CompareIndexClient';

const competitors = [
  { slug: 'upwork', name: 'Upwork', desc: 'See why businesses switch from Upwork to MegiLance for better talent, lower fees, and AI matching.' },
  { slug: 'fiverr', name: 'Fiverr', desc: 'Compare MegiLance vs Fiverr — discover better quality, custom projects, and secure payments.' },
  { slug: 'toptal', name: 'Toptal', desc: 'Get Toptal-quality freelancers without the premium pricing and restrictive process.' },
  { slug: 'freelancer-com', name: 'Freelancer.com', desc: 'MegiLance vs Freelancer.com — AI matching, escrow payments, and zero commission.' },
];

export const metadata: Metadata = buildMeta({
  title: 'MegiLance vs Competitors — Honest Comparisons | MegiLance',
  description: 'Compare MegiLance with Upwork, Fiverr, Toptal, and Freelancer.com. See why businesses choose MegiLance for lower fees, AI matching, and verified talent.',
  path: '/compare',
  keywords: ['freelance platform comparison', 'upwork alternative', 'fiverr alternative', 'best freelance platform', 'compare freelance websites'],
});

export default function ComparePage() {
  const items = competitors.map((c, i) => ({
    position: i + 1,
    name: `MegiLance vs ${c.name}`,
    url: `${BASE_URL}/compare/${c.slug}`,
  }));

  return (
    <>
      <script {...jsonLdScriptProps(buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Compare', path: '/compare' },
      ]))} />
      <script {...jsonLdScriptProps(buildItemListJsonLd(items))} />
      <CompareIndexClient competitors={competitors} />
    </>
  );
}
