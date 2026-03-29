// @AI-HINT: This is a reusable Checkbox component. It is designed to be themeable and accessible.
'use client';
import React, { useId, useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import commonStyles from './Checkbox.common.module.css';
import lightStyles from './Checkbox.light.module.css';
import darkStyles from './Checkbox.dark.module.css';

export interface CheckboxProps {
  id?: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
  error?: string;
  helpText?: string;
  className?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  required?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ 
  id: providedId, 
  name, 
  checked, 
  onChange, 
  children, 
  error, 
  helpText,
  className = '',
  disabled = false,
  indeterminate = false,
  required = false
}) => {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Handle mounted state for hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle indeterminate state (can only be set via JavaScript)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
  
  // Use consistent theme during SSR to prevent hydration mismatch
  const effectiveTheme = mounted ? (resolvedTheme ?? 'dark') : 'dark';
  
  const themeStyles = effectiveTheme === 'light' ? lightStyles : darkStyles;
  const hasError = !!error;
  const errorId = hasError ? `${id}-error` : undefined;
  const helpId = !hasError && helpText ? `${id}-help` : undefined;
  
  return (
    <div className={cn(commonStyles.checkboxWrapper, themeStyles.checkboxWrapper, className)}>
      <label 
        className={cn(
          commonStyles.checkboxLabel, 
          themeStyles.checkboxLabel,
          disabled && commonStyles.disabled
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          name={name}
          className={cn(commonStyles.checkboxInput, themeStyles.checkboxInput)}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={errorId ?? helpId}
          aria-required={required}
        />
        <span 
          className={cn(
            commonStyles.checkboxCustom, 
            themeStyles.checkboxCustom,
            indeterminate && commonStyles.indeterminate,
            hasError && commonStyles.hasError
          )}
          aria-hidden="true"
        />
        <span className={cn(commonStyles.checkboxText, themeStyles.checkboxText)}>
          {children}
          {required && <span className={commonStyles.required} aria-hidden="true"> *</span>}
        </span>
      </label>
      {hasError && (
        <p id={errorId} className={cn(commonStyles.checkboxError, themeStyles.checkboxError)} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
      {!hasError && helpText && (
        <p id={helpId} className={cn(commonStyles.checkboxHelpText, themeStyles.checkboxHelpText)}>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default Checkbox;
