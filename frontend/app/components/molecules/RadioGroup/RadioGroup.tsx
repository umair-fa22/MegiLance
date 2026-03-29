// @AI-HINT: Accessible theme-aware RadioGroup component for single-option selection in forms
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import common from './RadioGroup.common.module.css';
import light from './RadioGroup.light.module.css';
import dark from './RadioGroup.dark.module.css';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  name?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ label, options, selectedValue, onChange, name }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <fieldset className={common.fieldset}>
      <legend className={cn(common.legend, themed.legend)}>{label}</legend>
      <div className={common.options_container}>
        {options.map((option) => (
          <label key={option.value} className={cn(common.label, themed.label, selectedValue === option.value && themed.label_selected)}>
            <input
              type="radio"
              name={name || label}
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => onChange(option.value)}
              className={common.input}
            />
            <span className={cn(common.text, themed.text)}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default RadioGroup;
