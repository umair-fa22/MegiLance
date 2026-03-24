// @AI-HINT: Public Job Details page with dynamic SEO metadata & JobPosting JSON-LD
import type { Metadata } from 'next';
import JobDetails from './JobDetails';
import { buildMeta, buildBreadcrumbJsonLd, jsonLdScriptProps, BASE_URL, SITE_NAME } from '@/lib/seo';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

async function fetchJob(id: string) {
  try {
    const res = await fetch(`${BACKEND}/api/projects/${id}`, {
      next: { revalidate: 300 },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchJob(id);

  if (!job) {
    return buildMeta({
      title: 'Job Details',
      description: 'View job details and apply on MegiLance.',
      path: `/jobs/${id}`,
    });
  }

  const title = job.title || 'Job Details';
  const description = job.description
    ? job.description.replace(/<[^>]*>/g, '').substring(0, 160).trim()
    : `View ${title} job posting on MegiLance. Apply now and grow your freelancing career.`;

  const keywords = [
    title,
    job.category,
    ...(Array.isArray(job.skills) ? job.skills.slice(0, 5) : []),
    'freelance job',
    'remote work',
    'MegiLance',
  ].filter(Boolean) as string[];

  return buildMeta({ title, description, path: `/jobs/${id}`, keywords });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await fetchJob(id);

  // JobPosting JSON-LD for rich results
  const jobJsonLd = job
    ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description?.replace(/<[^>]*>/g, '') || '',
        datePosted: job.created_at || new Date().toISOString(),
        hiringOrganization: {
          '@type': 'Organization',
          name: job.client_name || SITE_NAME,
          sameAs: BASE_URL,
        },
        jobLocation: {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: job.location || 'Remote' },
        },
        employmentType: job.budget_type === 'hourly' ? 'PART_TIME' : 'CONTRACT',
        ...(job.budget_min || job.budget_max
          ? {
              baseSalary: {
                '@type': 'MonetaryAmount',
                currency: 'USD',
                value: {
                  '@type': 'QuantitativeValue',
                  ...(job.budget_min ? { minValue: job.budget_min } : {}),
                  ...(job.budget_max ? { maxValue: job.budget_max } : {}),
                  unitText: job.budget_type === 'hourly' ? 'HOUR' : 'YEAR',
                },
              },
            }
          : {}),
      }
    : null;

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: 'Jobs', path: '/jobs' },
    { name: job?.title || 'Job Details', path: `/jobs/${id}` },
  ]);

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumb)} />
      {jobJsonLd && <script {...jsonLdScriptProps(jobJsonLd)} />}
      <JobDetails jobId={id} />
    </>
  );
}
