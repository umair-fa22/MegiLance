'use client';

import React, { useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Cpu, ShieldCheck, Globe, Wallet } from 'lucide-react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';

import FeatureCard from './FeatureCard';
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



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

import { Variants } from 'framer-motion';
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  },
};

const Features: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const [heroFeature, ...secondaryFeatures] = featuresData;
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const headerY = useTransform(scrollYProgress, [0, 0.5], [50, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section className={cn(commonStyles.featuresSection, themeStyles.featuresSection)} ref={sectionRef}>
      <SectionGlobe variant="blue" size="sm" position="right" />
      <div className={cn(commonStyles.container)}>
        <motion.div 
          className={cn(commonStyles.header)}
          style={{ y: headerY, opacity }}
        >
          <motion.span 
            className={cn(commonStyles.tagline, themeStyles.tagline)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Why MegiLance?
          </motion.span>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.2 }}
          >
            <LottieAnimation
              animationData={aiSparkleAnimation}
              width={110}
              height={110}
              ariaLabel="AI-powered features illustration"
              className="mx-auto mb-2"
            />
          </motion.div>
          <motion.h2 
            className={cn(commonStyles.title, themeStyles.title)}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Everything You Need to Get Work Done
          </motion.h2>
          <motion.p 
            className={cn(commonStyles.subtitle, themeStyles.subtitle)}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Post projects, find talent, manage contracts, and pay securely — all in one platform.
          </motion.p>
        </motion.div>
        
        <motion.div 
          className={cn(commonStyles.grid)}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div 
            className={cn(commonStyles.heroCardWrapper)}
            variants={itemVariants}
            whileHover={{ scale: 1.01, rotateX: 2, rotateY: -2, zIndex: 10 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
            style={{ perspective: 1000 }}
          >
            <FeatureCard
              variant="hero"
              icon={heroFeature.icon}
              title={heroFeature.title}
              description={heroFeature.description}
            />
          </motion.div>
          <div className={cn(commonStyles.secondaryGrid)}>
            {secondaryFeatures.map((feature, i) => (
              <motion.div 
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: 'spring' as const, stiffness: 300 }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;

