// @AI-HINT: This is a versatile, enterprise-grade PieChart component with support for tooltips, legends, and theme-aware styling. All styles are per-component only.

'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './PieChart.common.module.css';
import lightStyles from './PieChart.light.module.css';
import darkStyles from './PieChart.dark.module.css';

export interface PieChartDataItem {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  wrapperClassName?: string;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  showLegend = true,
  showTooltip = true,
  showPercentage = true,
  size = 'md',
  className = '',
  wrapperClassName = ''
}) => {
  const { resolvedTheme } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const chartTitleId = `${uniqueId}-title`;
  const chartDescId = `${uniqueId}-desc`;
  
  // Calculate total value
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate percentages and angles
  const chartData = data.map((item, index) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    return {
      ...item,
      percentage,
      index
    };
  });
  
  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    if (!chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    setTooltipPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setHoveredIndex(index);
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (data.length === 0) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev === null ? 0 : (prev + 1) % data.length;
          return next;
        });
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev === null ? data.length - 1 : (prev - 1 + data.length) % data.length;
          return next;
        });
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
        setHoveredIndex(null);
        break;
      default:
        break;
    }
  }, [data.length]);

  // Show tooltip for focused item
  useEffect(() => {
    if (focusedIndex !== null) {
      setHoveredIndex(focusedIndex);
    }
  }, [focusedIndex]);

  // Early return after all hooks
  if (!resolvedTheme) {
    return null;
  }
  
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  
  // Render pie slices
  const renderPieSlices = () => {
    let startAngle = 0;
    
    return chartData.map((item, index) => {
      const sliceAngle = (item.percentage / 100) * 360;
      const endAngle = startAngle + sliceAngle;
      
      // Calculate coordinates for the slice
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      
      // Center of the pie chart
      const centerX = 100;
      const centerY = 100;
      const radius = 80;
      
      // Calculate start and end points
      const startX = centerX + radius * Math.cos((Math.PI / 180) * (startAngle - 90));
      const startY = centerY + radius * Math.sin((Math.PI / 180) * (startAngle - 90));
      const endX = centerX + radius * Math.cos((Math.PI / 180) * (endAngle - 90));
      const endY = centerY + radius * Math.sin((Math.PI / 180) * (endAngle - 90));
      
      // Create path for the slice
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        'Z'
      ].join(' ');
      
      // Calculate centroid for percentage text
      const centroidAngle = startAngle + sliceAngle / 2;
      const centroidX = centerX + (radius / 2) * Math.cos((Math.PI / 180) * (centroidAngle - 90));
      const centroidY = centerY + (radius / 2) * Math.sin((Math.PI / 180) * (centroidAngle - 90));
      
      startAngle = endAngle;
      
      return (
        <g key={index}>
          <path
            d={pathData}
            fill={item.color || `hsl(${index * 30}, 70%, 50%)`}
            className={cn(
              commonStyles.slice,
              themeStyles.slice,
              hoveredIndex === index && commonStyles.sliceHovered,
              hoveredIndex === index && themeStyles.sliceHovered
            )}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onMouseLeave={handleMouseLeave}
          />
          {showPercentage && item.percentage > 5 && (
            <text
              x={centroidX}
              y={centroidY}
              className={cn(commonStyles.percentageText, themeStyles.percentageText)}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {item.percentage.toFixed(1)}%
            </text>
          )}
        </g>
      );
    });
  };
  
  // Render legend
  const renderLegend = () => {
    if (!showLegend) return null;
    
    return (
      <div 
        className={cn(commonStyles.legend, themeStyles.legend)}
        role="list"
        aria-label="Chart legend"
      >
        {chartData.map((item, index) => (
          <div 
            key={index}
            role="listitem"
            className={cn(
              commonStyles.legendItem, 
              themeStyles.legendItem,
              focusedIndex === index && commonStyles.legendItemFocused,
              focusedIndex === index && themeStyles.legendItemFocused
            )}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={handleMouseLeave}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            tabIndex={0}
            aria-label={`${item.label}: ${item.value} (${item.percentage.toFixed(1)}%)`}
          >
            <div 
              className={cn(commonStyles.legendColor, themeStyles.legendColor)}
              style={{ backgroundColor: item.color || `hsl(${index * 30}, 70%, 50%)` }}
              aria-hidden="true"
            />
            <span className={cn(commonStyles.legendLabel, themeStyles.legendLabel)}>
              {item.label}
            </span>
            <span className={cn(commonStyles.legendValue, themeStyles.legendValue)}>
              {item.value} ({item.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  // Render tooltip
  const renderTooltip = () => {
    if (!showTooltip || hoveredIndex === null) return null;
    
    const item = chartData[hoveredIndex];
    
    return (
      <div
        className={cn(commonStyles.tooltip, themeStyles.tooltip)}
        data-x={tooltipPosition.x}
        data-y={tooltipPosition.y}
      >
        <div 
          className={cn(commonStyles.tooltipColor, themeStyles.tooltipColor)}
          data-color-index={hoveredIndex}
        />
        <div className={cn(commonStyles.tooltipContent, themeStyles.tooltipContent)}>
          <div className={cn(commonStyles.tooltipLabel, themeStyles.tooltipLabel)}>
            {item.label}
          </div>
          <div className={cn(commonStyles.tooltipValue, themeStyles.tooltipValue)}>
            {item.value} ({item.percentage.toFixed(1)}%)
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      ref={chartRef}
      className={cn(
        commonStyles.pieChartWrapper,
        themeStyles.pieChartWrapper,
        wrapperClassName
      )}
    >
      {title && (
        <h3 className={cn(commonStyles.title, themeStyles.title)}>
          {title}
        </h3>
      )}
      
      <div className={cn(
        commonStyles.chartContainer,
        themeStyles.chartContainer,
        commonStyles[`size-${size}`],
        themeStyles[`size-${size}`],
        className
      )}>
        <div className={cn(commonStyles.chartWrapper, themeStyles.chartWrapper)}>
          <svg 
            viewBox="0 0 200 200" 
            className={cn(commonStyles.chart, themeStyles.chart)}
            role="img"
            aria-labelledby={title ? chartTitleId : undefined}
            aria-describedby={chartDescId}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onBlur={() => setFocusedIndex(null)}
          >
            <title id={chartTitleId}>{title || 'Pie Chart'}</title>
            <desc id={chartDescId}>
              {`Pie chart showing ${data.length} segments: ${chartData.map(item => `${item.label} at ${item.percentage.toFixed(1)}%`).join(', ')}`}
            </desc>
            {renderPieSlices()}
          </svg>
          {renderTooltip()}
        </div>
        
        {renderLegend()}
      </div>
    </div>
  );
};

export default PieChart;
