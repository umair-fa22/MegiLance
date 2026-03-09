'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Cpu, ShieldCheck, Globe, Wallet } from 'lucide-react';

import FeatureCard from './FeatureCard';
import { StaggerContainer, StaggerItem } from '../../components/Animations/StaggerContainer';
import { LottieAnimation, aiSparkleAnimation } from '../../components/Animations/LottieAnimation';
import SectionGlobe from '../../components/Animations/SectionGlobe/SectionGlobe';
import commonStyles from './Features.common.module.css';
import lightStyles from './Features.light.module.css';
import darkStyles from './Features.dark.module.css';

const featuresData = [
  {
    icon: <Cpu />,
    title: 'AI-Powered Matching',
    description: 'Get matched with the right freelancers based on skills, budget, availability, and past project success — automatically.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Secure Escrow Payments',
    description: 'Funds are held in escrow and released only when milestones are approved. No risk for either side.',
  },
  {
    icon: <Globe />,
    title: 'Global Talent Pool',
    description: 'Access developers, designers, and writers worldwide. Filter by skills, timezone, and hourly rate.',
  },
  {
    icon: <Wallet />,
    title: 'Transparent Pricing',
    description: 'Clear fee structure with no hidden costs. Track every payment, milestone, and invoice from your dashboard.',
  },
];

const Features: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const [heroFeature, ...secondaryFeatures] = featuresData;

  return (
    <section className={cn(commonStyles.featuresSection, themeStyles.featuresSection)}>
      <SectionGlobe variant="blue" size="sm" position="right" />
      <div className={cn(commonStyles.container)}>
        <div className={cn(commonStyles.header)}>
          <span className={cn(commonStyles.tagline, themeStyles.tagline)}>Why MegiLance?</span>
          <LottieAnimation
            animationData={aiSparkleAnimation}
            width={110}
            height={110}
            ariaLabel="AI-powered features illustration"
            className="mx-auto mb-2"
          />
          <h2 className={cn(commonStyles.title, themeStyles.title)}>Everything You Need to Get Work Done</h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Post projects, find talent, manage contracts, and pay securely — all in one platform.
          </p>
        </div>
        <div className={cn(commonStyles.grid)}>
          <div className={cn(commonStyles.heroCardWrapper)}>
            <FeatureCard
              variant="hero"
              icon={heroFeature.icon}
              title={heroFeature.title}
              description={heroFeature.description}
            />
          </div>
          <StaggerContainer className={cn(commonStyles.secondaryGrid)}>
            {secondaryFeatures.map((feature) => (
              <StaggerItem key={feature.title}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
};

export default Features;
