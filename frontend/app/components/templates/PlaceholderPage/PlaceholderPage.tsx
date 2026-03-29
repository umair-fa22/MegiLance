// @AI-HINT: This is a reusable, fully theme-aware placeholder component for pages that are under construction. It uses a modern, multi-file CSS module structure with CSS variables to ensure perfect theme alignment.

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './PlaceholderPage.common.module.css';
import lightStyles from './PlaceholderPage.light.module.css';
import darkStyles from './PlaceholderPage.dark.module.css';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  className?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, className }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.placeholderPage, themeStyles.placeholderPage, className)}>
      <div className={commonStyles.content}>
        <h1 className={commonStyles.title}>{title}</h1>
        <p className={commonStyles.description}>
          {description || 'This page is under construction. Content will be added soon.'}
        </p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
