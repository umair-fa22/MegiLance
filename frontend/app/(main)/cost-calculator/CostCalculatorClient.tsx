// @AI-HINT: Interactive cost calculator client — lets users input role, hours, compare full-time vs freelance
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronDown, ChevronUp, Calculator, DollarSign, TrendingDown, Users } from 'lucide-react';
import Button from '@/app/components/Button/Button';
import commonStyles from './CostCalculator.common.module.css';
import lightStyles from './CostCalculator.light.module.css';
import darkStyles from './CostCalculator.dark.module.css';

type FAQ = { question: string; answer: string };

const ROLES = [
  { name: 'Full-Stack Developer', ftSalary: 120000, freelanceRate: 65 },
  { name: 'Frontend Developer', ftSalary: 110000, freelanceRate: 55 },
  { name: 'Backend Developer', ftSalary: 115000, freelanceRate: 60 },
  { name: 'UI/UX Designer', ftSalary: 95000, freelanceRate: 50 },
  { name: 'Mobile Developer', ftSalary: 125000, freelanceRate: 70 },
  { name: 'Data Scientist', ftSalary: 140000, freelanceRate: 80 },
  { name: 'DevOps Engineer', ftSalary: 130000, freelanceRate: 70 },
  { name: 'Content Writer', ftSalary: 65000, freelanceRate: 35 },
  { name: 'Graphic Designer', ftSalary: 75000, freelanceRate: 40 },
  { name: 'Project Manager', ftSalary: 100000, freelanceRate: 55 },
];

const OVERHEAD_MULTIPLIER = 1.4; // benefits, taxes, office, equipment

export default function CostCalculatorClient({ faqs }: { faqs: FAQ[] }) {
  const { resolvedTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState(0);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);
  const [weeks, setWeeks] = useState(12);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!resolvedTheme) return null;
  const theme = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const role = ROLES[selectedRole];

  const results = useMemo(() => {
    const ftMonthly = (role.ftSalary * OVERHEAD_MULTIPLIER) / 12;
    const ftTotal = ftMonthly * (weeks / 4.33);
    const freelanceTotal = role.freelanceRate * hoursPerWeek * weeks;
    const upworkRate = role.freelanceRate * 1.15; // Upwork adds ~15% effective cost
    const upworkTotal = upworkRate * hoursPerWeek * weeks;
    const savings = ftTotal - freelanceTotal;
    const savingsPercent = ((savings / ftTotal) * 100).toFixed(0);
    const upworkSavings = upworkTotal - freelanceTotal;

    return { ftTotal, freelanceTotal, upworkTotal, savings, savingsPercent, upworkSavings };
  }, [role, hoursPerWeek, weeks]);

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString();

  return (
    <div className={cn(commonStyles.page, theme.page)}>
      {/* Hero */}
      <section className={cn(commonStyles.hero, theme.hero)}>
        <div className={commonStyles.heroInner}>
          <div className={cn(commonStyles.heroIcon, theme.heroIcon)}><Calculator size={32} /></div>
          <h1 className={cn(commonStyles.heroTitle, theme.heroTitle)}>
            Freelance Cost <span className={cn(commonStyles.gradient, theme.gradient)}>Calculator</span>
          </h1>
          <p className={cn(commonStyles.heroDesc, theme.heroDesc)}>
            See exactly how much you save hiring freelancers on MegiLance vs full-time employees or other platforms
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.inner}>
          <div className={commonStyles.calcGrid}>
            {/* Inputs */}
            <div className={cn(commonStyles.inputPanel, theme.inputPanel)}>
              <h2 className={cn(commonStyles.panelTitle, theme.panelTitle)}>Configure Your Project</h2>

              <label className={cn(commonStyles.label, theme.label)}>Role</label>
              <select
                className={cn(commonStyles.select, theme.select)}
                value={selectedRole}
                onChange={(e) => setSelectedRole(Number(e.target.value))}
              >
                {ROLES.map((r, i) => (
                  <option key={r.name} value={i}>{r.name}</option>
                ))}
              </select>

              <label className={cn(commonStyles.label, theme.label)}>
                Hours per week: <strong>{hoursPerWeek}h</strong>
              </label>
              <input
                type="range"
                min={5}
                max={40}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className={cn(commonStyles.slider, theme.slider)}
              />

              <label className={cn(commonStyles.label, theme.label)}>
                Project duration: <strong>{weeks} weeks</strong>
              </label>
              <input
                type="range"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
                className={cn(commonStyles.slider, theme.slider)}
              />

              <div className={cn(commonStyles.rateInfo, theme.rateInfo)}>
                <span>Avg. freelance rate: <strong>${role.freelanceRate}/hr</strong></span>
                <span>Full-time equivalent: <strong>{fmt(role.ftSalary)}/yr</strong></span>
              </div>
            </div>

            {/* Results */}
            <div className={cn(commonStyles.resultsPanel, theme.resultsPanel)}>
              <h2 className={cn(commonStyles.panelTitle, theme.panelTitle)}>Your Savings</h2>

              <div className={commonStyles.resultCards}>
                <div className={cn(commonStyles.resultCard, theme.resultCardFt)}>
                  <Users size={20} />
                  <span className={commonStyles.resultLabel}>Full-Time Cost</span>
                  <span className={cn(commonStyles.resultValue, theme.resultValueFt)}>{fmt(results.ftTotal)}</span>
                </div>
                <div className={cn(commonStyles.resultCard, theme.resultCardUpwork)}>
                  <DollarSign size={20} />
                  <span className={commonStyles.resultLabel}>Upwork Cost</span>
                  <span className={cn(commonStyles.resultValue, theme.resultValueUpwork)}>{fmt(results.upworkTotal)}</span>
                </div>
                <div className={cn(commonStyles.resultCard, theme.resultCardMgl)}>
                  <TrendingDown size={20} />
                  <span className={commonStyles.resultLabel}>MegiLance Cost</span>
                  <span className={cn(commonStyles.resultValue, theme.resultValueMgl)}>{fmt(results.freelanceTotal)}</span>
                </div>
              </div>

              <div className={cn(commonStyles.savingsBox, theme.savingsBox)}>
                <div className={cn(commonStyles.savingsTitle, theme.savingsTitle)}>You Save</div>
                <div className={cn(commonStyles.savingsAmount, theme.savingsAmount)}>
                  {fmt(results.savings)}
                </div>
                <div className={cn(commonStyles.savingsPercent, theme.savingsPercent)}>
                  {results.savingsPercent}% less than full-time hire
                </div>
                {results.upworkSavings > 0 && (
                  <div className={cn(commonStyles.upworkSaving, theme.upworkSaving)}>
                    + {fmt(results.upworkSavings)} more vs Upwork (0% commission)
                  </div>
                )}
              </div>

              <Link href="/post-project">
                <Button variant="primary" size="lg" fullWidth>
                  Start Saving — Post a Project Free <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={cn(commonStyles.section, theme.section)}>
        <div className={commonStyles.inner}>
          <h2 className={cn(commonStyles.sectionTitle, theme.sectionTitle)}>Frequently Asked Questions</h2>
          <div className={commonStyles.faqList}>
            {faqs.map((faq, i) => (
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
    </div>
  );
}
