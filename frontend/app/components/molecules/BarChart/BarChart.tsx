// @AI-HINT: This component renders a fully theme-aware, dynamic bar chart. It accepts an array of data items, including an optional color property for each bar, making it highly reusable. All styles are self-contained.
'use client';

import React, { useId, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './BarChart.common.module.css';
import lightStyles from './BarChart.light.module.css';
import darkStyles from './BarChart.dark.module.css';

export interface BarChartDataItem {
  label: string;
  value: number;
  color?: string; // Optional: Will default to theme's accent color if not provided.
}

interface BarChartProps {
  data: BarChartDataItem[];
  title?: string;
  className?: string;
  showValues?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, className, showValues = true }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const uniqueId = useId();
  const chartTitleId = `${uniqueId}-title`;
  const chartDescId = `${uniqueId}-desc`;
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        if (index < data.length - 1) {
          setFocusedIndex(index + 1);
          // Focus next bar
          const nextBar = document.querySelector(`[data-bar-index="${index + 1}"]`) as HTMLElement;
          nextBar?.focus();
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          setFocusedIndex(index - 1);
          // Focus previous bar
          const prevBar = document.querySelector(`[data-bar-index="${index - 1}"]`) as HTMLElement;
          prevBar?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        const firstBar = document.querySelector(`[data-bar-index="0"]`) as HTMLElement;
        firstBar?.focus();
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(data.length - 1);
        const lastBar = document.querySelector(`[data-bar-index="${data.length - 1}"]`) as HTMLElement;
        lastBar?.focus();
        break;
      default:
        break;
    }
  }, [data.length]);

  // Generate chart description for screen readers
  const chartDescription = data.map(item => `${item.label}: ${item.value}%`).join(', ');

  return (
    <div
      className={cn(commonStyles.barChart, themeStyles.barChart, className)}
      role="figure"
      aria-labelledby={title ? chartTitleId : undefined}
      aria-describedby={chartDescId}
    >
      {title && (
        <h3 id={chartTitleId} className={cn(commonStyles.barChartTitle, themeStyles.barChartTitle)}>
          {title}
        </h3>
      )}
      <p id={chartDescId} className={commonStyles.srOnly}>
        Bar chart showing {data.length} items: {chartDescription}
      </p>
      <div role="list" aria-label="Bar chart data">
        {data.map((item, index) => {
          const safeValue = Math.min(100, Math.max(0, item.value || 0));

          return (
            <div
              key={item.label}
              role="listitem"
              className={cn(
                commonStyles.barChartBarContainer,
                themeStyles.barChartBarContainer,
                focusedIndex === index && commonStyles.barChartBarContainerFocused
              )}
            >
              <span
                id={`${uniqueId}-label-${index}`}
                className={cn(commonStyles.barChartLabel, themeStyles.barChartLabel)}
              >
                {item.label}
              </span>
              <div className={cn(commonStyles.barChartBarWrapper, themeStyles.barChartBarWrapper)}>
                <div
                  data-bar-index={index}
                  className={cn(commonStyles.barChartBar, themeStyles.barChartBar)}
                  style={{
                    width: `${safeValue}%`,
                    backgroundColor: item.color || undefined
                  }}
                  role="progressbar"
                  aria-valuenow={safeValue}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-labelledby={`${uniqueId}-label-${index}`}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                />
              </div>
              {showValues && (
                <span
                  className={cn(commonStyles.barChartPercentage, themeStyles.barChartPercentage)}
                  aria-hidden="true"
                >
                  {item.value}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BarChart;
