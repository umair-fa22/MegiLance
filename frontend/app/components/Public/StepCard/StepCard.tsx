// @AI-HINT: This component displays a single, theme-aware step in a process, such as on a 'How It Works' page. It uses global CSS variables for base styling with theme-specific overrides.
'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import commonStyles from './StepCard.common.module.css';
import lightStyles from './StepCard.light.module.css';
import darkStyles from './StepCard.dark.module.css';

export interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, description, icon, className }) => {
  return (
    <div className={cn(commonStyles.stepCardContainer, className)}>
      <div className={commonStyles.header}>
        <div className={commonStyles.iconWrapper}>
          {icon}
        </div>
        <div className={commonStyles.number}>{stepNumber}</div>
      </div>
      <div className={commonStyles.content}>
        <h3 className={commonStyles.title}>{title}</h3>
        <p className={commonStyles.description}>{description}</p>
      </div>
    </div>
  );
};

export default StepCard;
