// @AI-HINT: Analytics dashboard page showing platform stats and performance metrics
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import { BarChart3, Users, Briefcase, DollarSign, TrendingUp, Clock, FileText, Star } from 'lucide-react';

import commonStyles from './Analytics.common.module.css';
import lightStyles from './Analytics.light.module.css';
import darkStyles from './Analytics.dark.module.css';

interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}

const AnalyticsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const apiModule = await import('@/lib/api') as any;
        const metricsApi = apiModule.metricsApi;
        if (metricsApi?.getDashboard) {
          const data = await metricsApi.getDashboard();
          if (data) {
            setStats([
              { label: 'Total Users', value: String(data.total_users ?? '0'), change: '--', positive: true, icon: <Users size={22} /> },
              { label: 'Active Projects', value: String(data.active_projects ?? '0'), change: '--', positive: true, icon: <Briefcase size={22} /> },
              { label: 'Revenue', value: `$${Number(data.revenue ?? 0).toLocaleString()}`, change: '--', positive: true, icon: <DollarSign size={22} /> },
              { label: 'Proposals', value: String(data.total_proposals ?? '0'), change: '--', positive: true, icon: <FileText size={22} /> },
              { label: 'Avg Rating', value: String(data.avg_rating ?? 'N/A'), change: '--', positive: true, icon: <Star size={22} /> },
              { label: 'Completion Rate', value: data.completion_rate ? `${data.completion_rate}%` : 'N/A', change: '--', positive: true, icon: <TrendingUp size={22} /> },
              { label: 'Avg Response Time', value: data.avg_response_hours ? `${data.avg_response_hours}h` : 'N/A', change: '--', positive: true, icon: <Clock size={22} /> },
              { label: 'Active Contracts', value: String(data.active_contracts ?? '0'), change: '--', positive: true, icon: <BarChart3 size={22} /> },
            ]);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API not available, use defaults
      }
      setStats([
        { label: 'Total Users', value: '0', change: '--', positive: true, icon: <Users size={22} /> },
        { label: 'Active Projects', value: '0', change: '--', positive: true, icon: <Briefcase size={22} /> },
        { label: 'Revenue', value: '$0', change: '--', positive: true, icon: <DollarSign size={22} /> },
        { label: 'Proposals', value: '0', change: '--', positive: true, icon: <FileText size={22} /> },
        { label: 'Avg Rating', value: 'N/A', change: '--', positive: true, icon: <Star size={22} /> },
        { label: 'Completion Rate', value: 'N/A', change: '--', positive: true, icon: <TrendingUp size={22} /> },
        { label: 'Avg Response Time', value: 'N/A', change: '--', positive: true, icon: <Clock size={22} /> },
        { label: 'Active Contracts', value: '0', change: '--', positive: true, icon: <BarChart3 size={22} /> },
      ]);
      setLoading(false);
    };
    loadAnalytics();
  }, []);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={15} className="absolute inset-0" />
        <div className="absolute top-[60%] right-[15%] opacity-10"><FloatingCube /></div>
        <div className="absolute top-[20%] left-[10%] opacity-10"><FloatingSphere /></div>
      </div>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Analytics</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Track performance, revenue, and engagement trends.
              </p>
            </header>
          </ScrollReveal>

          {loading ? (
            <div className={commonStyles.statsGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={cn(commonStyles.skeletonCard, themeStyles.skeletonCard)} />
              ))}
            </div>
          ) : (
            <ScrollReveal delay={0.1}>
              <div className={commonStyles.statsGrid}>
                {stats.map((stat, index) => (
                  <div key={index} className={cn(commonStyles.statCard, themeStyles.statCard)}>
                    <div className={commonStyles.statTop}>
                      <div className={cn(commonStyles.iconBox, themeStyles.iconBox)}>
                        {stat.icon}
                      </div>
                      <span className={cn(commonStyles.changeLabel, stat.positive ? commonStyles.changePositive : commonStyles.changeNegative)}>
                        {stat.change}
                      </span>
                    </div>
                    <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
                      {stat.value}
                    </div>
                    <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          )}
        </div>
      </main>
    </PageTransition>
  );
};

export default AnalyticsPage;
