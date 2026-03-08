import type { Metadata } from 'next';
import TestimonialsClient from './TestimonialsClient';
import { buildMeta, buildBreadcrumbJsonLd, buildAggregateRatingJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Success Stories & Testimonials - Real Results from Real Users',
    description: 'Read authentic success stories from MegiLance clients and freelancers. See how businesses scaled with top talent and freelancers grew their careers.',
    path: '/testimonials',
    keywords: [
      'MegiLance reviews', 'freelance platform reviews', 'MegiLance testimonials',
      'freelancer success stories', 'client reviews freelancing', 'MegiLance ratings',
      'best freelance platform reviews', 'freelance marketplace reviews',
    ],
  });
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(buildAggregateRatingJsonLd(0, 0))} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Testimonials', path: '/testimonials' }])
      )} />
      <TestimonialsClient />
    </>
  );
}
