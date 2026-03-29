// @AI-HINT: Premium, theme-aware EmptyState component with icon/illustration slot, Lottie animation support, and CTA.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { LottieAnimation } from '@/app/components/Animations/LottieAnimation';

import commonStyles from './EmptyState.common.module.css';
import lightStyles from './EmptyState.light.module.css';
import darkStyles from './EmptyState.dark.module.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  /** Lottie animation data object - shown above the title as an animated illustration */
  animationData?: Record<string, unknown>;
  /** Width of the Lottie animation (default: 180) */
  animationWidth?: number;
  /** Height of the Lottie animation (default: 180) */
  animationHeight?: number;
  title: string;
  description?: string;
  action?: React.ReactNode; // e.g., a Button
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, animationData, animationWidth = 180, animationHeight = 180, title, description, action, className }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.wrapper, themeStyles.wrapper, className)} aria-live="polite">
      {animationData && (
        <LottieAnimation
          animationData={animationData}
          width={animationWidth}
          height={animationHeight}
          ariaLabel={title}
          className="mx-auto mb-2"
        />
      )}
      {icon && !animationData && <div className={cn(commonStyles.iconWrap, themeStyles.iconWrap)}>{icon}</div>}
      <h3 className={cn(commonStyles.title, themeStyles.title)}>{title}</h3>
      {description && <p className={cn(commonStyles.description, themeStyles.description)}>{description}</p>}
      {action && <div className={cn(commonStyles.action, themeStyles.action)}>{action}</div>}
    </section>
  );
};

export default EmptyState;
