// @AI-HINT: Premium, theme-aware Toast component with accessible roles, micro-interactions, and per-theme CSS modules.
'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './Toast.common.module.css';
import lightStyles from './Toast.light.module.css';
import darkStyles from './Toast.dark.module.css';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger' | 'error';

export interface ToastProps {
  /** Toast title */
  title?: string;
  /** Toast description/message */
  description?: string;
  /** Whether toast is visible */
  show: boolean;
  /** Visual variant */
  variant?: ToastVariant;
  /** Callback when toast is dismissed */
  onClose?: () => void;
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Additional CSS classes */
  className?: string;
  /** Unique ID for accessibility */
  id?: string;
  /** Pause auto-dismiss on hover */
  pauseOnHover?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  show,
  variant = 'info',
  onClose,
  duration = 4000,
  className = '',
  id,
  pauseOnHover = true,
}) => {
  const generatedId = React.useId();
  const toastId = id ?? generatedId;
  const [isPaused, setIsPaused] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = React.useRef(duration);
  const startRef = React.useRef(Date.now());
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    if (!show || !duration || !onClose || isPaused) return;
    
    startRef.current = Date.now();
    timerRef.current = setTimeout(onClose, remainingRef.current);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show, duration, onClose, isPaused]);

  const handleMouseEnter = () => {
    if (pauseOnHover && timerRef.current) {
      clearTimeout(timerRef.current);
      remainingRef.current -= Date.now() - startRef.current;
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  const baseClassName = cn(
    commonStyles.toast,
    themeStyles.toast,
    commonStyles[variant],
    themeStyles[variant],
    className,
  );

  const content = (
    <>
      <div className={cn(commonStyles.toastBody, themeStyles.toastBody)}>
        {title && <div className={cn(commonStyles.toastTitle, themeStyles.toastTitle)}>{title}</div>}
        {description && (
          <div className={cn(commonStyles.toastDescription, themeStyles.toastDescription)}>{description}</div>
        )}
      </div>
      {onClose && (
        <button
          className={cn(commonStyles.toastClose, themeStyles.toastClose)}
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </>
  );

  return (
    <div
      className={baseClassName}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={variant === 'danger' || variant === 'warning' ? "alert" : "status"}
      aria-live={variant === 'danger' || variant === 'warning' ? "assertive" : "polite"}
      id={toastId}
      aria-atomic="true"
    >
      {content}
    </div>
  );
};

export default Toast;
