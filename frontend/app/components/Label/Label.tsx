// @AI-HINT: Theme-aware Label component. Keep labels consistent across forms.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import common from './Label.common.module.css';
import light from './Label.light.module.css';
import dark from './Label.dark.module.css';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredMark?: boolean;
}

export const Label: React.FC<LabelProps> = ({ className = '', requiredMark = false, children, ...props }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  return (
    <label {...props} className={cn(common.label, themed.label, className)}>
      {children}
      {requiredMark && <span className={cn(common.required, themed.required)} aria-hidden>*</span>}
    </label>
  );
};

export default Label;
