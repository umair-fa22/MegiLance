/* @AI-HINT: Centralized SEO helpers for public pages. Use in generateMetadata() for consistency.
 * Includes structured data builders for Google Rich Results: BreadcrumbList, FAQPage,
 * Organization, WebSite (with Sitelinks SearchBox), SoftwareApplication, etc.
 * Also contains comprehensive keyword taxonomy for maximum search engine coverage.
 */
import type { Metadata } from 'next';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MetaInput = {
  title: string;
  description: string;
  path?: string; // e.g. "/pricing"
  image?: string; // absolute or site-relative OG image
  robots?: string;
  noindex?: boolean;
  keywords?: string[];
  type?: 'website' | 'article' | 'profile';
};

export type BreadcrumbItem = {
  name: string;
  path: string; // relative path, e.g. "/pricing"
};

export type FAQItem = {
  question: string;
  answer: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const SITE_NAME = 'MegiLance';
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://megilance.site';
export const SITE_DESCRIPTION = 'MegiLance is the #1 AI-powered freelance marketplace and best Upwork & Fiverr alternative. Hire top freelance web developers, designers, writers & experts online. Secure escrow payments, smart AI matching, zero commission for freelancers. Find freelance jobs and work online.';
export const SITE_TAGLINE = 'The Future of Freelancing';
export const SITE_LOGO = `${BASE_URL}/icon-512.png`;
export const SOCIAL_LINKS = [
  'https://www.linkedin.com/company/megilance/',
  'https://www.facebook.com/profile.php?id=61587532270843',
  'https://medium.com/@megilanceofficial',
  'https://www.producthunt.com/@megilance',
];

// ─── SEO Keyword Taxonomy ─────────────────────────────────────────────────────
// Data-driven keywords from Semrush research (Feb 2026). Grouped by intent.
// Volume = avg monthly searches (US). Competition indexed 0-100.
// Priority: HIGH = high volume + low competition, MEDIUM = balanced, LOW = niche.

export const SEO_KEYWORDS = {
  // Brand keywords
  brand: [
    'MegiLance', 'megilance', 'megilance.com', 'MegiLance freelance', 'MegiLance platform',
    'MegiLance marketplace', 'MegiLance app', 'MegiLance AI freelancing',
  ],

  // HIGH-VOLUME transactional keywords (Semrush-validated, sorted by volume)
  // "freelancer website" 1,900/mo CI:23 | "freelance jobs online" 880/mo CI:23
  // "freelance work online" 880/mo CI:23 | "freelance website designer" 480/mo CI:29
  // "freelance web developer" 320/mo CI:22 | "hire freelancers" 260/mo CI:87
  transactional: [
    'freelancer website', 'freelance jobs online', 'freelance work online',
    'freelance website designer', 'freelance web developer', 'hire a virtual assistant',
    'hire freelancers', 'hire graphic designer', 'hire web developer',
    'developers for hire', 'programmer for hire', 'freelance shopify developer',
    'hire python developers', 'hire wordpress developer', 'hire a web designer',
    'hire illustrator', 'hire content writer', 'hire UI UX designer',
    'hire mobile app developer', 'hire data scientist', 'hire AI developer',
    'freelance app developers', 'app developer freelancer', 'hire php developers',
    'hire freelance graphic designer', 'hire freelance web developer',
    'hire freelance developers', 'hire a python programmer',
    'freelance mobile app developer', 'hire a javascript developer',
  ],

  // COMPARISON & INFORMATIONAL keywords (competitor-positioning)
  // "upwork alternative" 210/mo CI:28 | "sites similar to upwork" 110/mo CI:45
  // "like fiverr" 210/mo CI:50 | "best freelance websites" 140/mo CI:54
  informational: [
    'upwork alternative', 'fiverr alternative', 'sites similar to upwork',
    'like fiverr', 'fiverr similar sites', 'best freelance websites',
    'best freelance platform', 'best freelance marketplace', 'top freelance websites',
    'fiverr type sites', 'places like fiverr', 'apps like fiverr',
    'better than fiverr', 'freelancer alternative', 'toptal alternative',
    'best platform for freelancers', 'AI powered freelancing',
    'zero fee freelancing platform', 'zero commission freelance platform',
    'freelance marketplace comparison', 'best freelancing website 2026',
  ],

  // Industry/niche keywords (service-category targeting)
  industry: [
    'freelance web development', 'freelance mobile development', 'freelance AI development',
    'freelance graphic design', 'freelance content writing', 'freelance digital marketing',
    'freelance SEO services', 'freelance video editing', 'freelance data science',
    'freelance machine learning', 'freelance blockchain', 'freelance cloud computing',
    'freelance cybersecurity', 'freelance WordPress development', 'freelance Shopify development',
    'virtual assistant jobs remote', 'freelance full stack developer',
  ],

  // Technology-specific keywords (Semrush-validated, low competition)
  // "freelance shopify developer" 110/mo CI:15 | "shopify freelancer" 110/mo CI:15
  // "freelance react developer" 10/mo CI:0 | "freelance java developer" 10/mo CI:43
  technology: [
    'freelance shopify developer', 'shopify freelancer', 'freelance react developer',
    'freelance wordpress developer', 'freelance full stack developer',
    'React developer freelance', 'Python developer freelance', 'Node.js developer freelance',
    'JavaScript developer freelance', 'TypeScript developer freelance', 'Flutter developer freelance',
    'Angular developer freelance', 'Vue.js developer freelance', 'AWS architect freelance',
    'full stack developer freelance', 'backend developer freelance', 'frontend developer freelance',
    'freelance java developer', 'freelance php developer', 'freelance ios developer',
    'freelance android developer', 'freelance front end developer',
  ],

  // Long-tail keywords (high intent, low competition, high monetization)
  // "hire a python programmer" monetization:25.51 | "best freelance websites" monetization:20.74
  // "freelance full stack developer" monetization:18.05
  longTail: [
    'how to hire freelancers online', 'best platform to find freelancers',
    'website to hire freelancers', 'find freelancers', 'find freelance developers',
    'hire freelancers online', 'best marketplace for freelancers',
    'online freelance marketplace', 'freelance services marketplace',
    'freelance developer marketplace', 'freelance marketplace platform',
    'secure freelance payments', 'AI matching freelance platform', 'escrow payments freelancing',
    'remote talent hiring platform', 'freelance marketplace with blockchain',
    'hire verified freelancers', 'freelance platform low fees', 'instant freelancer matching',
    'freelance project management tool', 'freelance collaboration platform',
    'freelance services marketplace for businesses',
  ],

  // Location/remote-work keywords
  location: [
    'hire freelancers worldwide', 'global freelance marketplace', 'international freelancers',
    'remote work platform', 'distributed teams hiring', 'cross-border freelance payments',
    'hire freelancers from Pakistan', 'hire freelancers from India',
    'hire freelancers from Philippines', 'hire freelancers from Eastern Europe',
    'freelance web designer near me', 'virtual assistant jobs remote',
  ],

  // Feature/USP keywords
  features: [
    'AI freelancer matching', 'smart contract payments', 'blockchain escrow system',
    'real-time collaboration tools', 'video calling freelance', 'milestone payments',
    'freelancer verification system', 'skill assessment platform', 'portfolio showcase',
    'time tracking freelance', 'invoice generation freelance',
    'zero commission freelancing', 'no fee freelance platform',
  ],
};

/** Flatten keyword groups into a single array */
export function getKeywordsForPage(groups: (keyof typeof SEO_KEYWORDS)[], extra?: string[]): string[] {
  const keywords: string[] = groups.flatMap(g => [...SEO_KEYWORDS[g]]);
  if (extra) keywords.push(...extra);
  // Deduplicate
  return [...new Set(keywords)];
}

// ─── URL Helpers ──────────────────────────────────────────────────────────────

function toAbsoluteUrl(path?: string) {
  if (!path) return BASE_URL;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const canonical = (path?: string) => toAbsoluteUrl(path);

// ─── Metadata Builders ───────────────────────────────────────────────────────

export function buildMeta(input: MetaInput): Metadata {
  const url = toAbsoluteUrl(input.path);
  const title = input.title?.includes(SITE_NAME)
    ? input.title
    : `${input.title} | ${SITE_NAME}`;

  const robotsDirective = input.noindex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1 as const,
          'max-image-preview': 'large' as const,
          'max-snippet': -1 as const,
        },
      };

  // Only set explicit OG images when a custom image is provided.
  // Otherwise, the file-convention opengraph-image.tsx auto-generates them.
  const ogImage = input.image ? toAbsoluteUrl(input.image) : undefined;

  return {
    title,
    description: input.description,
    ...(input.keywords ? { keywords: input.keywords } : {}),
    alternates: {
      canonical: url,
      languages: { 'en-US': url },
    },
    openGraph: {
      title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      locale: 'en_US',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title as string }] } : {}),
      type: input.type || 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@megilance',
      creator: '@megilance',
      title,
      description: input.description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: robotsDirective,
  } satisfies Metadata;
}

