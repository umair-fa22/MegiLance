// @AI-HINT: "Why Hire on MegiLance" SEO landing page — targets "best platform to hire freelancers",
// "why use MegiLance", and client-acquisition informational keywords.
import type { Metadata } from 'next';
import WhyHireClient from './WhyHireClient';
import {
  buildMeta,
  buildBreadcrumbJsonLd,
  buildFAQJsonLd,
  jsonLdScriptProps,
} from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Why Hire Freelancers on MegiLance - Best Freelance Platform for Businesses',
    description:
      'Discover why 50,000+ businesses choose MegiLance to hire freelancers. AI-powered matching, zero commission, secure escrow payments, 24-hour average hiring time. The best platform for hiring freelance developers, designers, and experts.',
    path: '/why-hire',
    keywords: [
      'why hire freelancers', 'best platform to hire freelancers',
      'benefits of hiring freelancers', 'freelance vs full-time',
      'outsource web development', 'hire remote developers',
      'best freelance marketplace', 'hire freelancers online',
      'freelance hiring platform', 'AI freelancer matching',
      'secure freelance payments', 'hire verified freelancers',
    ],
  });
}

const faqs = [
  { question: 'Why should I hire freelancers instead of full-time employees?', answer: 'Freelancers give you access to specialized skills on-demand without long-term commitments, office costs, or benefits overhead. You can scale your team up or down based on project needs, access global talent, and often get higher-quality work from specialists.' },
  { question: 'How is MegiLance different from other hiring platforms?', answer: 'MegiLance uses AI to match you with the most qualified freelancers in minutes (not days). We charge 0-5% platform fee (vs 5-20% on competitors), offer blockchain-secured payments, and verify all freelancers through skill assessments.' },
  { question: 'How much can I save by hiring freelancers on MegiLance?', answer: 'On average, businesses save 40-60% compared to hiring full-time employees when you factor in salary, benefits, office space, and equipment. Compared to other freelance platforms, you save an additional 15-30% due to our lower fees.' },
  { question: 'Is it safe to hire freelancers online?', answer: 'Yes, MegiLance provides escrow payment protection, milestone-based payments, skill verification, identity checks, and a dispute resolution system. Your money is only released when you approve the completed work.' },
  { question: 'What types of projects can I outsource?', answer: 'Virtually anything digital: web development, mobile apps, UI/UX design, graphic design, content writing, SEO, data science, AI/ML, blockchain, video editing, virtual assistance, marketing, and more. From one-hour tasks to year-long engagements.' },
];

export default function WhyHirePage() {
  return (
    <>
      <script {...jsonLdScriptProps(buildFAQJsonLd(faqs))} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Why Hire on MegiLance', path: '/why-hire' }])
      )} />
      <WhyHireClient faqs={faqs} />
    </>
  );
}
