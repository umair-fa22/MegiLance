// @AI-HINT: Single client boundary to host providers and app chrome. This reduces RSC client-manifest issues.
'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import AppChrome from './components/organisms/AppChrome/AppChrome';
import { ToasterProvider } from './components/molecules/Toast/ToasterProvider';
import QuickLogin from '@/app/components/organisms/QuickLogin/QuickLogin';
import StructuredData from '@/app/shared/StructuredData';
import { AnalyticsProvider } from '@/app/shared/analytics/AnalyticsProvider';
import WebVitalsReporter from './components/Analytics/WebVitalsReporter';
import CookieConsent from './components/organisms/CookieConsent/CookieConsent';
import ErrorBoundary from '@/app/components/organisms/ErrorBoundary/ErrorBoundary';
import OnboardingTour from './components/molecules/OnboardingTour/OnboardingTour';
import { WebSocketProvider } from '@/lib/websocket';
import { I18nProvider } from '@/lib/i18n/I18nContext';

const ClientRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={true}
      enableColorScheme={true}
      storageKey="megilance-theme"
    >
      <ErrorBoundary>
        <I18nProvider>
          <AnalyticsProvider>
            <WebSocketProvider>
              <ToasterProvider>
                <AppChrome>
                  {children}
                </AppChrome>
                <QuickLogin />
                <StructuredData />
                <WebVitalsReporter />
                <CookieConsent />
                <OnboardingTour />
              </ToasterProvider>
            </WebSocketProvider>
          </AnalyticsProvider>
        </I18nProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default ClientRoot;
