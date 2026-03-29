// @AI-HINT: Explore page - unified search hub for freelancers and projects/gigs by category or query
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Explore from './Explore';
import { buildMeta, buildCollectionPageJsonLd, buildBreadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    title: 'Explore Freelancers & Projects - MegiLance',
    description: 'Explore top freelancers, projects, and gigs on MegiLance. Search by category, skill, or keyword. Web development, UI/UX design, mobile apps, data science, and more.',
    path: '/explore',
    keywords: [
      'explore freelancers', 'find freelance projects', 'hire talent',
      'web development', 'ui ux design', 'mobile apps', 'data science',
      'content writing', 'video animation', 'graphic design',
    ],
  });
}

function ExploreLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

export default function Page() {
  return (
    <>
      <script {...jsonLdScriptProps(
        buildCollectionPageJsonLd('Explore Freelancers & Projects', 'Discover top talent and opportunities on MegiLance.', '/explore')
      )} />
      <script {...jsonLdScriptProps(
        buildBreadcrumbJsonLd([{ name: 'Explore', path: '/explore' }])
      )} />
      <Suspense fallback={<ExploreLoading />}>
        <Explore />
      </Suspense>
    </>
  );
}
