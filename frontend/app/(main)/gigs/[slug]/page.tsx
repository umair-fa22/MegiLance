// @AI-HINT: Public Gig Detail page with dynamic SEO metadata & Product JSON-LD
import type { Metadata } from 'next';
import GigDetail from './GigDetail';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps, BASE_URL, SITE_NAME } from '@/lib/seo';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

async function fetchGig(slug: string) {
  try {
    const res = await fetch(`${BACKEND}/api/gigs/${slug}`, {
      next: { revalidate: 300 },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const gig = await fetchGig(slug);

  const fallbackTitle = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (!gig) {
    return buildMeta({
      title: `${fallbackTitle} | MegiLance Services`,
      description: `Professional freelance service - ${fallbackTitle}. Order now on MegiLance.`,
      path: `/gigs/${slug}`,
    });
  }

  const title = gig.title || fallbackTitle;
  const description = gig.description
    ? gig.description.replace(/<[^>]*>/g, '').substring(0, 160).trim()
    : `Order ${title} from a top freelancer on MegiLance.`;

  const keywords = [
    title,
    gig.category,
    ...(Array.isArray(gig.tags) ? gig.tags.slice(0, 5) : []),
    'freelance service',
    'gig',
    'MegiLance',
  ].filter(Boolean) as string[];

  return buildMeta({ title, description, path: `/gigs/${slug}`, keywords });
}

export default async function GigDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gig = await fetchGig(slug);

  const gigJsonLd = gig
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: gig.title,
        description: gig.description?.replace(/<[^>]*>/g, '') || '',
        offers: {
          '@type': 'Offer',
          price: gig.price ?? gig.starting_price ?? 0,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/gigs/${slug}`,
        },
        ...(gig.rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: gig.rating,
            reviewCount: gig.review_count ?? 1,
          },
        }),
        brand: { '@type': 'Organization', name: SITE_NAME },
      }
    : null;

  return (
    <>
      {gigJsonLd && <script {...jsonLdScriptProps(gigJsonLd)} />}
      <script
        {...jsonLdScriptProps(
          buildBreadcrumbJsonLd([
            { name: 'Gigs', path: '/gigs' },
            { name: gig?.title || slug, path: `/gigs/${slug}` },
          ])
        )}
      />
      <GigDetail />
    </>
  );
}
