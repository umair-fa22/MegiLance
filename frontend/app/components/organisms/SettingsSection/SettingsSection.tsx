// @AI-HINT: A reusable wrapper for settings sections, providing a consistent layout with a header and footer for actions.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import common from './SettingsSection.common.module.css';
import light from './SettingsSection.light.module.css';
import dark from './SettingsSection.dark.module.css';

export interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children, footerContent }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <section className={cn(common.section, themed.theme)}>
      <div className={common.header}>
        <h2 className={common.title}>{title}</h2>
        <p className={common.description}>{description}</p>
      </div>
      <div className={common.content}>
        {children}
      </div>
      {footerContent && (
        <div className={common.footer}>
          {footerContent}
        </div>
      )}
    </section>
  );
};

export default SettingsSection;
