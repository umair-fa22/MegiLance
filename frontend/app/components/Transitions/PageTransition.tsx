// @AI-HINT: Premium page transition wrapper for smooth route change effects using per-component CSS modules
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import styles from './PageTransition.common.module.css';
import light from './PageTransition.light.module.css';
import dark from './PageTransition.dark.module.css';

export type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
  theme?: 'light' | 'dark';
  variant?: 'fade' | 'slide' | 'scale';
};

// Separate client component for the logic that uses hooks
const PageTransitionClient: React.FC<PageTransitionProps> = ({ children, className, theme: themeProp, variant = 'fade' }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const currentTheme = themeProp || (mounted ? resolvedTheme : undefined);
  const [pathname, setPathname] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    setMounted(true);
    setPathname(window.location.pathname);
  }, []);

  const themeClass = currentTheme === 'dark' ? dark.theme : light.theme;

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    // Move keyboard focus to the new page content on navigation for accessibility
    wrapperRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div
      ref={wrapperRef}
      className={[styles.base, themeClass, className].filter(Boolean).join(' ')}
      role="region"
      aria-label="Page content"
      tabIndex={-1}
    >
      {children}
    </div>
  );
};

// Server component
const PageTransition: React.FC<PageTransitionProps> = (props) => {
  return <PageTransitionClient {...props} />;
};

export default PageTransition;
