// @AI-HINT: This component provides visual feedback for password strength. It calculates a score based on criteria like length, character types, and displays a colored bar and text label.
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

import commonStyles from './PasswordStrength.common.module.css';
import lightStyles from './PasswordStrength.light.module.css';
import darkStyles from './PasswordStrength.dark.module.css';

interface PasswordStrengthProps {
  password?: string;
}

const calculateStrength = (password: string) => {
  let score = 0;
  if (!password) return 0;

  // Award points for different criteria
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return Math.min(Math.floor(score / 1.5), 4);
};

const strengthLevels = [
  { label: 'Very Weak', className: 'veryWeak' },
  { label: 'Weak', className: 'weak' },
  { label: 'Okay', className: 'okay' },
  { label: 'Good', className: 'good' },
  { label: 'Strong', className: 'strong' },
];

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const strength = calculateStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className={commonStyles.container}>
      <div
        className={commonStyles.strengthBar}
        role="progressbar"
        aria-valuenow={strength}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={`Password strength: ${strengthLevels[strength].label}`}
      >
        {strengthLevels.map((_, index) => (
          <div
            key={index}
            className={cn(
              commonStyles.strengthSegment,
              index < strength + 1 && styles[strengthLevels[strength].className]
            )}
          />
        ))}
      </div>
      <p className={cn(commonStyles.strengthLabel, styles[strengthLevels[strength].className])}>
        {strengthLevels[strength].label}
      </p>
    </div>
  );
};

export default PasswordStrength;