export function buildArticleMeta(input: MetaInput & { publishedTime?: string; modifiedTime?: string; author?: string; tags?: string[] }) {
  const meta = buildMeta({ ...input, type: 'article' });
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
      ...(input.author ? { authors: [input.author] } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
    },
  } as Metadata;
}

/** ProfilePage meta for freelancer/user profile pages */
export function buildProfileMeta(input: MetaInput & { firstName?: string; lastName?: string; username?: string }) {
  const meta = buildMeta({ ...input, type: 'profile' });
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'profile',
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.username ? { username: input.username } : {}),
    },
  } as Metadata;
}

// ─── JSON-LD Structured Data Builders ─────────────────────────────────────────
// These generate schema.org structured data for Google Rich Results.
// Usage: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />

/** BreadcrumbList – Shows breadcrumb trail in Google results */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      ...items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.name,
        item: toAbsoluteUrl(item.path),
      })),
    ],
  };
}

/** FAQPage – Shows expandable FAQ answers directly in Google SERP */
export function buildFAQJsonLd(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** WebSite – Enables Google Sitelinks SearchBox */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['MegiLance Freelance Marketplace', 'MegiLance AI Platform'],
    url: BASE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/jobs?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${BASE_URL}/hire?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
      logo: SITE_LOGO,
    },
  };
}

