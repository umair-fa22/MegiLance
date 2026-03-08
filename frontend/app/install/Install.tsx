// @AI-HINT: This is the PWA Install page root component. It prompts the user to install the app. All styles are per-component only.
'use client';

import React from 'react';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';

import commonStyles from './Install.common.module.css';
import lightStyles from './Install.light.module.css';
import darkStyles from './Install.dark.module.css';

const Install: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;


  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // In a real implementation, we would check if the app can be installed
  // and handle the beforeinstallprompt event.
  const handleInstallClick = () => {
    showToast('PWA installation would be triggered here.', 'success');
  };

  return (
    <PageTransition className={cn(commonStyles.container, themeStyles.container)}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="blue" size={400} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="purple" size={350} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={10} className="absolute inset-0" />
        <div className="absolute top-20 left-10 opacity-10">
          <FloatingCube size={50} />
        </div>
        <div className="absolute bottom-32 right-20 opacity-10">
          <FloatingSphere size={40} />
        </div>
      </div>
      <div className={commonStyles.innerContainer}>
        <ScrollReveal className={commonStyles.header}>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Install MegiLance</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Get the best experience by installing the MegiLance app on your device.</p>
        </ScrollReveal>

        <StaggerContainer className={commonStyles.features}>
          <ScrollReveal className={cn(commonStyles.feature, themeStyles.feature)}>
            <h3 className={cn(commonStyles.featureTitle, themeStyles.featureTitle)}>Faster Access</h3>
            <p className={cn(commonStyles.featureDescription, themeStyles.featureDescription)}>Launch the app directly from your home screen.</p>
          </ScrollReveal>
          <ScrollReveal className={cn(commonStyles.feature, themeStyles.feature)}>
            <h3 className={cn(commonStyles.featureTitle, themeStyles.featureTitle)}>Offline Capabilities</h3>
            <p className={cn(commonStyles.featureDescription, themeStyles.featureDescription)}>Access key features even without an internet connection.</p>
          </ScrollReveal>
          <ScrollReveal className={cn(commonStyles.feature, themeStyles.feature)}>
            <h3 className={cn(commonStyles.featureTitle, themeStyles.featureTitle)}>Push Notifications</h3>
            <p className={cn(commonStyles.featureDescription, themeStyles.featureDescription)}>Stay updated on project updates and messages.</p>
          </ScrollReveal>
        </StaggerContainer>

        <ScrollReveal>
          <Button variant="primary" onClick={handleInstallClick}>
            Install App
          </Button>
        </ScrollReveal>
      </div>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '12px 24px',
          borderRadius: 8, color: '#fff', zIndex: 9999, fontSize: 14,
          backgroundColor: toast.type === 'success' ? '#27AE60' : '#e81123',
        }}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
};

export default Install;
