// @AI-HINT: Welcome onboarding tour modal shown to first-time users
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/app/components/atoms/Button/Button';
import { cn } from '@/lib/utils';
import { Sparkles, Globe, ShieldCheck } from 'lucide-react';

import commonStyles from './OnboardingTour.common.module.css';
import lightStyles from './OnboardingTour.light.module.css';
import darkStyles from './OnboardingTour.dark.module.css';

const TOUR_STEPS = [
  {
    title: 'Welcome to MegiLance',
    description: 'Experience the future of freelancing. AI-driven matching connects top talent with visionary projects instantly.',
    icon: <Sparkles size={72} strokeWidth={1.5} />,
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10'
  },
  {
    title: 'Precision Matching',
    description: 'Our proprietary AI analyzes skills and project needs to rank and pair you with the absolute best fit.',
    icon: <Globe size={72} strokeWidth={1.5} />,
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10'
  },
  {
    title: 'Secure & Seamless',
    description: 'Work with peace of mind. Automated escrows, milestone tracking, and protected payments built right in.',
    icon: <ShieldCheck size={72} strokeWidth={1.5} />,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10'
  }
];

export default function OnboardingTour() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    const hasSeenT = localStorage.getItem('megilance_onboarding_done');
    if (!hasSeenT) {
      // Slightly delay for effect
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const handleClose = () => {
    localStorage.setItem('megilance_onboarding_done', 'true');
    setIsOpen(false);
  };

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={commonStyles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className={cn(commonStyles.modal, themeStyles.modal)}
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
          >
            <div className={cn(commonStyles.imageContainer, themeStyles.imageContainer)}>
              <div className={commonStyles.imageBgPattern} />
              <button 
                onClick={handleClose}
                className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                aria-label="Close tour"
              >
                ×
              </button>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className={cn(commonStyles.iconWrapper, TOUR_STEPS[step].colorClass, TOUR_STEPS[step].bgClass)}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                  transition={{ duration: 0.4, type: "spring" }}
                >
                  {TOUR_STEPS[step].icon}
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className={commonStyles.content}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`text-${step}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 id="onboarding-title" className={cn(commonStyles.title, themeStyles.title)}>
                    {TOUR_STEPS[step].title}
                  </h2>
                  <p className={cn(commonStyles.description, themeStyles.description)}>
                    {TOUR_STEPS[step].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={cn(commonStyles.footer, themeStyles.footer)}>
              <Button variant="ghost" onClick={handleClose} className={commonStyles.skipBtn}>
                Skip
              </Button>
              
              <div className={commonStyles.dots}>
                {TOUR_STEPS.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={cn(
                      commonStyles.dot, 
                      themeStyles.dot,
                      i === step && [commonStyles.dotActive, themeStyles.dotActive]
                    )} 
                  />
                ))}
              </div>

              <Button variant="primary" onClick={handleNext} className={commonStyles.nextBtn}>
                {step === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
