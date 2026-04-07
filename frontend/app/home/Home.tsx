// @AI-HINT: Clean, focused Home page for MegiLance AI-powered freelancing platform.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import Hero from './components/Hero/Hero';
import TrustIndicators from './components/TrustIndicators';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import { ScrollReveal } from '../components/Animations/ScrollReveal';

import commonStyles from './Home.common.module.css';
import lightStyles from './Home.light.module.css';
import darkStyles from './Home.dark.module.css';

const Home: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.homePage, themeStyles.homePage)}>
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
              <ScrollReveal width="100%" direction="left">
                <HowItWorks />
              </ScrollReveal>
            </div>
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
