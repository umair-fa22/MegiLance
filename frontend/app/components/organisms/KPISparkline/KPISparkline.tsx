// @AI-HINT: KPI Sparkline — mini inline SVG sparkline chart for dashboard stat cards
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import commonStyles from './KPISparkline.common.module.css';
import lightStyles from './KPISparkline.light.module.css';
import darkStyles from './KPISparkline.dark.module.css';

interface KPISparklineProps {
  data: number[];
  color?: 'primary' | 'success' | 'warning' | 'danger';
  height?: number;
  showLabels?: boolean;
  labelStart?: string;
  labelEnd?: string;
}

const KPISparkline: React.FC<KPISparklineProps> = ({
  data,
  color = 'primary',
  height = 40,
  showLabels = false,
  labelStart,
  labelEnd,
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const colorSuffix = color === 'primary' ? '' : color.charAt(0).toUpperCase() + color.slice(1);
  const pathClass = cn(commonStyles.sparklinePath, themeStyles[`sparklinePath${colorSuffix}`]);
  const areaClass = cn(commonStyles.sparklineArea, themeStyles[`sparklineArea${colorSuffix}`]);
  const dotClass = cn(commonStyles.sparklineDot, themeStyles[`sparklineDot${colorSuffix}`]);

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (!data || data.length < 2) return { linePath: '', areaPath: '', lastPoint: { x: 0, y: 0 } };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 4;
    const w = 200;
    const h = height;
    const stepX = (w - padding * 2) / (data.length - 1);

    const points = data.map((val, i) => ({
      x: padding + i * stepX,
      y: padding + (1 - (val - min) / range) * (h - padding * 2),
    }));

    // Smooth curve using cardinal spline
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const area = d + ` L ${points[points.length - 1].x},${h} L ${points[0].x},${h} Z`;
    const last = points[points.length - 1];

    return { linePath: d, areaPath: area, lastPoint: last };
  }, [data, height]);

  if (!data || data.length < 2) return null;

  return (
    <div className={commonStyles.sparklineContainer}>
      <svg
        viewBox={`0 0 200 ${height}`}
        className={commonStyles.sparklineSvg}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={areaPath} className={areaClass} />
        <path d={linePath} className={pathClass} />
        <circle cx={lastPoint.x} cy={lastPoint.y} className={dotClass} />
      </svg>
      {showLabels && (
        <div className={cn(commonStyles.sparklineLabel, themeStyles.sparklineLabel)}>
          <span>{labelStart}</span>
          <span>{labelEnd}</span>
        </div>
      )}
    </div>
  );
};

export default KPISparkline;
