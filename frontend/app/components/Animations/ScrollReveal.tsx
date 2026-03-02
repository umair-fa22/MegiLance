// @AI-HINT: Scroll-triggered reveal animation wrapper using IntersectionObserver
'use client';

import React from 'react';
import styles from './ScrollReveal.module.css';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  width?: 'fit-content' | '100%';
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
  overflow?: 'hidden' | 'visible';
}

// Simplified ScrollReveal - no animations, just render children
// Animations disabled due to hydration issues
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  width = 'fit-content',
  className = '',
  overflow = 'visible',
  delay: _delay,
  duration: _duration,
  direction: _direction,
  distance: _distance,
  once: _once,
  threshold: _threshold,
  ...rest
}) => {
  const widthClass = width === '100%' ? styles.widthFull : styles.widthFit;
  const overflowClass = overflow === 'hidden' ? styles.overflowHidden : styles.overflowVisible;
  
  return (
    <div className={`${widthClass} ${overflowClass} ${className}`} {...rest}>
      {children}
    </div>
  );
};
