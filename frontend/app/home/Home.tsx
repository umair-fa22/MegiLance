// @AI-HINT: This is the comprehensive Home page showcasing MegiLance's AI-powered freelancing platform with blockchain integration. Maximum scope implementation with premium sections.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Import all the components that make up the home page
import Hero from './components/Hero';
import TrustIndicators from './components/TrustIndicators';
import ProjectStats from './components/ProjectStats';
import WhyMegiLance from './components/WhyMegiLance';
import Features from './components/Features';
import FeaturesStatus from './components/FeaturesStatus';
import HowItWorks from './components/HowItWorks';
import PoweredByAI from './components/PoweredByAI';
import Testimonials from './components/Testimonials';
import { ScrollReveal } from '../components/Animations/ScrollReveal';
import dynamic from 'next/dynamic';

// Lazy-load GlobeBackground to prevent Three.js crashes from breaking the page
const GlobeBackground = dynamic(() => import('../components/Animations/GlobeBackground'), {
  ssr: false,
  loading: () => null,
});

import commonStyles from './Home.common.module.css';
import lightStyles from './Home.light.module.css';
import darkStyles from './Home.dark.module.css';

const Home: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.homePage, themeStyles.homePage)}>
        {/* Background Parallax Layers */}
        <div className={commonStyles.parallaxBackground}>
          <GlobeBackground />
          <div className={cn(commonStyles.gradientOrb, commonStyles.orb1, themeStyles.gradientOrb)} />
          <div className={cn(commonStyles.gradientOrb, commonStyles.orb2, themeStyles.gradientOrb)} />
          <div className={cn(commonStyles.gradientOrb, commonStyles.orb3, themeStyles.gradientOrb)} />
        </div>

        <div className={commonStyles.pageContent}>
          {/* Hero Section */}
          <ScrollReveal width="100%" direction="none" duration={0.8}>
            <Hero />
          </ScrollReveal>

          {/* Trust Indicators */}
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <ScrollReveal width="100%" delay={0.2}>
                <TrustIndicators />
              </ScrollReveal>
            </div>
          </div>

          {/* Project Statistics */}
          <div className={commonStyles.homeSection}>
            <ScrollReveal width="100%" direction="up" delay={0.3}>
              <ProjectStats />
            </ScrollReveal>
          </div>

          {/* Why MegiLance */}
          <div className={commonStyles.homeSection}>
            <ScrollReveal width="100%" direction="left">
              <WhyMegiLance />
            </ScrollReveal>
          </div>

          {/* Features */}
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <ScrollReveal width="100%" direction="right">
                <Features />
              </ScrollReveal>
            </div>
          </div>

          {/* How It Works */}
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <ScrollReveal width="100%" direction="up">
                <HowItWorks />
              </ScrollReveal>
            </div>
          </div>

          {/* Powered By AI */}
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <ScrollReveal width="100%" direction="up">
                <PoweredByAI />
              </ScrollReveal>
            </div>
          </div>

          {/* Features Status Overview - FYP Evaluation */}
          <div className={commonStyles.homeSection}>
            <ScrollReveal width="100%" direction="up">
              <FeaturesStatus />
            </ScrollReveal>
          </div>

          {/* Testimonials */}
          <div className={commonStyles.homeSection}>
            <div className={commonStyles.sectionContainer}>
              <ScrollReveal width="100%" direction="up">
                <Testimonials />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Home;