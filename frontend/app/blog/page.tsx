import type { Metadata } from 'next';
import BlogClient from './BlogClient';
import { buildMeta, buildCollectionPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Freelancing Blog - Tips for Freelance Jobs Online & Remote Work',
    description: 'Expert guides on freelance jobs online, remote work tips, how to find freelance work online, virtual assistant jobs remote, and earning more as a freelancer. Insights from the MegiLance team.',
    path: '/blog',
    keywords: [
      'freelance jobs online', 'freelance work online', 'freelancing blog',
      'remote work tips', 'virtual assistant jobs remote', 'freelancer guides',
      'how to freelance', 'best freelance websites', 'upwork alternative tips',
    ],
  });
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildCollectionPageJsonLd('MegiLance Blog', 'Insights on freelancing, remote work, AI technology, and the future of work.', '/blog')
      )} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Blog', path: '/blog' }])
      )} />
      <BlogClient />
    </>
  );
}
