// @/app/(portal)/client/hire/components/StepTerms/StepTerms.tsx
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Input from '@/app/components/atoms/Input/Input';
import Select from '@/app/components/molecules/Select/Select';
import { Calendar, DollarSign } from 'lucide-react';

import common from './StepTerms.common.module.css';
import light from './StepTerms.light.module.css';
import dark from './StepTerms.dark.module.css';

const RATE_TYPES = ['Hourly', 'Fixed'] as const;
type RateType = typeof RATE_TYPES[number];

interface StepTermsProps {
  rateType: RateType;
  setRateType: (rateType: RateType) => void;
  rate: string;
  setRate: (rate: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
}

const StepTerms: React.FC<StepTermsProps> = ({ rateType, setRateType, rate, setRate, startDate, setStartDate }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <section className={cn(common.section, themed.section)} aria-labelledby="terms-step-title">
      <h2 id="terms-step-title" className={cn(common.title, themed.title)}>
        Set the Terms
      </h2>
      <p className={cn(common.subtitle, themed.subtitle)}>
        Define the payment rate and project start date.
      </p>
      <div className={cn(common.formGrid)}>
        <Select
          id="rateType"
          label="Rate Type"
          value={rateType}
          onChange={(e) => setRateType(e.target.value as RateType)}
          options={RATE_TYPES.map(rt => ({ value: rt, label: rt }))}
        />
        <Input
          id="rate"
          label={rateType === 'Hourly' ? 'Hourly Rate' : 'Fixed Price'}
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder={rateType === 'Hourly' ? 'e.g., 75' : 'e.g., 5000'}
          iconBefore={<DollarSign size={18} aria-hidden="true" />}
          required
        />
        <Input
          id="startDate"
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          iconBefore={<Calendar size={18} aria-hidden="true" />}
          required
        />
      </div>
    </section>
  );
};

export default StepTerms;
