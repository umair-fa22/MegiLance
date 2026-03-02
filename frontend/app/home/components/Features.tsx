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
    title: 'AI-Powered Precision',
    description: 'Leverage our suite of AI tools to estimate project costs, generate proposals, and automate your entire workflow with unparalleled accuracy.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Bulletproof Security',
    description: 'Experience peace of mind with our secure USDC payment system, featuring transparent, low-fee transactions and on-chain verification.',
  },
  {
    icon: <Globe />,
    title: 'Borderless Opportunities',
    description: 'Connect with a curated, global network of clients and discover high-value projects that perfectly match your skills and professional ambition.',
  },
  {
    icon: <Wallet />,
    title: 'Sovereign Wallet',
    description: 'Manage your earnings with a built-in, non-custodial wallet that gives you absolute control and ownership over your funds.',
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
          <h2 className={cn(commonStyles.title, themeStyles.title)}>A Smarter Way to Work</h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            We&apos;ve built a next-generation freelance ecosystem with tools and security you can trust.
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
