/* AI-HINT: This component provides a stylish, accessible toggle switch for users to select between monthly and yearly billing options. It manages its own state and provides a callback for parent components to react to changes. */

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './BillingToggle.common.module.css';
import lightStyles from './BillingToggle.light.module.css';
import darkStyles from './BillingToggle.dark.module.css';

interface BillingToggleProps {
  billingCycle: 'monthly' | 'yearly';
  setBillingCycle: (cycle: 'monthly' | 'yearly') => void;
}

export const BillingToggle: React.FC<BillingToggleProps> = ({ billingCycle, setBillingCycle }) => {
  const { resolvedTheme } = useTheme();
  if (!resolvedTheme) return null;

  const isYearly = billingCycle === 'yearly';
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const handleToggle = () => {
    setBillingCycle(isYearly ? 'monthly' : 'yearly');
  };

  return (
    <div className={cn(commonStyles.toggleWrapper, themeStyles.theme)}>
      <label 
        className={cn(commonStyles.toggleLabel, themeStyles.toggleLabel, !isYearly && commonStyles.toggleLabelActive, !isYearly && themeStyles.toggleLabelActive)}
        onClick={() => setBillingCycle('monthly')}
      >
        Monthly
      </label>
      <div className={commonStyles.toggle} onClick={handleToggle}>
        <input
          type="checkbox"
          id="billing-toggle"
          className={commonStyles.toggleCheckbox}
          checked={isYearly}
          onChange={handleToggle}
          aria-label="Toggle billing cycle"
        />
        <label htmlFor="billing-toggle" className={cn(commonStyles.toggleSlider, themeStyles.toggleSlider)}></label>
      </div>
      <label 
        className={cn(commonStyles.toggleLabel, themeStyles.toggleLabel, isYearly && commonStyles.toggleLabelActive, isYearly && themeStyles.toggleLabelActive)}
        onClick={() => setBillingCycle('yearly')}
      >
        Yearly
      </label>
      <div className={cn(commonStyles.toggleDiscount, themeStyles.toggleDiscount)}>
        Save 20%
      </div>
    </div>
  );
};
