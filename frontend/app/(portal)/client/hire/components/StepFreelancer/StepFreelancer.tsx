// @/app/(portal)/client/hire/components/StepFreelancer/StepFreelancer.tsx
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Input from '@/app/components/Input/Input';
import { UserSearch } from 'lucide-react';

import common from './StepFreelancer.common.module.css';
import light from './StepFreelancer.light.module.css';
import dark from './StepFreelancer.dark.module.css';

interface StepFreelancerProps {
  freelancerId: string;
  setFreelancerId: (id: string) => void;
  // In a real app, this would likely take a list of freelancers to search through.
}

const StepFreelancer: React.FC<StepFreelancerProps> = ({ freelancerId, setFreelancerId }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <section className={cn(common.section, themed.section)} aria-labelledby="freelancer-step-title">
      <h2 id="freelancer-step-title" className={cn(common.title, themed.title)}>
        Select a Freelancer
      </h2>
      <p className={cn(common.subtitle, themed.subtitle)}>
        Find the freelancer you want to hire. You can find their ID on their profile page.
      </p>
      <div className={common.inputWrapper}>
        <Input
          id="freelancerId"
          label="Freelancer ID"
          value={freelancerId}
          onChange={(e) => setFreelancerId(e.target.value)}
          placeholder="Enter Freelancer ID, e.g., 'f-12345'"
          iconBefore={<UserSearch size={18} aria-hidden="true" />}
          required
          aria-describedby="freelancer-id-help"
        />
        <p id="freelancer-id-help" className={cn(common.helpText, themed.helpText)}>
          The freelancer ID is required to proceed.
        </p>
      </div>
    </section>
  );
};

export default StepFreelancer;
