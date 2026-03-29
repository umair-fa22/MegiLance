// @AI-HINT: This component provides a consistent, reusable structure for a single notification setting, combining a label, description, and a toggle switch.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import ToggleSwitch from '@/app/components/atoms/ToggleSwitch/ToggleSwitch';

import commonStyles from './NotificationOption.common.module.css';
import lightStyles from './NotificationOption.light.module.css';
import darkStyles from './NotificationOption.dark.module.css';

interface NotificationOptionProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NotificationOption: React.FC<NotificationOptionProps> = ({ id, title, description, checked, onChange }) => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.container, styles.container)}>
      <div className={commonStyles.textContainer}>
        <label htmlFor={id} className={cn(commonStyles.title, styles.title)}>
          {title}
        </label>
        <p className={cn(commonStyles.description, styles.description)}>
          {description}
        </p>
      </div>
      <div className={commonStyles.toggleContainer}>
        <ToggleSwitch id={id} label={title} checked={checked} onChange={onChange} />
      </div>
    </div>
  );
};

export default NotificationOption;
