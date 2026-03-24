// @AI-HINT: Next.js route for Press, delegates to Press component.
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import Press from './Press';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Press & Media',
    description: 'MegiLance in the news. Press releases, media coverage, and brand assets for journalists and reporters.',
    path: '/press',
    keywords: ['MegiLance press', 'media coverage', 'freelance news', 'press releases'],
  });
}

export default function PressPage() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Press', path: '/press' }])
      )} />
      <Press />
    </>
  );
}
