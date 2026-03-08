// @AI-HINT: This is a simple, non-interactive line chart component for data visualization.
'use client';

import React, { useId, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './LineChart.common.module.css';
import lightStyles from './LineChart.light.module.css';
import darkStyles from './LineChart.dark.module.css';

export interface LineChartProps {
  data: number[];
  labels: string[];
  title?: string;
  className?: string;
  showDataPoints?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  title,
  className,
  showDataPoints = true,
  yAxisLabel,
  xAxisLabel
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const uniqueId = useId();
  const chartTitleId = `${uniqueId}-title`;
  const chartDescId = `${uniqueId}-desc`;
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 500;
  const height = 200;
  const padding = 40;

  const maxX = width - padding * 2;
  const maxY = height - padding * 2;
  const stepX = data.length > 1 ? maxX / (data.length - 1) : maxX;
  const maxValue = Math.max(...data, 1); // Prevent division by zero
  const minValue = Math.min(...data, 0);
  const valueRange = maxValue - minValue || 1;

  // Calculate points for the line
  const points = data.map((d, i) => {
    const x = i * stepX + padding;
    const y = height - ((d - minValue) / valueRange) * maxY - padding;
    return { x, y, value: d, label: labels[i] || `Point ${i + 1}` };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Generate description for screen readers
  const chartDescription = data.map((value, i) => 
    `${labels[i] || `Point ${i + 1}`}: ${value}`
  ).join(', ');

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => Math.min((prev ?? -1) + 1, data.length - 1));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => Math.max((prev ?? 1) - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(data.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedIndex(null);
        break;
      default:
        break;
    }
  }, [data.length]);


  const activeIndex = focusedIndex ?? hoveredIndex;

  return (
    <div 
      className={cn(commonStyles.lineChartContainer, themeStyles.lineChartContainer, className)}
      role="figure"
      aria-labelledby={title ? chartTitleId : undefined}
      aria-describedby={chartDescId}
    >
      {title && (
        <h3 id={chartTitleId} className={cn(commonStyles.chartTitle, themeStyles.chartTitle)}>
          {title}
        </h3>
      )}
      <p id={chartDescId} className={commonStyles.srOnly}>
        Line chart showing {data.length} data points: {chartDescription}
      </p>
      
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn(commonStyles.lineChartSvg, themeStyles.lineChartSvg)}
        role="img"
        aria-label={title || 'Line chart'}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onBlur={() => setFocusedIndex(null)}
      >
        {/* Y-axis label */}
        {yAxisLabel && (
          <text
            x={10}
            y={height / 2}
            className={cn(commonStyles.axisLabel, themeStyles.axisLabel)}
            transform={`rotate(-90, 10, ${height / 2})`}
            textAnchor="middle"
          >
            {yAxisLabel}
          </text>
        )}

        {/* Grid lines */}
        <g className={cn(commonStyles.gridLines, themeStyles.gridLines)} aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - ratio * maxY - padding;
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className={commonStyles.gridLine}
              />
            );
          })}
        </g>

        {/* The line */}
        <polyline
          className={cn(commonStyles.line, themeStyles.line)}
          points={linePoints}
          fill="none"
          aria-hidden="true"
        />

        {/* Data points */}
        {showDataPoints && (
          <g className={commonStyles.dataPoints}>
            {points.map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={activeIndex === i ? 8 : 5}
                  className={cn(
                    commonStyles.dataPoint,
                    themeStyles.dataPoint,
                    activeIndex === i && commonStyles.dataPointActive,
                    activeIndex === i && themeStyles.dataPointActive
                  )}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  role="graphics-symbol"
                  aria-label={`${point.label}: ${point.value}`}
                />
                {/* Tooltip for focused/hovered point */}
                {activeIndex === i && (
                  <g className={commonStyles.tooltip}>
                    <rect
                      x={point.x - 30}
                      y={point.y - 35}
                      width={60}
                      height={25}
                      rx={4}
                      className={cn(commonStyles.tooltipBg, themeStyles.tooltipBg)}
                    />
                    <text
                      x={point.x}
                      y={point.y - 18}
                      textAnchor="middle"
                      className={cn(commonStyles.tooltipText, themeStyles.tooltipText)}
                    >
                      {point.value}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </g>
        )}

        {/* X-axis labels */}
        <g className={cn(commonStyles.labels, themeStyles.labels)}>
          {labels.map((label, i) => (
            <text 
              key={i} 
              x={i * stepX + padding} 
              y={height - 5}
              className={cn(commonStyles.labelText, themeStyles.labelText)}
              textAnchor="middle"
              aria-hidden="true"
            >
              {label}
            </text>
          ))}
        </g>

        {/* X-axis label */}
        {xAxisLabel && (
          <text
            x={width / 2}
            y={height - 2}
            className={cn(commonStyles.axisLabel, themeStyles.axisLabel)}
            textAnchor="middle"
          >
            {xAxisLabel}
          </text>
        )}
      </svg>

      {/* Screen reader data table */}
      <table className={commonStyles.srOnly}>
        <caption>{title || 'Line chart data'}</caption>
        <thead>
          <tr>
            <th scope="col">{xAxisLabel || 'Label'}</th>
            <th scope="col">{yAxisLabel || 'Value'}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, i) => (
            <tr key={i}>
              <td>{point.label}</td>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LineChart;
