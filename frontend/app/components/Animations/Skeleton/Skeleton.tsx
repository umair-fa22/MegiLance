// @AI-HINT: Premium skeleton loader component with per-component CSS modules for loading placeholders
'use client';

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import styles from './Skeleton.common.module.css';
import light from './Skeleton.light.module.css';
import dark from './Skeleton.dark.module.css';

export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  lines?: number;
  inline?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
};

export default function Skeleton({ width, height = 14, radius = 8, lines = 1, inline = false, theme: themeProp, className }: SkeletonProps) {
  const { resolvedTheme } = useTheme();
  const currentTheme = themeProp || resolvedTheme;
  const themeClass = currentTheme === 'dark' ? dark.theme : light.theme;

  const items = Array.from({ length: Math.max(1, lines) });

  return (
    <div className={cn(styles.container, themeClass, inline && styles.inline, className)} aria-hidden>
      {items.map((_, i) => (
        <div 
          key={i} 
          className={styles.block} 
          data-width={typeof width === 'number' ? `${width}px` : width}
          data-height={typeof height === 'number' ? `${height}px` : height}
          data-radius={typeof radius === 'number' ? `${radius}px` : radius}
        />
      ))}
    </div>
  );
}
