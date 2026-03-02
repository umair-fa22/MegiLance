// @AI-HINT: Reusable CSS-only animated globe decoration for section backgrounds. Configurable size, position, opacity, and color variant. Used across multiple pages for visual cohesion.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './SectionGlobe.common.module.css';
import lightStyles from './SectionGlobe.light.module.css';
import darkStyles from './SectionGlobe.dark.module.css';

export type GlobeVariant = 'blue' | 'green' | 'purple' | 'orange';
export type GlobeSize = 'sm' | 'md' | 'lg';
export type GlobePosition = 'left' | 'right' | 'center';

interface SectionGlobeProps {
  variant?: GlobeVariant;
  size?: GlobeSize;
  position?: GlobePosition;
  className?: string;
}

const SectionGlobe: React.FC<SectionGlobeProps> = ({
  variant = 'blue',
  size = 'md',
  position = 'right',
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const sizeClass = size === 'sm' ? commonStyles.sizeSm : size === 'lg' ? commonStyles.sizeLg : commonStyles.sizeMd;
  const posClass = position === 'left' ? commonStyles.posLeft : position === 'center' ? commonStyles.posCenter : commonStyles.posRight;
  const variantClass = commonStyles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof commonStyles] || '';

  return (
    <div
      className={cn(commonStyles.globeWrapper, sizeClass, posClass, styles.globeWrapper, className)}
      aria-hidden="true"
    >
      <div className={cn(commonStyles.globe, styles.globe, variantClass)}>
        {/* Connection lines */}
        <div className={cn(commonStyles.connection, commonStyles.conn1, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.conn2, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.conn3, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.conn4, styles.connection)} />

        {/* Orbiting rings with dots */}
        <div className={cn(commonStyles.orbit, commonStyles.orbit1, styles.orbit)}>
          <div className={cn(commonStyles.dot, styles.dot)} />
        </div>
        <div className={cn(commonStyles.orbit, commonStyles.orbit2, styles.orbit)}>
          <div className={cn(commonStyles.dot, styles.dot)} />
        </div>

        {/* Center pulse glow */}
        <div className={cn(commonStyles.pulse, styles.pulse)} />
      </div>
    </div>
  );
};

export default SectionGlobe;
