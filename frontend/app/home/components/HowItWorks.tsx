// @AI-HINT: A section explaining the platform's process for both freelancers and clients, designed for clarity and visual appeal.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Search, ClipboardList, Users, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import StepCard from './StepCard';
import type { StepCardProps } from './StepCard';
import { LottieAnimation, workflowAnimation } from '@/app/components/Animations/LottieAnimation';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';
import commonStyles from './HowItWorks.common.module.css';
import lightStyles from './HowItWorks.light.module.css';
import darkStyles from './HowItWorks.dark.module.css';

const steps: Array<Omit<StepCardProps, 'stepNumber' | 'type'>> = [
  {
    icon: <ClipboardList />,
    title: '1. Post a Job (as a Client)',
    description: 'Define your project, scope, and budget. Our platform makes it easy to create a comprehensive job post that attracts the right talent.',
  },
  {
    icon: <Search />,
    title: '2. Find Work (as a Freelancer)',
    description: 'Create a polished profile and browse projects that match your skills. Our smart matching system helps you find the perfect opportunity.',
  },
  {
    icon: <Users />,
    title: '3. Hire & Collaborate',
    description: 'Clients review proposals and hire the best fit. Freelancers and clients collaborate seamlessly using our built-in tools.',
  },
  {
    icon: <FileSignature />,
    title: '4. Manage & Get Paid',
    description: 'Track milestones and manage deliverables. Our secure payment system ensures freelancers get paid on time, every time.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
      transition: { type: 'spring' as const, stiffness: 200, damping: 20 }
  },
};

const HowItWorks: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.howItWorks, themeStyles.howItWorks)}>
      <SectionGlobe variant="blue" size="lg" position="left" />
      <motion.div 
        className={cn(commonStyles.container)}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div variants={itemVariants} className={cn(commonStyles.header)}>
          <span className={cn(commonStyles.tagline, themeStyles.tagline)}>The Process</span>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }} 
            transition={{ type: "spring" as const, stiffness: 300, damping: 15 }}
          >
            <LottieAnimation
              animationData={workflowAnimation}
              width={120}
              height={120}
              ariaLabel="Workflow process illustration"
              className="mx-auto mb-2"
            />
          </motion.div>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>How MegiLance Works</h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            A simple, streamlined process for clients and freelancers to connect, collaborate, and achieve great things.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className={cn(commonStyles.timeline)}>
          {steps.map((step, index) => (
            <motion.div 
              key={step.title}
              whileHover={{ scale: 1.03, y: -5 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 15 }}
            >
              <StepCard
                stepNumber={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
                type={index % 2 === 0 ? 'client' : 'freelancer'}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HowItWorks;

