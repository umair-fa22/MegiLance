// @AI-HINT: This is a versatile, enterprise-grade Button component for all user actions. It supports multiple variants (primary, secondary), sizes, loading/disabled states, and icons. All styles are per-component only.

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';

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
  magnetic?: boolean;
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
  magnetic = true,
  type = 'button',
  ...props
}: ButtonProps<C> & { type?: 'button' | 'submit' | 'reset' }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const BaseComponent = (as || 'button') as React.ElementType;
  const MotionComponent = motion.create(BaseComponent);
  const isButton = !as || as === 'button';

  useEffect(() => setMounted(true), []);

  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Magnetic effect variables
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Springy magnetic bounds
  const x = useSpring(mouseX, { stiffness: 150, damping: 15, mass: 0.1 });
  const y = useSpring(mouseY, { stiffness: 150, damping: 15, mass: 0.1 });

  // Shine & glow tracking
  const overflowX = useMotionValue(0);
  const overflowY = useMotionValue(0);
  const shineBackground = useMotionTemplate`radial-gradient(circle at ${overflowX}px ${overflowY}px, rgba(255, 255, 255, 0.4) 0%, transparent 60%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isLoading || props.disabled || !buttonRef.current) return;
    
    // Magnetic pull
    if (magnetic) {
      const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
      const hw = width / 2;
      const hh = height / 2;
      const rx = e.clientX - left - hw;
      const ry = e.clientY - top - hh;
      mouseX.set(rx * 0.2); // 20% pull ratio
      mouseY.set(ry * 0.2);
    }
    
    // Shine effect
    const { left, top } = buttonRef.current.getBoundingClientRect();
    overflowX.set(e.clientX - left);
    overflowY.set(e.clientY - top);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    overflowX.set(-200); // Send shine away
    overflowY.set(-200);
  };

  // Default to light theme during SSR, will hydrate correctly on client
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // normalize legacy size values
  const normalizedSize: 'sm' | 'md' | 'lg' | 'icon' =
    size === 'small' ? 'sm' : size === 'medium' ? 'md' : size === 'large' ? 'lg' : (size as 'sm' | 'md' | 'lg' | 'icon');

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
    <MotionComponent
      ref={buttonRef}
      style={{
        x: magnetic && !isLoading && !props.disabled ? x : 0,
        y: magnetic && !isLoading && !props.disabled ? y : 0,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileHover={!isLoading && !props.disabled ? { scale: 1.02 } : {}}
      whileTap={!isLoading && !props.disabled ? { scale: 0.96 } : {}}
      className={cn(
        commonStyles.button,
        // Support both prefixed and non-prefixed variant and size class names
        commonStyles[`variant-${variant}`],
        (commonStyles as any)[variant],
        commonStyles[`size-${normalizedSize}`],
        // legacy, in case any stylesheet references .small/.medium/.large directly
        (commonStyles as any)[size as string],
        mounted ? themeStyles.button : '',
        mounted ? themeStyles[`variant-${variant}`] : '',
        mounted ? (themeStyles as any)[variant] : '',
        mounted ? themeStyles[`size-${normalizedSize}`] : '',
        mounted && provider ? themeStyles[`provider-${provider}`] : '',
        isLoading && commonStyles.loading,
        isLoading && mounted ? themeStyles.loading : '',
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
      <motion.div 
        className={commonStyles.interactiveShine} 
        style={{ background: shineBackground }} 
      />
      {isLoading && <Loader2 className={cn(commonStyles.spinner, themeStyles.spinner, commonStyles.loadingIcon)} />}
      {iconBefore && !isLoading && <span className={commonStyles.iconBefore} aria-hidden="true">{iconBefore}</span>}
      <span className={cn(commonStyles.buttonText, mounted ? themeStyles.buttonText : '', isLoading && commonStyles.loadingText)}>
        {children}
      </span>
      {iconAfter && !isLoading && <span className={commonStyles.iconAfter} aria-hidden="true">{iconAfter}</span>}
    </MotionComponent>
  );
};

export default Button;
