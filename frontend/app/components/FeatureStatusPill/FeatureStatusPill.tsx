// @AI-HINT: Reusable pill component for displaying feature status indicators with text labels for FYP evaluation clarity

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Check, Zap, Wrench, AlertCircle, Clock, Lock, ShieldCheck } from 'lucide-react';

import commonStyles from './FeatureStatusPill.common.module.css';
import lightStyles from './FeatureStatusPill.light.module.css';
import darkStyles from './FeatureStatusPill.dark.module.css';

export type FeatureStatus = 
  | 'complete'      // Fully implemented and tested
  | 'verified'      // Verified working
  | 'advanced'      // Advanced features with AI/ML
  | 'working'       // Functional but may need polish
  | 'basic'         // Basic implementation
  | 'development'   // In development
  | 'pending'       // Pending implementation
  | 'portal'        // Requires authentication
  | 'incomplete';   // Not started or incomplete

export interface FeatureStatusPillProps {
  status: string; // Allow string to accept data from API/arrays
  showIcon?: boolean;
  showLabel?: boolean;
  compact?: boolean; // If true, shows shorter version
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<string, { 
  label: string; 
  icon: React.ElementType;
  styleKey: string;
}> = {
  complete: { 
    label: 'Complete', 
    icon: Check,
    styleKey: 'complete'
  },
  verified: { 
    label: 'Verified', 
    icon: ShieldCheck,
    styleKey: 'complete'
  },
  advanced: { 
    label: 'Advanced AI', 
    icon: Zap,
    styleKey: 'advanced'
  },
  working: { 
    label: 'Beta', 
    icon: Wrench,
    styleKey: 'working'
  },
  basic: { 
    label: 'Early Access', 
    icon: AlertCircle,
    styleKey: 'basic'
  },
  development: { 
    label: 'Coming Soon', 
    icon: Clock,
    styleKey: 'development'
  },
  pending: { 
    label: 'Coming Soon', 
    icon: Clock,
    styleKey: 'development'
  },
  portal: { 
    label: 'Auth Required', 
    icon: Lock,
    styleKey: 'advanced'
  },
  incomplete: { 
    label: 'Incomplete', 
    icon: AlertCircle,
    styleKey: 'basic'
  },
};

export const FeatureStatusPill: React.FC<FeatureStatusPillProps> = ({
  status,
  showIcon = true,
  showLabel = true,
  compact = false,
  size = 'xs',
  className
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  // Normalize status to lowercase
  const normalizedStatus = status.toLowerCase();
  
  // Get config or default to basic
  const config = statusConfig[normalizedStatus] || statusConfig.basic;
  const IconComponent = config.icon;
  
  // Determine style class
  const styleClass = `status-${config.styleKey}`;

  return (
    <span
      className={cn(
        commonStyles.pill,
        commonStyles[`size-${size}`],
        commonStyles[styleClass], // Fallback if not in theme
        themeStyles.pill,
        themeStyles[styleClass],
        className
      )}
      title={config.label}
    >
      {showIcon && (
        <IconComponent className={commonStyles.icon} size={size === 'md' ? 14 : 12} />
      )}
      {showLabel && (
        <span className={commonStyles.label}>
          {config.label}
        </span>
      )}
    </span>
  );
};

export default FeatureStatusPill;
