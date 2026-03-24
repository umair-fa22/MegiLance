// @AI-HINT: Interactive cost calculator — shows savings hiring freelancers on MegiLance vs full-time or competitors
import type { Metadata } from 'next';
import { buildMeta, buildBreadcrumbJsonLd, buildFAQJsonLd, jsonLdScriptProps } from '@/lib/seo'
import CostCalculatorClient from './CostCalculatorClient';

const faqs = [
  { question: 'How is the savings estimate calculated?', answer: 'We compare fully-loaded full-time employee costs (salary + benefits + overhead at ~1.4× multiplier) against freelance hourly rates for equivalent work, factoring in MegiLance\'s 0% commission.' },
  { question: 'Are MegiLance freelance rates accurate?', answer: 'Rates are based on market averages from our platform data across 50,000+ completed projects. Actual rates vary by experience and geography.' },
  { question: 'What does 0% commission mean?', answer: 'Unlike Upwork (10-20%) or Fiverr (20%), MegiLance charges freelancers 0% commission. This means freelancers offer lower rates since they keep 100% of earnings.' },
  { question: 'Can I hire for short-term projects?', answer: 'Absolutely. MegiLance is perfect for projects of any duration — from one-hour tasks to multi-year engagements.' },
];

export const metadata: Metadata = buildMeta({
  title: 'Freelance Cost Calculator — See How Much You Can Save | MegiLance',
  description: 'Use our free cost calculator to compare hiring freelancers on MegiLance vs full-time employees. Calculate real savings with our interactive tool.',
  path: '/cost-calculator',
  keywords: ['freelance cost calculator', 'hiring cost comparison', 'freelancer vs full time', 'outsourcing savings calculator', 'freelance rate calculator'],
});

export default function CostCalculatorPage() {
  return (
    <>
      <script {...jsonLdScriptProps(buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Cost Calculator', path: '/cost-calculator' },
      ]))} />
      <script {...jsonLdScriptProps(buildFAQJsonLd(faqs))} />
      <CostCalculatorClient faqs={faqs} />
    </>
  );
}
