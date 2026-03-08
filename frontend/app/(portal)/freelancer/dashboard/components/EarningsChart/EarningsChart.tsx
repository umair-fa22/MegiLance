// @AI-HINT: Area chart visualization for freelancer earnings over time
'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import common from './EarningsChart.common.module.css';
import light from './EarningsChart.light.module.css';
import dark from './EarningsChart.dark.module.css';

interface EarningsData {
  month: string;
  amount: number;
}

interface EarningsChartProps {
  data: EarningsData[];
}

const CustomTooltip = ({ active, payload, label, themeStyles }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn(common.tooltip, themeStyles.tooltip)}>
        <p className={common.tooltipLabel}>{label}</p>
        <p className={cn(common.tooltipValue, themeStyles.tooltipValue)}>
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const EarningsChart: React.FC<EarningsChartProps> = ({ data }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? dark : light;
  const chartColors = resolvedTheme === 'dark'
    ? { grid: '#333', tick: '#a0a0a0' }
    : { grid: '#e9ecef', tick: '#6c757d' };

  return (
    <div className={common.container}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#27AE60" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#27AE60" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke={chartColors.grid} 
          />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.tick, fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.tick, fontSize: 12 }}
            tickFormatter={(value) => `$${value/1000}k`}
          />
          <Tooltip content={<CustomTooltip themeStyles={themeStyles} />} />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#27AE60" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorEarnings)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EarningsChart;