/** Organization – Brand info, logo, contact in Knowledge Panel */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: 'MegiLance Technologies',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: SITE_LOGO,
      width: 512,
      height: 512,
    },
    image: SITE_LOGO,
    description: SITE_DESCRIPTION,
    foundingDate: '2024',
    slogan: SITE_TAGLINE,
    sameAs: SOCIAL_LINKS,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@megilance.com',
        url: `${BASE_URL}/support`,
        availableLanguage: ['English'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: 'business@megilance.com',
        url: `${BASE_URL}/enterprise`,
        availableLanguage: ['English'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'GeoShape',
      name: 'Worldwide',
    },
    knowsAbout: [
      'Freelancing', 'Remote Work', 'AI Matching', 'Blockchain Payments',
      'Web Development', 'Mobile Development', 'UI/UX Design', 'Data Science',
    ],
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      minValue: 10,
      maxValue: 50,
    },
  };
}

/** SoftwareApplication – App rich result for marketplace */
export function buildSoftwareAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: SITE_DESCRIPTION,
    url: BASE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '2500',
    },
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** CollectionPage – For listing pages (jobs, freelancers, gigs) */
export function buildCollectionPageJsonLd(name: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: toAbsoluteUrl(path),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** AboutPage – For the about page */
export function buildAboutPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${SITE_NAME}`,
    description: `Learn about ${SITE_NAME}'s mission to elevate global freelancing with AI and secure payments.`,
    url: toAbsoluteUrl('/about'),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** ContactPage – For the contact page */
export function buildContactPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${SITE_NAME}`,
    description: 'Get in touch with the MegiLance team for support, partnerships, or general inquiries.',
    url: toAbsoluteUrl('/contact'),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** Service – For individual service/skill hire pages */
export function buildServiceJsonLd(serviceName: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description,
    url: toAbsoluteUrl(path),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    serviceType: 'Freelance Marketplace',
  };
}

/** ItemList – For search results or ranked listings */
export function buildItemListJsonLd(
  items: Array<{ name: string; url: string; position: number }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

/** Generates SiteNavigationElement for Google sitelinks */
export function buildSiteNavigationJsonLd() {
  const navItems = [
    { name: 'Find Work', url: '/jobs' },
    { name: 'Hire Talent', url: '/hire' },
    { name: 'Browse Freelancers', url: '/talent' },
    { name: 'How It Works', url: '/how-it-works' },
    { name: 'Pricing', url: '/pricing' },
    { name: 'About', url: '/about' },
    { name: 'Blog', url: '/blog' },
    { name: 'FAQ', url: '/faq' },
    { name: 'Contact', url: '/contact' },
    { name: 'Support', url: '/support' },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: 'Main Navigation',
    hasPart: navItems.map((item) => ({
      '@type': 'WebPage',
      name: item.name,
      url: toAbsoluteUrl(item.url),
    })),
  };
}

/** HowTo – For how-it-works / tutorial pages (Google Rich Results) */
export function buildHowToJsonLd(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; url?: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    totalTime: 'PT10M',
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.url ? { url: toAbsoluteUrl(step.url) } : {}),
    })),
  };
}

/** Review/Testimonial – Aggregate rating for social proof */
export function buildAggregateRatingJsonLd(
  ratingValue: number,
  ratingCount: number,
  bestRating = 5,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${SITE_NAME} Freelance Marketplace`,
    description: SITE_DESCRIPTION,
    brand: { '@type': 'Brand', name: SITE_NAME },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toString(),
      bestRating: bestRating.toString(),
      worstRating: '1',
      ratingCount: ratingCount.toString(),
    },
  };
}

