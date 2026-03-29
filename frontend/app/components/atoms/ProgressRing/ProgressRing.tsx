// @AI-HINT: ProgressRing — animated circular SVG progress indicator with value display
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './ProgressRing.common.module.css';
import lightStyles from './ProgressRing.light.module.css';
import darkStyles from './ProgressRing.dark.module.css';

interface ProgressRingProps {
  value: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  suffix?: string;
}

const SIZE_MAP = { sm: 48, md: 72, lg: 96 };
const STROKE_MAP = { sm: 3, md: 4, lg: 4 };

const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  label,
  size = 'md',
  color = 'primary',
  showValue = true,
  suffix = '%',
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [animatedOffset, setAnimatedOffset] = useState<number | null>(null);

  const dim = SIZE_MAP[size];
  const stroke = STROKE_MAP[size];
  const radius = (dim - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const targetOffset = circumference - (clampedValue / 100) * circumference;

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(targetOffset), 50);
    return () => clearTimeout(timer);
  }, [targetOffset]);

  const colorClass = themeStyles[`ring${color.charAt(0).toUpperCase() + color.slice(1)}`];

  return (
    <div className={cn(commonStyles.ringContainer, commonStyles[`ring${size.charAt(0).toUpperCase() + size.slice(1)}`])}>
      <div style={{ position: 'relative', width: dim, height: dim }}>
        <svg
          className={commonStyles.ringSvg}
          width={dim}
          height={dim}
          viewBox={`0 0 ${dim} ${dim}`}
          aria-hidden="true"
        >
          <circle
            className={cn(commonStyles.ringBg, themeStyles.ringBg)}
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
          />
          <circle
            className={cn(commonStyles.ringFg, colorClass)}
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset ?? circumference}
          />
        </svg>
        {showValue && (
          <div className={commonStyles.ringCenter}>
            <span className={cn(commonStyles.ringValue, themeStyles.ringValue)}>
              {Math.round(clampedValue)}{suffix}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className={cn(commonStyles.ringLabel, themeStyles.ringLabel)}>{label}</span>
      )}
    </div>
  );
};

export default ProgressRing;
