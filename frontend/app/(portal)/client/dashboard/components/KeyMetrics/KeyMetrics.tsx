// AI-HINT: This component displays the key performance indicators (KPIs) for the client dashboard using the modernized, animated DashboardWidget.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import DashboardWidget, { DashboardWidgetProps } from '@/app/components/molecules/DashboardWidget/DashboardWidget';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';

import common from './KeyMetrics.common.module.css';
import light from './KeyMetrics.light.module.css';
import dark from './KeyMetrics.dark.module.css';

interface KeyMetricsProps {
  metrics: {
    totalProjects: number;
    activeProjects: number;
    totalSpent: string;
    pendingPayments: number;
  };
  loading: boolean;
  metricCards: Omit<DashboardWidgetProps, 'value'>[];
}

const WidgetSkeleton: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <div className={cn(common.widgetSkeleton, themed.widgetSkeleton)}>
      <div className={common.skeletonHeader}>
        <Skeleton height={36} width={36} radius={18} />
        <Skeleton height={16} width={'60%'} />
      </div>
      <Skeleton height={36} width={'40%'} />
      <Skeleton height={20} width={'30%'} />
    </div>
  );
};

const KeyMetrics: React.FC<KeyMetricsProps> = ({ metrics, loading, metricCards }) => {
  const values = [
    metrics.totalProjects,
    metrics.activeProjects,
    metrics.totalSpent,
    metrics.pendingPayments
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (loading) {
    return (
      <section className={common.widgetsGrid} aria-label="Loading key metrics">
        {Array.from({ length: 4 }).map((_, i) => <WidgetSkeleton key={i} />)}
      </section>
    );
  }

  return (
    <motion.section
      className={common.widgetsGrid}
      aria-label="Key Metrics"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {metricCards.map((card, index) => (
        <DashboardWidget
          key={card.title}
          {...card}
          value={String(values[index] ?? '0')}
        />
      ))}
    </motion.section>
  );
};

export default KeyMetrics;
