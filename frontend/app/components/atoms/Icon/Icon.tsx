// @AI-HINT: Atom level Icon component wrapping lucide-react with standard sizing and variants. Follows the 3-file CSS module rule.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { LucideIcon, icons } from 'lucide-react';

import commonStyles from './Icon.common.module.css';
import lightStyles from './Icon.light.module.css';
import darkStyles from './Icon.dark.module.css';

export type IconName = keyof typeof icons;
export type IconColor = 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error' | 'inverse';

export interface IconProps extends React.SVGAttributes<SVGElement> {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: IconColor | 'currentColor';
  strokeWidth?: number;
  className?: string;
  animate?: boolean;
}

const SEMANTIC_COLORS: IconColor[] = ['primary', 'secondary', 'muted', 'success', 'warning', 'error', 'inverse'];

const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  animate = false,
  ...props
}) => {
  const { resolvedTheme } = useTheme();
  const LucideComponent = icons[name] as LucideIcon;
  
  if (!LucideComponent) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Icon "${name}" not found in lucide-react`);
    }
    return null;
  }

  const sizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };
  
  const pixelSize = typeof size === 'number' ? size : sizes[size];
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const isSemanticColor = SEMANTIC_COLORS.includes(color as IconColor);

  const classes = cn(
    commonStyles.icon,
    animate && commonStyles.animate,
    isSemanticColor && themeStyles[`color-${color}`],
    className
  );

  return (
    <LucideComponent
      width={pixelSize}
      height={pixelSize}
      strokeWidth={strokeWidth}
      className={classes}
      style={!isSemanticColor && color !== 'currentColor' ? { color } : undefined}
      {...props}
    />
  );
};

export default Icon;