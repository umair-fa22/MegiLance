// @AI-HINT: Animated stagger container using Framer Motion. Children animate in sequentially with spring physics. Uses useInView for scroll-triggered entrance and suppressHydrationWarning for SSR safety.
'use client';

import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24,
    },
  },
};

interface StaggerContainerProps {
  children: React.ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
  id?: string;
  role?: string;
  'aria-label'?: string;
  disableAnimation?: boolean;
  triggerOnView?: boolean;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  delay = 0,
  staggerDelay = 0.08,
  disableAnimation = false,
  triggerOnView = false,
  id,
  role,
  'aria-label': ariaLabel,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  if (disableAnimation) {
    return (
      <div id={id} role={role} className={className} aria-label={ariaLabel}>
        {children}
      </div>
    );
  }

  const shouldAnimate = triggerOnView ? isInView : true;

  return (
    <motion.div
      ref={ref}
      id={id}
      role={role}
      className={className}
      aria-label={ariaLabel}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      animate={shouldAnimate ? 'visible' : 'hidden'}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tabIndex?: number;
  role?: string;
  'aria-labelledby'?: string;
  onClick?: () => void;
  /** Custom animation variant override */
  variant?: 'fade' | 'slide' | 'scale' | 'blur';
}

const variantMap: Record<string, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
  },
  slide: itemVariants,
  scale: {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
  },
  blur: itemVariants,
};

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  style,
  tabIndex,
  role,
  'aria-labelledby': ariaLabelledby,
  onClick,
  variant = 'blur',
}) => {
  return (
    <motion.div
      className={className}
      style={style}
      tabIndex={tabIndex}
      role={role}
      aria-labelledby={ariaLabelledby}
      onClick={onClick}
      variants={variantMap[variant] || itemVariants}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
};
