// @AI-HINT: Global error page with professional error handling and recovery options
// NOTE: global-error.tsx runs outside the normal app context, so we use <a> tags for navigation
/* eslint-disable @next/next/no-html-link-for-pages */
'use client';

import React, { useEffect } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import { PageTransition, ScrollReveal, LottieAnimation, errorAlertAnimation } from '@/app/components/Animations';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';

import common from './GlobalError.common.module.css';
import light from './GlobalError.light.module.css';
import dark from './GlobalError.dark.module.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorContent = ({ error, reset }: GlobalErrorProps) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <main className={cn(common.page, themed.page)}>
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
      <PageTransition>
        <ScrollReveal>
          <div className={common.container}>
            {/* Animated error illustration */}
            <LottieAnimation
              animationData={errorAlertAnimation}
              width={160}
              height={160}
              ariaLabel="Error occurred illustration"
              loop={false}
              keepLastFrame
              className="mx-auto mb-2"
            />

            {/* Error Icon */}
            <div className={cn(common.iconWrapper, themed.iconWrapper)}>
              <AlertTriangle className={common.icon} />
            </div>

            {/* Error Message */}
            <div className={common.messageWrapper}>
              <h1 className={common.title}>Something went wrong</h1>
              <p className={cn(common.description, themed.description)}>
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-red-500 font-mono mt-2">
                  {error.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className={common.actions}>
              <Button 
                onClick={reset} 
                variant="primary" 
                fullWidth 
                iconBefore={<RefreshCw size={16} />}
              >
                Try again
              </Button>
              
              <div className={cn(common.links, themed.links)}>
                <a href="/" className={cn(common.link, themed.link)}>
                  <Home size={16} />
                  <span>Go Home</span>
                </a>
                <a href="/contact" className={cn(common.link, themed.link)}>
                  <MessageCircle size={16} />
                  <span>Contact Support</span>
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </PageTransition>
    </main>
  );
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error);
    }
    
    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
           <ErrorContent error={error} reset={reset} />
        </ThemeProvider>
      </body>
    </html>
  );
}
