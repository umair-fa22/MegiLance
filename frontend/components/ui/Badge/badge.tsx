// @AI-HINT: This file defines a reusable Badge component, fully refactored to use theme-aware CSS Modules. It's designed for displaying statuses, tags, or labels in a visually distinct and consistent manner that aligns with the MegiLance brand guidelines.

import * as React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Badge.common.module.css';
import lightStyles from './Badge.light.module.css';
import darkStyles from './Badge.dark.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const { resolvedTheme } = useTheme();
      const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

    const variantClass = styles[variant] || styles.primary;

    return (
      <div
        ref={ref}
        className={cn(commonStyles.badge, variantClass, className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
