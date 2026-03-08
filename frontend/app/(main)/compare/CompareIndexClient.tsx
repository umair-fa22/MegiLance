// @AI-HINT: Compare index client — grid of competitor comparison cards
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ArrowRight, Scale } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import commonStyles from './CompareIndex.common.module.css';
import lightStyles from './CompareIndex.light.module.css';
import darkStyles from './CompareIndex.dark.module.css';

interface Competitor { slug: string; name: string; desc: string; }

export default function CompareIndexClient({ competitors }: { competitors: Competitor[] }) {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;
  const theme = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.page, theme.page)}>
      <section className={cn(commonStyles.hero, theme.hero)}>
        <div className={commonStyles.heroInner}>
          <div className={cn(commonStyles.heroIcon, theme.heroIcon)}><Scale size={32} /></div>
          <h1 className={cn(commonStyles.heroTitle, theme.heroTitle)}>
            MegiLance vs <span className={cn(commonStyles.gradient, theme.gradient)}>The Competition</span>
          </h1>
          <p className={cn(commonStyles.heroDesc, theme.heroDesc)}>
            Honest, detailed comparisons so you can choose the best freelancing platform for your business.
          </p>
        </div>
      </section>

      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.inner}>
          <div className={commonStyles.grid}>
            {competitors.map((c) => (
              <Link key={c.slug} href={`/compare/${c.slug}`} className={cn(commonStyles.card, theme.card)}>
                <h2 className={cn(commonStyles.cardTitle, theme.cardTitle)}>
                  MegiLance vs {c.name}
                </h2>
                <p className={cn(commonStyles.cardDesc, theme.cardDesc)}>{c.desc}</p>
                <span className={cn(commonStyles.cardLink, theme.cardLink)}>
                  Read Full Comparison <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>

          <div className={commonStyles.ctaBlock}>
            <Link href="/post-project">
              <Button variant="primary" size="lg">
                Try MegiLance Free <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
