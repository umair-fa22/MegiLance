// @AI-HINT: This is a reusable, theme-aware, and accessible toggle switch component for forms.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './ToggleSwitch.common.module.css';
import lightStyles from './ToggleSwitch.light.module.css';
import darkStyles from './ToggleSwitch.dark.module.css';

interface ToggleSwitchProps {
  label: string;
  id: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (val: boolean) => void;
  helpText?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, id, defaultChecked, checked, onChange, helpText }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  return (
    <div className={cn(styles.wrapper)}>
      <div className={cn(styles.toggleWrapper)}>
        <label htmlFor={id} className={cn(styles.label)}>
          {label}
        </label>
        <div className={cn(styles.switchContainer)}>
          <input
            type="checkbox"
            id={id}
            className={cn(styles.input)}
            {...(checked !== undefined
              ? { checked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked), 'aria-checked': checked, role: 'switch' }
              : { defaultChecked, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked) })}
          />
          <div className={cn(styles.slider)}></div>
        </div>
      </div>
      {helpText && <p className={cn(styles.helpText)}>{helpText}</p>}
    </div>
  );
};

export default ToggleSwitch;
