// @AI-HINT: This is an Alert component, an atomic element for displaying prominent messages to the user.
'use client';

import React from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Alert.common.module.css';
import lightStyles from './Alert.light.module.css';
import darkStyles from './Alert.dark.module.css';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  /** Alert title - required for accessibility */
  title: string;
  /** Alert content */
  children: React.ReactNode;
  /** Visual variant affecting color and icon */
  variant?: AlertVariant;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Unique ID for accessibility - auto-generated if not provided */
  id?: string;
}

const ICONS: { [key: string]: React.ReactNode } = {
  info: <Info size={18} />,
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  danger: <XCircle size={18} />,
};

const Alert: React.FC<AlertProps> = ({
  title,
  children,
  variant = 'info',
  onClose,
  className = '',
  id,
}) => {
  const generatedId = React.useId();
  const alertId = id ?? generatedId;
  const titleId = `${alertId}-title`;
  const descId = `${alertId}-desc`;
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Return null or a skeleton if the theme isn't loaded yet

  // Use assertive for danger/warning, polite for info/success
  const ariaLive = variant === 'danger' || variant === 'warning' ? 'assertive' : 'polite';

  return (
    <div 
      id={alertId}
      className={cn(
        commonStyles.alert,
        themeStyles.alert,
        commonStyles[variant],
        themeStyles[variant],
        className
      )} 
      role="alert"
      aria-live={ariaLive}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className={cn(commonStyles.alertIcon, themeStyles.alertIcon)} aria-hidden="true">{ICONS[variant]}</div>
      <div className={cn(commonStyles.alertContent, themeStyles.alertContent)}>
        <h3 id={titleId} className={cn(commonStyles.alertTitle, themeStyles.alertTitle)}>{title}</h3>
        <div id={descId} className={cn(commonStyles.alertDescription, themeStyles.alertDescription)}>{children}</div>
      </div>
      {onClose && (
        <button 
          type="button"
          onClick={onClose} 
          className={cn(commonStyles.alertCloseButton, themeStyles.alertCloseButton)} 
          aria-label={`Close ${variant} alert: ${title}`}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default Alert;
