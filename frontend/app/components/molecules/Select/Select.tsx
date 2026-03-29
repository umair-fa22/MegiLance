// @AI-HINT: A reusable, theme-aware Select component for consistent form styling across the application.
'use client';

import React, { useId, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import commonStyles from './Select.common.module.css';
import lightStyles from './Select.light.module.css';
import darkStyles from './Select.dark.module.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  id?: string;
  label?: string;
  hideLabel?: boolean;
  options: SelectOption[];
  fullWidth?: boolean;
  error?: string;
  helpText?: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ 
  id: providedId, 
  label, 
  hideLabel = false,
  options, 
  fullWidth = false, 
  error,
  helpText,
  placeholder,
  className, 
  required,
  disabled,
  ...props 
}) => {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const { resolvedTheme } = useTheme();
  
  const themeStyles = useMemo(() => {
    return resolvedTheme === 'dark' ? darkStyles : lightStyles;
  }, [resolvedTheme]);

  // Don't render until theme is resolved to prevent flash
  if (!resolvedTheme) {
    return null;
  }

  const hasError = !!error;
  const errorId = hasError ? `${id}-error` : undefined;
  const helpId = !hasError && helpText ? `${id}-help` : undefined;

  const containerClasses = cn(
    commonStyles.container,
    themeStyles.container,
    fullWidth && commonStyles.fullWidth,
    hasError && commonStyles.hasError,
    disabled && commonStyles.disabled,
    className
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={id} 
          className={cn(
            commonStyles.label, 
            themeStyles.label,
            hideLabel && commonStyles.visuallyHidden
          )}
        >
          {label}
          {required && <span className={commonStyles.required} aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={cn(commonStyles.selectWrapper, themeStyles.selectWrapper)}>
        <select 
          id={id} 
          className={cn(commonStyles.select, themeStyles.select)}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={errorId ?? helpId}
          aria-required={required}
          aria-label={hideLabel && label ? label : undefined}
          disabled={disabled}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className={cn(commonStyles.chevron, themeStyles.chevron)} aria-hidden="true" />
      </div>
      {hasError && (
        <p id={errorId} className={cn(commonStyles.errorMessage, themeStyles.errorMessage)} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
      {!hasError && helpText && (
        <p id={helpId} className={cn(commonStyles.helpText, themeStyles.helpText)}>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default Select;
