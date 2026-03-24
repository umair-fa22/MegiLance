// @AI-HINT: Visual indicator showing the current step in the proposal submission flow.
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
    <div className={cn(common.container, themed.container)}>
      <div className={common.steps}>
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div 
              key={step} 
              className={cn(
                common.step,
                themed.step,
                isCompleted && common.completed,
                isCompleted && themed.completed,
                isCurrent && common.current,
                isCurrent && themed.current
              )}
            >
              <div className={cn(
                common.stepIcon,
                themed.stepIcon,
                isCompleted && common.completedIcon,
                isCompleted && themed.completedIcon,
                isCurrent && common.currentIcon,
                isCurrent && themed.currentIcon
              )}>
                {isCompleted ? (
                  <Check size={16} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={cn(
                common.stepLabel,
                themed.stepLabel,
                isCompleted && common.completedLabel,
                isCompleted && themed.completedLabel,
                isCurrent && common.currentLabel,
                isCurrent && themed.currentLabel
              )}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className={cn(
                  common.connector,
                  themed.connector,
                  isCompleted && common.completedConnector,
                  isCompleted && themed.completedConnector
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
