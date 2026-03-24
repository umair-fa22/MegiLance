// @AI-HINT: This component renders an animated CSS-based globe for the GlobalImpact section to avoid CORS issues.

'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './ImpactGlobe.common.module.css';
import lightStyles from './ImpactGlobe.light.module.css';
import darkStyles from './ImpactGlobe.dark.module.css';

// --- Main Component ---
const ImpactGlobe: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className={commonStyles.globePlaceholder} />;
  }

  return (
    <div className={cn(commonStyles.globeContainer, styles.globeContainer)}>
      <div className={cn(commonStyles.globe, styles.globe)}>
        {/* Connection lines radiating from center */}
        <div className={cn(commonStyles.connection, commonStyles.connection1, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.connection2, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.connection3, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.connection4, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.connection5, styles.connection)} />
        <div className={cn(commonStyles.connection, commonStyles.connection6, styles.connection)} />
        
        {/* Orbiting dots */}
        <div className={cn(commonStyles.orbit, commonStyles.orbit1)}>
          <div className={cn(commonStyles.dot, styles.dot)} />
        </div>
        <div className={cn(commonStyles.orbit, commonStyles.orbit2)}>
          <div className={cn(commonStyles.dot, styles.dot)} />
        </div>
        <div className={cn(commonStyles.orbit, commonStyles.orbit3)}>
          <div className={cn(commonStyles.dot, styles.dot)} />
        </div>
        
        {/* Center pulse */}
        <div className={cn(commonStyles.centerPulse, styles.centerPulse)} />
      </div>
    </div>
  );
};

export default ImpactGlobe;
