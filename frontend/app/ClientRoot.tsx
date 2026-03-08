// @AI-HINT: Single client boundary to host providers and app chrome. This reduces RSC client-manifest issues.
'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import AppChrome from './components/AppChrome/AppChrome';
import { ToasterProvider } from './components/Toast/ToasterProvider';
import QuickLogin from '@/app/components/QuickLogin/QuickLogin';
import StructuredData from '@/app/shared/StructuredData';
import { AnalyticsProvider } from '@/app/shared/analytics/AnalyticsProvider';
import WebVitalsReporter from './components/Analytics/WebVitalsReporter';
import CookieConsent from './components/CookieConsent/CookieConsent';
import ErrorBoundary from '@/app/components/ErrorBoundary/ErrorBoundary';
import { WebSocketProvider } from '@/lib/websocket';

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
            </ToasterProvider>
          </WebSocketProvider>
        </AnalyticsProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default ClientRoot;