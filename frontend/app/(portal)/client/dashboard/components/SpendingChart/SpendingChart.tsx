// @AI-HINT: This component displays a bar chart for monthly spending, wrapped in a DashboardWidget for a premium look.
'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import DashboardWidget from '@/app/components/molecules/DashboardWidget/DashboardWidget';
import { DollarSign } from 'lucide-react';

import common from './SpendingChart.common.module.css';
import light from './SpendingChart.light.module.css';
import dark from './SpendingChart.dark.module.css';

interface SpendingChartProps {
  data: { name: string; spending: number }[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  if (active && payload && payload.length) {
    return (
      <div className={cn(common.customTooltip, themed.customTooltip)}>
        <p className={common.tooltipLabel}>{label}</p>
        <p className={cn(common.tooltipValue, themed.tooltipValue)}>{`$${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

const SpendingChart: React.FC<SpendingChartProps> = ({ data }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <DashboardWidget title="Monthly Spending" icon={DollarSign}>
      <div className={common.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4573DF" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4573DF" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className={cn(themed.grid)} />
            <XAxis 
              dataKey="name" 
              tickLine={false} 
              axisLine={false} 
              tickMargin={10}
              className={cn(themed.axis)} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tickMargin={10}
              tickFormatter={(value) => `$${Number(value) / 1000}k`} 
              className={cn(themed.axis)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(69, 115, 223, 0.1)' }} />
            <Bar dataKey="spending" fill="url(#colorSpending)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardWidget>
  );
};

export default SpendingChart;
