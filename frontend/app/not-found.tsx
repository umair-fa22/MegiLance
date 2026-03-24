// @AI-HINT: Custom 404 page for MegiLance.
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, LottieAnimation, notFoundAnimation } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import common from './NotFound.common.module.css';
import light from './NotFound.light.module.css';
import dark from './NotFound.dark.module.css';

const NotFoundPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
         <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
         <ParticlesSystem count={12} className="absolute inset-0" />
         <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
           <FloatingCube size={40} />
         </div>
         <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
           <FloatingSphere size={30} variant="gradient" />
         </div>
      </div>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.content}>
              {/* Animated 404 illustration */}
              <LottieAnimation
                animationData={notFoundAnimation}
                width={220}
                height={220}
                ariaLabel="Page not found illustration"
                className="mx-auto mb-4"
              />
              <h1 className={common.title}>404</h1>
              <h2 className={common.subtitle}>Page Not Found</h2>
              <p className={common.description}>
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
              <div className={common.actions}>
                <Link href="/" className={common.primaryButton}>
                  Go Home
                </Link>
                <Link href="/contact" className={common.secondaryButton}>
                  Contact Support
                </Link>
              </div>
              <div className={common.suggestions}>
                <h3 className={common.suggestionsTitle}>Popular Pages</h3>
                <div className={common.suggestionsGrid}>
                  <Link href="/jobs" className={common.suggestionLink}>
                    Find Jobs
                  </Link>
                  <Link href="/freelancers" className={common.suggestionLink}>
                    Find Freelancers
                  </Link>
                  <Link href="/pricing" className={common.suggestionLink}>
                    Pricing
                  </Link>
                  <Link href="/help" className={common.suggestionLink}>
                    Help Center
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default NotFoundPage;
