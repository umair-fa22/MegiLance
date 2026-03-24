// @/app/(portal)/client/hire/components/StepIndicator/StepIndicator.tsx
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

import common from './StepIndicator.common.module.css';
import light from './StepIndicator.light.module.css';
import dark from './StepIndicator.dark.module.css';

interface StepIndicatorProps {
  steps: readonly string[];
  currentStep: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const currentIndex = steps.indexOf(currentStep);

  return (
    <nav aria-label="Progress" className={cn(common.nav, themed.nav)}>
      <ol role="list" className={common.list}>
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step} className={cn(common.step, isCurrent && common.current, isCompleted && common.completed)}>
              <div className={cn(common.stepLink, themed.stepLink)} aria-current={isCurrent ? 'step' : undefined}>
                <span className={cn(common.indicator, themed.indicator)}>
                  {isCompleted ? (
                    <Check className={common.checkIcon} />
                  ) : (
                    <span className={cn(common.stepNumber, themed.stepNumber)}>{index + 1}</span>
                  )}
                </span>
                <span className={cn(common.stepName, themed.stepName)}>{step}</span>
              </div>
              {index < steps.length - 1 && <div className={cn(common.separator, themed.separator)} aria-hidden="true" />} 
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepIndicator;
