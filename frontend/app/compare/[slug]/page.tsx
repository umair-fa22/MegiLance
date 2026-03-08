// @AI-HINT: Dynamic comparison pages — MegiLance vs Upwork, Fiverr, Toptal, Freelancer.com
// Targets high-value "alternative" keywords: "upwork alternative", "fiverr alternative" etc.
import type { Metadata } from 'next';
import CompareClient from './CompareClient';
import {
  buildMeta,
  buildBreadcrumbJsonLd,
  buildFAQJsonLd,
  jsonLdScriptProps,
  BASE_URL,
  SITE_NAME,
} from '@/lib/seo';

type CompetitorData = {
  slug: string;
  name: string;
  title: string;
  description: string;
  keywords: string[];
  faqs: { question: string; answer: string }[];
  comparison: { feature: string; us: string; them: string }[];
  whySwitch: string[];
};

const competitors: Record<string, CompetitorData> = {
  upwork: {
    slug: 'upwork',
    name: 'Upwork',
    title: `${SITE_NAME} vs Upwork - Better Freelance Marketplace Alternative (2026)`,
    description: `Compare ${SITE_NAME} vs Upwork. Lower fees, AI-powered matching, faster hiring, and secure blockchain payments. See why businesses are switching from Upwork to ${SITE_NAME}.`,
    keywords: [
      'upwork alternative', 'better than upwork', 'upwork vs megilance',
      'sites similar to upwork', 'sites like upwork', 'upwork competitor',
      'cheaper than upwork', 'upwork replacement', 'upwork fees too high',
      'freelance marketplace alternative', 'hire freelancers lower fees',
    ],
    faqs: [
      { question: `Is ${SITE_NAME} better than Upwork?`, answer: `${SITE_NAME} offers AI-powered matching (98% accuracy), lower fees (0-5% vs Upwork's 3-5% client fee + 10-20% freelancer fee), faster hiring (24h avg vs 3-5 days), and blockchain-secured payments. Most clients who switch report 60% faster project completion.` },
      { question: `How much cheaper is ${SITE_NAME} compared to Upwork?`, answer: `Upwork charges clients 3-5% per payment plus freelancers pay 10-20% service fees. ${SITE_NAME} charges only 0-5% with zero freelancer commission, saving both sides significantly.` },
      { question: 'Can I migrate my Upwork team to MegiLance?', answer: 'Yes! You can invite your existing freelancers to join MegiLance. They will pay zero commission on all projects, making them more competitive on pricing.' },
      { question: 'Does MegiLance have the same quality of freelancers?', answer: 'MegiLance freelancers go through skill assessments and verification. Our AI matching ensures you get highly relevant matches. Many top Upwork freelancers are already on MegiLance.' },
    ],
    comparison: [
      { feature: 'Client Platform Fee', us: '0-5%', them: '3-5%' },
      { feature: 'Freelancer Commission', us: '0% (Zero)', them: '10-20%' },
      { feature: 'AI-Powered Matching', us: '✓ 98% Accuracy', them: '✗ Manual search' },
      { feature: 'Average Hire Time', us: '24 hours', them: '3-5 days' },
      { feature: 'Blockchain Payments', us: '✓ Included', them: '✗' },
      { feature: 'Cost to Post Project', us: 'Free', them: '$5-50' },
      { feature: 'Skill Assessments', us: '✓ AI-verified', them: 'Basic tests' },
      { feature: 'Milestone Payments', us: '✓ Free', them: '✓ With fees' },
      { feature: 'Video Calls Built-in', us: '✓', them: '✓' },
      { feature: 'Dispute Resolution', us: '✓ Free', them: '✓' },
    ],
    whySwitch: [
      'Save 60-80% on platform fees compared to Upwork',
      'AI matching finds the right freelancer in minutes, not days',
      'Zero commission means freelancers offer better rates',
      'Blockchain-secured escrow for extra payment protection',
      'Faster project completion with better-matched talent',
      'No hidden fees or surprise charges',
    ],
  },
  fiverr: {
    slug: 'fiverr',
    name: 'Fiverr',
    title: `${SITE_NAME} vs Fiverr - Professional Freelance Alternative (2026)`,
    description: `Compare ${SITE_NAME} vs Fiverr. Get custom projects (not just gigs), AI-powered matching, lower fees, and professional freelancers. The best Fiverr alternative for serious businesses.`,
    keywords: [
      'fiverr alternative', 'better than fiverr', 'fiverr vs megilance',
      'sites like fiverr', 'apps like fiverr', 'fiverr similar sites',
      'fiverr type sites', 'places like fiverr', 'fiverr competitor',
      'professional freelance platform', 'fiverr replacement 2026',
    ],
    faqs: [
      { question: 'How is MegiLance different from Fiverr?', answer: 'While Fiverr focuses on pre-made gig packages, MegiLance lets you post custom projects and get AI-matched proposals from qualified freelancers. You get personalized solutions, not one-size-fits-all gigs.' },
      { question: 'Are MegiLance freelancers more professional than Fiverr?', answer: 'MegiLance freelancers go through skill verification and assessments. Our AI matching considers expertise, experience, and past performance to ensure you get qualified professionals, not just the cheapest option.' },
      { question: 'Is MegiLance cheaper than Fiverr?', answer: 'Yes. Fiverr charges a 5.5% buyer fee plus $2 on small orders. MegiLance charges 0-5% with no minimum order fees. Plus, freelancers pay zero commission so they can offer better rates.' },
      { question: 'Can I get custom work on MegiLance like on Fiverr?', answer: 'Yes, and more. MegiLance supports custom projects with milestones, hourly contracts, and long-term engagements — not just pre-packaged gigs. You describe what you need, and qualified freelancers come to you.' },
    ],
    comparison: [
      { feature: 'Project Type', us: 'Custom + Gigs', them: 'Pre-made Gigs only' },
      { feature: 'Client Fee', us: '0-5%', them: '5.5% + $2 small orders' },
      { feature: 'Freelancer Commission', us: '0%', them: '20%' },
      { feature: 'AI Matching', us: '✓ Personalized', them: '✗ Browse catalog' },
      { feature: 'Milestone Payments', us: '✓', them: '✗ (Lump sum)' },
      { feature: 'Hourly Contracts', us: '✓', them: 'Limited' },
      { feature: 'Skill Verification', us: '✓ AI-assessed', them: 'Self-reported' },
      { feature: 'Blockchain Security', us: '✓', them: '✗' },
      { feature: 'Custom Proposals', us: '✓', them: '✗ Fixed packages' },
      { feature: 'Long-term Contracts', us: '✓', them: 'Limited' },
    ],
    whySwitch: [
      'Get custom solutions, not generic gig packages',
      'AI finds the right freelancer for YOUR specific needs',
      'Lower fees for both clients and freelancers',
      'Milestone-based payments for complex projects',
      'Professional freelancers with verified skills',
      'Better communication tools and project management',
    ],
  },
  toptal: {
    slug: 'toptal',
    name: 'Toptal',
    title: `${SITE_NAME} vs Toptal - Top Freelancers Without the Premium Price (2026)`,
    description: `Compare ${SITE_NAME} vs Toptal. Access verified top freelancers at a fraction of the cost. AI matching, flexible hiring, and no minimum commitments. The affordable Toptal alternative.`,
    keywords: [
      'toptal alternative', 'cheaper than toptal', 'toptal vs megilance',
      'hire top developers affordable', 'toptal competitor',
      'toptal too expensive', 'affordable elite freelancers',
      'top developer marketplace', 'toptal replacement',
    ],
    faqs: [
      { question: 'How is MegiLance different from Toptal?', answer: 'Toptal charges premium rates ($60-200+/hr) with a $500 deposit. MegiLance gives you access to verified, skilled freelancers at market rates with AI matching, no deposits, and flexible engagement models.' },
      { question: 'Are MegiLance freelancers as good as Toptal?', answer: 'MegiLance uses AI-powered skill assessments to verify freelancer expertise. While Toptal claims "top 3%", our AI matching ensures you get the best fit for YOUR specific project requirements and budget.' },
      { question: 'Is MegiLance cheaper than Toptal?', answer: 'Significantly. Toptal freelancers typically charge $60-200+/hr with mandatory minimums. MegiLance freelancers set competitive market rates, and you pay only 0-5% platform fee. No deposits required.' },
    ],
    comparison: [
      { feature: 'Freelancer Rates', us: 'Market rates', them: '$60-200+/hr premium' },
      { feature: 'Required Deposit', us: 'None', them: '$500 upfront' },
      { feature: 'Minimum Commitment', us: 'None', them: '2-4 week minimum' },
      { feature: 'Platform Fee', us: '0-5%', them: 'Included in rates' },
      { feature: 'AI Matching', us: '✓ Instant', them: '✗ Manual (1-3 weeks)' },
      { feature: 'Project Types', us: 'All (any budget)', them: 'Enterprise only' },
      { feature: 'Trial Period', us: 'Milestone-based', them: '2-week trial' },
      { feature: 'Blockchain Security', us: '✓', them: '✗' },
    ],
    whySwitch: [
      'No $500 deposit or minimum commitments required',
      'Access skilled freelancers at market rates, not premium markup',
      'AI matching in minutes vs weeks of manual screening',
      'Flexible for projects of any size and budget',
      'Same quality talent with transparent pricing',
    ],
  },
  'freelancer-com': {
    slug: 'freelancer-com',
    name: 'Freelancer.com',
    title: `${SITE_NAME} vs Freelancer.com - Modern AI-Powered Alternative (2026)`,
    description: `Compare ${SITE_NAME} vs Freelancer.com. Better UI, AI matching, lower fees, and verified freelancers. Upgrade from Freelancer.com to the modern freelance marketplace.`,
    keywords: [
      'freelancer.com alternative', 'freelancer alternative',
      'better than freelancer.com', 'freelancer vs megilance',
      'freelancer.com replacement', 'modern freelance marketplace',
    ],
    faqs: [
      { question: 'Is MegiLance better than Freelancer.com?', answer: 'MegiLance offers a modern UI, AI-powered matching, lower fees, and verified freelancers. Unlike Freelancer.com, there are no contest fees, no hidden charges, and no spam proposals.' },
      { question: 'Does MegiLance have contests like Freelancer.com?', answer: 'MegiLance focuses on direct hiring and AI matching for higher quality results. Instead of running contests where you get dozens of low-effort entries, our AI matches you with 3-5 highly qualified candidates.' },
    ],
    comparison: [
      { feature: 'Platform Fee', us: '0-5%', them: '3-5%' },
      { feature: 'Freelancer Commission', us: '0%', them: '10%' },
      { feature: 'AI Matching', us: '✓ Advanced', them: '✗' },
      { feature: 'Proposal Quality', us: 'AI-filtered', them: 'Unfiltered spam' },
      { feature: 'Modern UI/UX', us: '✓ 2026 design', them: 'Outdated' },
      { feature: 'Blockchain Payments', us: '✓', them: '✗' },
      { feature: 'Skill Verification', us: '✓ AI-assessed', them: 'Basic exams' },
      { feature: 'Hidden Fees', us: 'None', them: 'Contest fees, upgrades' },
    ],
    whySwitch: [
      'Modern, clean interface vs outdated design',
      'AI-filtered proposals, no spam',
      'Zero hidden fees or premium upgrades needed',
      'Quality-focused matching over quantity',
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(competitors).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = competitors[slug];
  if (!data) {
    return buildMeta({
      title: 'Platform Comparison',
      description: 'Compare MegiLance with other freelance platforms.',
      path: '/compare',
    });
  }
  return buildMeta({
    title: data.title,
    description: data.description,
    path: `/compare/${data.slug}`,
    keywords: data.keywords,
  });
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = competitors[slug];

  if (!data) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h1>Comparison Not Found</h1>
        <p>We don&apos;t have a comparison for this platform yet.</p>
      </div>
    );
  }

  return (
    <>
      <script {...jsonLdScriptProps(buildFAQJsonLd(data.faqs))} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([
          { name: 'Compare', path: '/compare' },
          { name: `vs ${data.name}`, path: `/compare/${data.slug}` },
        ])
      )} />
      <script {...jsonLdScriptProps({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: data.title,
        description: data.description,
        url: `${BASE_URL}/compare/${data.slug}`,
        about: {
          '@type': 'SoftwareApplication',
          name: SITE_NAME,
          applicationCategory: 'BusinessApplication',
        },
        mentions: {
          '@type': 'SoftwareApplication',
          name: data.name,
          applicationCategory: 'BusinessApplication',
        },
      })} />
      <CompareClient data={data} />
    </>
  );
}
