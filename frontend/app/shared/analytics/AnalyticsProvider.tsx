// @AI-HINT: Basic analytics context capturing page views & custom events.
'use client';
import React, { createContext, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface AnalyticsContextValue {
  track: (name: string, props?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

const queue: any[] = [];

// Isolated component that uses useSearchParams (which suspends during SSR)
// Wrapped in its own Suspense boundary so children are NOT part of the fallback tree
const SearchParamsTracker: React.FC<{ onParams: (params: string) => void }> = ({ onParams }) => {
  const search = useSearchParams();
  useEffect(() => {
    onParams(search?.toString() ?? '');
  }, [search, onParams]);
  return null; // renders nothing
};

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const lastRef = useRef<string | null>(null);
  const [searchStr, setSearchStr] = useState('');

  const flush = () => {
    if (typeof window === 'undefined') return;
    if (queue.length) {
      queue.splice(0);
    }
  };

  const track = useCallback((name: string, props?: Record<string, any>) => {
    queue.push({ name, props, t: Date.now() });
  }, []);

  const handleParams = useCallback((params: string) => {
    setSearchStr(params);
  }, []);

  // Track page view
  useEffect(() => {
    const key = pathname + (searchStr ? '?' + searchStr : '');
    if (lastRef.current !== key) {
      track('page_view', { path: pathname, search: searchStr });
      lastRef.current = key;
      flush();
    }
  }, [pathname, searchStr, track]);

  return (
    <AnalyticsContext.Provider value={{ track }}>
      <Suspense fallback={null}>
        <SearchParamsTracker onParams={handleParams} />
      </Suspense>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return ctx;
};