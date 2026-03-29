// @AI-HINT: This component displays a donut chart for project statuses using Recharts, wrapped in a DashboardWidget for a premium, consistent look.
'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import DashboardWidget from '@/app/components/molecules/DashboardWidget/DashboardWidget';
import { Briefcase } from 'lucide-react';

import common from './ProjectStatusChart.common.module.css';
import light from './ProjectStatusChart.light.module.css';
import dark from './ProjectStatusChart.dark.module.css';

interface ProjectStatusChartProps {
  data: { name: string; value: number }[];
}

const COLORS = { 
  'In Progress': '#4573DF', 
  'Completed': '#27AE60', 
  'Pending': '#F2C94C', 
  'Cancelled': '#E81123' 
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  if (active && payload && payload.length) {
    return (
      <div className={cn(common.customTooltip, themed.customTooltip)}>
        <p className={common.tooltipLabel}>{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const LegendContent: React.FC<any> = (props) => {
  const { payload } = props;
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  return (
    <ul className={cn(common.legendList, themed.legendList)}>
      {payload?.map((entry: any, index: number) => (
        <li key={`item-${index}`} className={common.legendItem}>
          <span className={common.legendIcon} data-color={entry.color} />
          <span className={themed.legendText}>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

const ProjectStatusChart: React.FC<ProjectStatusChartProps> = ({ data }) => {
  return (
    <DashboardWidget title="Project Status" icon={Briefcase}>
      <div className={common.chartWrapper}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={'70%'}
              outerRadius={'90%'}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend content={<LegendContent />} verticalAlign="middle" align="right" layout="vertical" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </DashboardWidget>
  );
};

export default ProjectStatusChart;
