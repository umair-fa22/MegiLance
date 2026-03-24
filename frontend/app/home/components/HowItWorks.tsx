// @AI-HINT: A section explaining the platform's process for both freelancers and clients, designed for clarity and visual appeal.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Search, ClipboardList, Users, FileSignature } from 'lucide-react'
import { cn } from '@/lib/utils';

import StepCard from './StepCard';
import type { StepCardProps } from './StepCard';
import { LottieAnimation, workflowAnimation } from '@/app/components/Animations/LottieAnimation';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';
import commonStyles from './HowItWorks.common.module.css';
import lightStyles from './HowItWorks.light.module.css';
import darkStyles from './HowItWorks.dark.module.css';

const steps: Array<Omit<StepCardProps, 'stepNumber' | 'type'>> = [
  {
    icon: <ClipboardList />,
    title: '1. Post a Job (as a Client)',
    description: 'Define your project, scope, and budget. Our platform makes it easy to create a comprehensive job post that attracts the right talent.',
  },
  {
    icon: <Search />,
    title: '2. Find Work (as a Freelancer)',
    description: 'Create a polished profile and browse projects that match your skills. Our smart matching system helps you find the perfect opportunity.',
  },
  {
    icon: <Users />,
    title: '3. Hire & Collaborate',
    description: 'Clients review proposals and hire the best fit. Freelancers and clients collaborate seamlessly using our built-in tools.',
  },
  {
    icon: <FileSignature />,
    title: '4. Manage & Get Paid',
    description: 'Track milestones and manage deliverables. Our secure payment system ensures freelancers get paid on time, every time.',
  },
];

const HowItWorks: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.howItWorks, themeStyles.howItWorks)}>
      <SectionGlobe variant="blue" size="lg" position="left" />
      <div className={cn(commonStyles.container)}>
        <div className={cn(commonStyles.header)}>
          <span className={cn(commonStyles.tagline, themeStyles.tagline)}>The Process</span>
          <LottieAnimation
            animationData={workflowAnimation}
            width={120}
            height={120}
            ariaLabel="Workflow process illustration"
            className="mx-auto mb-2"
          />
          <h2 className={cn(commonStyles.title, themeStyles.title)}>How MegiLance Works</h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            A simple, streamlined process for clients and freelancers to connect, collaborate, and achieve great things.
          </p>
        </div>
        <div className={cn(commonStyles.timeline)}>
          {steps.map((step, index) => (
            <StepCard
              key={step.title}
              stepNumber={index + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
              type={index % 2 === 0 ? 'client' : 'freelancer'}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
