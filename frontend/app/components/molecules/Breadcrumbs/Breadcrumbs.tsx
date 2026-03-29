// @AI-HINT: Breadcrumb navigation component with route-aware auto-generation and theme support
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

import commonStyles from './Breadcrumbs.common.module.css';
import lightStyles from './Breadcrumbs.light.module.css';
import darkStyles from './Breadcrumbs.dark.module.css';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show breadcrumbs on home page
  if (pathname === '/') return null;

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return <nav aria-label="Breadcrumb" className={commonStyles.breadcrumbs} />;
  }

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const pathSegments = pathname.split('/').filter((segment) => segment !== '');

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { href, label };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://megilance.com',
      },
      ...breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.label,
        item: `https://megilance.com${item.href}`,
      })),
    ],
  };

  return (
    <nav aria-label="Breadcrumb" className={commonStyles.breadcrumbs}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className={commonStyles.list}>
        <li className={commonStyles.item}>
          <Link href="/" className={cn(commonStyles.link, themeStyles.link)} aria-label="Home">
            <Home size={16} />
          </Link>
        </li>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          return (
            <li key={item.href} className={commonStyles.item}>
              <ChevronRight size={14} className={commonStyles.separator} />
              {isLast ? (
                <span className={cn(commonStyles.current, themeStyles.current)} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className={cn(commonStyles.link, themeStyles.link)}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
