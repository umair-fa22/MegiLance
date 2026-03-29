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
    description: 'Your premium AI-powered freelancing platform. Discover global talent and innovative projects instantly.',
    icon: <Sparkles size={64} className="text-blue-500" />
  },
  {
    title: 'Smart Matching',
    description: 'Our proprietary AI ranks and matches you with the best proposals, ensuring quality and fit.',
    icon: <Globe size={64} className="text-purple-500" />
  },
  {
    title: 'Secure Escrow',
    description: 'Rest easy with automated escrow deposits, protected payments, and blockchain integrations.',
    icon: <ShieldCheck size={64} className="text-emerald-500" />
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
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
          >
            <div className={cn(commonStyles.imageContainer, themeStyles.imageContainer)}>
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              >
                {TOUR_STEPS[step].icon}
              </motion.div>
            </div>
            
            <div className={commonStyles.content}>
              <h2 id="onboarding-title" className={cn(commonStyles.title, themeStyles.title)}>
                {TOUR_STEPS[step].title}
              </h2>
              <p className={cn(commonStyles.description, themeStyles.description)}>
                {TOUR_STEPS[step].description}
              </p>
            </div>

            <div className={cn(commonStyles.footer, themeStyles.footer)}>
              <Button variant="ghost" onClick={handleClose}>
                Skip
              </Button>
              
              <div className={commonStyles.dots}>
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      commonStyles.dot, 
                      themeStyles.dot,
                      i === step && [commonStyles.dotActive, themeStyles.dotActive]
                    )} 
                  />
                ))}
              </div>

              <Button variant="primary" onClick={handleNext}>
                {step === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
