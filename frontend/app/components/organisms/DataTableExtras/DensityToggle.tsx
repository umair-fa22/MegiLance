// @AI-HINT: Density toggle for table row spacing (comfortable/compact).
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './DensityToggle.common.module.css';
import lightStyles from './DensityToggle.light.module.css';
import darkStyles from './DensityToggle.dark.module.css';

export type Density = 'comfortable' | 'compact' | 'standard';

interface DensityToggleProps {
  value: Density;
  onChange: (d: Density) => void;
}

const DensityToggle: React.FC<DensityToggleProps> = ({ value, onChange }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => (resolvedTheme === 'dark' ? { ...commonStyles, ...darkStyles } : { ...commonStyles, ...lightStyles }), [resolvedTheme]);
  return (
    <div className={styles.group} role="group" aria-label="Row density" title="Row density">
      <button
        type="button"
        className={styles.button}
        {...(value === 'comfortable' ? { 'aria-pressed': 'true' } : {})}
        aria-label="Set comfortable density"
        title="Comfortable row density"
        onClick={() => onChange('comfortable')}
      >Comfortable</button>
      <button
        type="button"
        className={styles.button}
        {...(value === 'compact' ? { 'aria-pressed': 'true' } : {})}
        aria-label="Set compact density"
        title="Compact row density"
        onClick={() => onChange('compact')}
      >Compact</button>
      <span aria-live="polite" className={styles.srOnly}>Row density {value}</span>
    </div>
  );
};

export default DensityToggle;
