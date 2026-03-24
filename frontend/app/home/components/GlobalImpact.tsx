// @AI-HINT: This is the main component for the Global Impact section, showcasing MegiLance's worldwide reach and empowering Pakistani talent.

'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Flag, Users, Globe, LineChart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

import ImpactStatCard from './ImpactStatCard';
import SuccessStoryCard from './SuccessStoryCard';
import commonStyles from './GlobalImpact.common.module.css';
import lightStyles from './GlobalImpact.light.module.css';
import darkStyles from './GlobalImpact.dark.module.css';

// --- Dynamic Import for Globe (client-side only) ---
const ImpactGlobe = dynamic(() => import('./ImpactGlobe'), {
  loading: () => <div className={commonStyles.globePlaceholder} />
});

// --- Industry reference stats (sourced from public reports) ---
const industryStats = [
  { icon: Users, number: "1M+", label: "Pakistani Freelancers", description: "Pakistan ranks 4th globally in freelancing (source: Oxford Internet Institute)." },
  { icon: Globe, number: "180+", label: "Countries Connected", description: "The global freelance marketplace connects talent across continents." },
  { icon: LineChart, number: "$455B+", label: "Global Market Size", description: "Worldwide freelancing market size per Statista 2025 report." },
  { icon: Star, number: "5-10%", label: "Platform Fee", description: "MegiLance charges transparent fees vs traditional 20-27% platform commissions." }
];

interface SuccessStory {
  name: string;
  role: string;
  city: string;
  achievement: string;
  quote: string;
  avatar: string;
}

// --- Main Component ---
const GlobalImpact: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [platformStats, setPlatformStats] = useState(industryStats);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real platform stats
        const statsRes = await fetch('/api/v1/public-clients/stats');
        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (stats.total_clients > 0 || stats.total_projects > 0) {
            setPlatformStats([
              { icon: Users, number: `${stats.total_clients || 0}+`, label: "Active Clients", description: "Companies hiring talent on MegiLance." },
              { icon: Globe, number: `${stats.countries || '10'}+`, label: "Countries Served", description: "Connecting talent across borders." },
              { icon: LineChart, number: `${stats.total_projects || 0}+`, label: "Projects Posted", description: "Real opportunities on our platform." },
              { icon: Star, number: "5-10%", label: "Platform Fee", description: "Transparent fees vs traditional 20-27% commissions." }
            ]);
          }
        }

        // Fetch top freelancers as success stories
        const freelancersRes = await fetch('/api/v1/freelancers/featured?limit=3');
        if (freelancersRes.ok) {
          const freelancers = (await freelancersRes.json()) || [];
          if (freelancers.length > 0) {
            setSuccessStories(freelancers.map((f: any) => ({
              name: f.full_name || f.name || 'Freelancer',
              role: f.title || f.headline || 'Freelancer',
              city: f.location || f.city || 'Remote',
              achievement: f.completed_projects ? `${f.completed_projects} Projects Completed` : 'Active on Platform',
              quote: f.bio || f.about || 'Building great things on MegiLance.',
              avatar: f.profile_image_url || f.avatar_url || '',
            })));
          }
        }
      } catch {
        // Silently fail - show industry stats only
      }
    };
    fetchData();
  }, []);

  return (
    <section className={cn(commonStyles.globalImpact, themeStyles.globalImpact)}>
      <div className={commonStyles.container}>
        
        {/* --- Header (FYP Mission Statement) --- */}
        <div className={commonStyles.header}>
          <div className={cn(commonStyles.badge, themeStyles.badge)}>
            <Flag size={14} />
            <span>FYP 2022-2026 | COMSATS University Islamabad</span>
          </div>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>
            Where <span className={cn(commonStyles.highlight, themeStyles.highlight)}>Pakistani Talent</span> Meets Global Opportunity
          </h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Our mission is to democratize access to the global freelance economy by eliminating payment barriers, 
            reducing exploitative fees, and creating a transparent, merit-based marketplace powered by AI and blockchain technology.
          </p>
        </div>

        {/* --- Main Content Grid --- */}
        <div className={commonStyles.mainGrid}>
          <div className={commonStyles.globeSection}>
            <ImpactGlobe />
          </div>
          <div className={commonStyles.statsGrid}>
            {platformStats.map((stat) => (
              <ImpactStatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>

        {/* --- Success Stories Section (only shown if real data available) --- */}
        {successStories.length > 0 && (
        <div className={commonStyles.storiesSection}>
          <h3 className={cn(commonStyles.storiesTitle, themeStyles.storiesTitle)}>Featured Talent from Our Community</h3>
          <div className={commonStyles.storiesGrid}>
            {successStories.map((story) => (
              <SuccessStoryCard key={story.name} story={story} />
            ))}
          </div>
        </div>
        )}

      </div>
    </section>
  );
};

export default GlobalImpact;
