// @AI-HINT: Typography component implementing consistent text styles with predefined semantic variants. Follows the 3-file CSS module rule.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

import commonStyles from './Typography.common.module.css';
import lightStyles from './Typography.light.module.css';
import darkStyles from './Typography.dark.module.css';

type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'overline';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
type Align = 'left' | 'center' | 'right' | 'justify';
type Color = 'primary' | 'secondary' | 'muted' | 'error' | 'success' | 'warning' | 'inverse';

export interface TypographyProps<E extends React.ElementType = React.ElementType> {
  as?: E;
  variant?: Variant;
  weight?: Weight;
  align?: Align;
  color?: Color;
  truncate?: boolean;
  gutterBottom?: boolean;
  className?: string;
  children: React.ReactNode;
  animate?: boolean;
}

const variantToElement: Record<Variant, React.ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

const Typography = <C extends React.ElementType = 'p'>({
  as,
  variant = 'body1',
  weight,
  align = 'left',
  color = 'primary',
  truncate = false,
  gutterBottom = false,
  className = '',
  children,
  animate = false,
  ...props
}: TypographyProps<C> & Omit<React.ComponentProps<C>, keyof TypographyProps<C>>) => {
  const { resolvedTheme } = useTheme();
  
  const Component = as || variantToElement[variant] || 'p';
  const MotionComponent = animate ? motion.create(Component) : Component;
  
  // Theme check (hydration)
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const classes = cn(
    commonStyles.typography,
    commonStyles[`variant-${variant}`],
    weight && commonStyles[`weight-${weight}`],
    commonStyles[`align-${align}`],
    truncate && commonStyles.truncate,
    gutterBottom && commonStyles.gutterBottom,
    themeStyles[`color-${color}`],
    className
  );

  return (
    <MotionComponent
      className={classes}
      {...(animate ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 }
      } : {})}
      {...props}
    >
      {children}
    </MotionComponent>
  );
};

export default Typography;