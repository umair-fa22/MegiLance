// @AI-HINT: Client-side comparison page — shows MegiLance vs competitor with table, FAQs, CTAs.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  Zap,
} from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './Compare.common.module.css';
import lightStyles from './Compare.light.module.css';
import darkStyles from './Compare.dark.module.css';

type CompareData = {
  slug: string;
  name: string;
  title: string;
  description: string;
  faqs: { question: string; answer: string }[];
  comparison: { feature: string; us: string; them: string }[];
  whySwitch: string[];
};

export default function CompareClient({ data }: { data: CompareData }) {
  const { resolvedTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!resolvedTheme) return null;
  const theme = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.page, theme.page)}>
      {/* Hero */}
      <section className={cn(commonStyles.hero, theme.hero)}>
        <div className={commonStyles.heroInner}>
          <div className={cn(commonStyles.badge, theme.badge)}>
            <Trophy size={14} />
            <span>Honest Comparison — Updated 2026</span>
          </div>
          <h1 className={cn(commonStyles.heroTitle, theme.heroTitle)}>
            MegiLance vs {data.name}
          </h1>
          <p className={cn(commonStyles.heroDesc, theme.heroDesc)}>
            {data.description}
          </p>
          <div className={commonStyles.heroCtas}>
            <Link href="/signup?role=client&from=compare">
              <Button variant="primary" size="lg">
                Try MegiLance Free <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/post-project">
              <Button variant="outline" size="lg">
                Post a Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.inner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            Feature-by-Feature Comparison
          </h2>
          <div className={cn(commonStyles.table, theme.table)}>
            <div className={cn(commonStyles.tableRow, commonStyles.tableHeader, theme.tableHeader)}>
              <div className={commonStyles.tableFeature}>Feature</div>
              <div className={cn(commonStyles.tableBrand, theme.tableBrand)}>MegiLance</div>
              <div className={commonStyles.tableCompetitor}>{data.name}</div>
            </div>
            {data.comparison.map((row) => (
              <div key={row.feature} className={cn(commonStyles.tableRow, theme.tableRow)}>
                <div className={cn(commonStyles.tableFeature, theme.tableFeature)}>{row.feature}</div>
                <div className={cn(commonStyles.tableBrand, theme.tableBrand)}>
                  {row.us.startsWith('✓') ? (
                    <span className={commonStyles.check}><CheckCircle2 size={16} /> {row.us.slice(2)}</span>
                  ) : row.us.startsWith('✗') ? (
                    <span className={commonStyles.cross}><XCircle size={16} /> {row.us.slice(2)}</span>
                  ) : row.us}
                </div>
                <div className={cn(commonStyles.tableCompetitor, theme.tableCompetitor)}>
                  {row.them.startsWith('✓') ? (
                    <span className={commonStyles.checkNeutral}><CheckCircle2 size={16} /> {row.them.slice(2)}</span>
                  ) : row.them.startsWith('✗') ? (
                    <span className={commonStyles.cross}><XCircle size={16} /> {row.them.slice(2)}</span>
                  ) : row.them}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Switch */}
      <section className={cn(commonStyles.section, commonStyles.switchSection, theme.switchSection)}>
        <div className={commonStyles.inner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            Why Businesses Switch from {data.name} to MegiLance
          </h2>
          <div className={commonStyles.switchGrid}>
            {data.whySwitch.map((reason) => (
              <div key={reason} className={cn(commonStyles.switchCard, theme.switchCard)}>
                <CheckCircle2 size={20} className={commonStyles.switchIcon} />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.inner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>
            Common Questions About Switching
          </h2>
          <div className={commonStyles.faqList}>
            {data.faqs.map((faq, i) => (
              <div key={i} className={cn(commonStyles.faqItem, theme.faqItem)}>
                <button
                  className={cn(commonStyles.faqQ, theme.faqQ)}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.question}</span>
                  {openFaq === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {openFaq === i && (
                  <div className={cn(commonStyles.faqA, theme.faqA)}>{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={cn(commonStyles.bottomCta, theme.bottomCta)}>
        <div className={commonStyles.inner}>
          <Zap size={32} className={commonStyles.ctaIcon} />
          <h2 className={cn(commonStyles.ctaTitle, theme.ctaTitle)}>
            Ready to Switch? Try MegiLance Free
          </h2>
          <p className={cn(commonStyles.ctaDesc, theme.ctaDesc)}>
            Post your first project in 5 minutes. No credit card, no commitment.
          </p>
          <Link href="/signup?role=client&from=compare">
            <Button variant="primary" size="lg">
              Get Started Free <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
