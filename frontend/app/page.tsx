// @AI-HINT: Root homepage route — server component shell with metadata + JSON-LD.
// Home is dynamically imported so its Three.js/client bundle doesn't block initial paint.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BASE_URL, SITE_NAME, buildWebSiteJsonLd, buildHowToJsonLd, jsonLdScriptProps, getKeywordsForPage } from '@/lib/seo';

const Home = dynamic(() => import('./home/Home'), { ssr: true });

export const metadata: Metadata = {
  title: 'MegiLance - Freelancer Website | Hire Freelance Web Developers, Designers & Experts Online',
  description: 'MegiLance is the #1 AI-powered freelancer website and best Upwork alternative. Hire freelance web developers, graphic designers, content writers & virtual assistants online. Freelance jobs online with zero commission, secure escrow payments & AI matching. Better than Fiverr.',
  keywords: getKeywordsForPage(['brand', 'transactional', 'informational', 'longTail', 'technology'], [
    'freelancer website', 'freelance jobs online', 'freelance work online',
    'best freelance websites', 'hire freelancers', 'upwork alternative',
    'fiverr alternative', 'freelance website designer', 'zero commission freelancing',
    'virtual assistant jobs remote', 'best freelancing website 2026',
  ]),
  alternates: {
    canonical: BASE_URL,
    languages: { 'en-US': BASE_URL, 'x-default': BASE_URL },
  },
  openGraph: {
    title: 'MegiLance - Best Freelancer Website | Hire Top Freelancers Online',
    description: 'Join professionals on MegiLance. Find freelance jobs online or hire top freelance developers, designers & writers. AI-powered matching, escrow payments, zero commission. Best Upwork & Fiverr alternative.',
    url: BASE_URL,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@megilance',
    creator: '@megilance',
    title: 'MegiLance - Best Freelancer Website | Freelance Jobs Online',
    description: 'Hire top freelance web developers, designers & writers online. AI matching, zero commission, secure payments. The best Upwork & Fiverr alternative.',
  },
};

const howToSteps = [
  { name: 'Create Your Account', text: 'Sign up for free as a client or freelancer in under 2 minutes.' },
  { name: 'Post a Project or Browse Jobs', text: 'Describe your project requirements or browse thousands of freelance jobs.' },
  { name: 'AI Matches You', text: 'Our 7-factor AI algorithm finds the perfect match based on skills, budget, and availability.' },
  { name: 'Collaborate & Pay Securely', text: 'Work together with built-in tools. Pay securely with escrow protection and blockchain payments.' },
];

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(buildWebSiteJsonLd())} />
      <script {...jsonLdScriptProps(buildHowToJsonLd(
        'How to Hire Freelancers on MegiLance',
        'Step-by-step guide to hiring world-class freelancers using AI-powered matching on MegiLance.',
        howToSteps
      ))} />
      <Suspense>
        <Home />
      </Suspense>
    </>
  );
}