/** JobPosting – For individual job listing pages */
export function buildJobPostingJsonLd(job: {
  title: string;
  description: string;
  datePosted: string;
  validThrough?: string;
  employmentType?: string;
  salary?: { min: number; max: number; currency: string };
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.datePosted,
    ...(job.validThrough ? { validThrough: job.validThrough } : {}),
    employmentType: job.employmentType || 'CONTRACTOR',
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: SITE_NAME,
      sameAs: BASE_URL,
      logo: SITE_LOGO,
    },
    ...(job.salary ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: job.salary.currency,
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salary.min,
          maxValue: job.salary.max,
          unitText: 'HOUR',
        },
      },
    } : {}),
    url: toAbsoluteUrl(job.path),
  };
}

/** Person – For freelancer profile pages */
export function buildPersonJsonLd(person: {
  name: string;
  jobTitle: string;
  description: string;
  image?: string;
  path: string;
  skills?: string[];
  socialUrls?: string[];
  languages?: string[];
  tools?: string[];
}) {
  const sameAs = (person.socialUrls || []).filter(Boolean);
  const knowsAbout = [
    ...(person.skills || []),
    ...(person.tools || []),
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.jobTitle,
    description: person.description,
    ...(person.image ? { image: toAbsoluteUrl(person.image) } : {}),
    url: toAbsoluteUrl(person.path),
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(person.languages && person.languages.length > 0 ? { knowsLanguage: person.languages } : {}),
    memberOf: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
  };
}

/** VideoObject – For video content pages */
export function buildVideoJsonLd(video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: toAbsoluteUrl(video.thumbnailUrl),
    uploadDate: video.uploadDate,
    ...(video.duration ? { duration: video.duration } : {}),
    ...(video.contentUrl ? { contentUrl: video.contentUrl } : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_LOGO },
    },
  };
}

/** Offer catalog / pricing page schema */
export function buildOfferCatalogJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: `${SITE_NAME} Pricing Plans`,
    description: 'Affordable freelance marketplace pricing. Starting from 1% commission.',
    url: toAbsoluteUrl('/pricing'),
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Basic Plan',
        description: 'For individuals getting started. 5% per transaction.',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Standard Plan',
        description: 'For growing businesses. 3% per transaction.',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      {
        '@type': 'Offer',
        name: 'Premium Plan',
        description: 'For enterprises. Only 1% per transaction.',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    ],
  };
}

/** Render one or more JSON-LD schemas as a combined script string */
export function jsonLdScriptProps(...schemas: Record<string, unknown>[]) {
  if (schemas.length === 1) {
    return {
      type: 'application/ld+json' as const,
      dangerouslySetInnerHTML: { __html: JSON.stringify(schemas[0]) },
    };
  }
  return {
    type: 'application/ld+json' as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(schemas) },
  };
}
