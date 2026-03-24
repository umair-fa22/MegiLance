// @AI-HINT: This is a versatile, enterprise-grade Button component for all user actions. It supports multiple variants (primary, secondary), sizes, loading/disabled states, and icons. All styles are per-component only.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

import commonStyles from './Button.common.module.css';
import lightStyles from './Button.light.module.css';
import darkStyles from './Button.dark.module.css';

// Base props for the button, independent of the element type
export interface ButtonOwnProps<E extends React.ElementType = React.ElementType> {
  as?: E;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'success' | 'warning' | 'social' | 'outline';
  // supports legacy size names for backwards-compat
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'small' | 'medium' | 'large';
  isLoading?: boolean;
  fullWidth?: boolean;
  provider?: 'google' | 'github';
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// Combined props including standard HTML attributes
export type ButtonProps<C extends React.ElementType = 'button'> = ButtonOwnProps<C> & Omit<React.ComponentProps<C>, keyof ButtonOwnProps<C>>;

const Button = <C extends React.ElementType = 'button'>({
  children,
  as,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  iconBefore,
  iconAfter,
  provider,
  className = '',
  onClick,
  type = 'button',
  ...props
}: ButtonProps<C> & { type?: 'button' | 'submit' | 'reset' }) => {
  const { resolvedTheme } = useTheme();
  const Component = (as || 'button') as React.ElementType;
  const isButton = !as || as === 'button';

  // Always render to avoid hydration mismatch
  // Default to light theme during SSR, will hydrate correctly on client
  
  // normalize legacy size values
  const normalizedSize: 'sm' | 'md' | 'lg' | 'icon' =
    size === 'small' ? 'sm' : size === 'medium' ? 'md' : size === 'large' ? 'lg' : (size as 'sm' | 'md' | 'lg' | 'icon');

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Handle click with loading state
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || props.disabled) return;
    onClick?.(e);
  };

  // Generate accessible label for icon-only buttons (prefer explicit aria-label, fallback to title)
  const ariaFromProps = (props as unknown as { ['aria-label']?: string })['aria-label'];
  const titleFromProps = (props as unknown as { title?: string }).title;
  const accessibleLabel = (!children && (iconBefore || iconAfter)) ? (ariaFromProps ?? titleFromProps) : undefined;

  return (
    <Component
      className={cn(
        commonStyles.button,
        // Support both prefixed and non-prefixed variant and size class names
        commonStyles[`variant-${variant}`],
        (commonStyles as any)[variant],
        commonStyles[`size-${normalizedSize}`],
        // legacy, in case any stylesheet references .small/.medium/.large directly
        (commonStyles as any)[size as string],
        themeStyles.button,
        themeStyles[`variant-${variant}`],
        (themeStyles as any)[variant],
        themeStyles[`size-${normalizedSize}`],
        provider && themeStyles[`provider-${provider}`],
        isLoading && commonStyles.loading,
        isLoading && themeStyles.loading,
        fullWidth && commonStyles.fullWidth,
        className
      )}
      {...(isButton ? { type } : {})}
      disabled={isLoading || props.disabled}
      onClick={handleClick}
      aria-label={accessibleLabel}
      aria-busy={isLoading ? 'true' : undefined}
      aria-disabled={props.disabled ? 'true' : undefined}
      {...props}
    >
      {isLoading && <Loader2 className={cn(commonStyles.spinner, themeStyles.spinner, commonStyles.loadingIcon)} />}
      {iconBefore && !isLoading && <span className={commonStyles.iconBefore} aria-hidden="true">{iconBefore}</span>}
      <span className={cn(commonStyles.buttonText, themeStyles.buttonText, isLoading && commonStyles.loadingText)}>
        {children}
      </span>
      {iconAfter && !isLoading && <span className={commonStyles.iconAfter} aria-hidden="true">{iconAfter}</span>}
    </Component>
  );
};

export default Button;
