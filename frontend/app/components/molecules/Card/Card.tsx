// @AI-HINT: Premium Card component with 3D hover effects, glassmorphism, and premium styling. Supports multiple variants for polished UI.

'use client';

import React, { useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';
import { cn } from '@/lib/utils';

import commonStyles from './Card.common.module.css';
import lightStyles from './Card.light.module.css';
import darkStyles from './Card.dark.module.css';

export interface CardProps {
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outline' | 'filled' | 'glass' | 'premium' | 'holographic';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  enable3D?: boolean;
  intensity3D?: number;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  className = '',
  variant = 'default',
  size = 'md',
  loading = false,
  enable3D = false,
  intensity3D = 15,
  onClick
}) => {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  // Motion values for 3D effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  // Calculate rotation based on mouse position
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [intensity3D, -intensity3D]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-intensity3D, intensity3D]);

  // Calculate shine position
  const shineX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"]);
  const shineBackground = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgba(255, 255, 255, 0.15), transparent 50%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || (!enable3D && variant !== 'premium' && variant !== 'holographic')) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate normalized mouse position from center (-0.5 to 0.5)
    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;

    x.set(mouseXFromCenter / width);
    y.set(mouseYFromCenter / height);
  };

  const handleMouseLeave = () => {
    if (!enable3D && variant !== 'premium' && variant !== 'holographic') return;
    x.set(0);
    y.set(0);
  };

  if (!resolvedTheme) {
    return null; // Don't render until theme is resolved to prevent flash
  }

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  const is3DEnabled = enable3D || variant === 'premium' || variant === 'holographic';

  return (
    <motion.div 
      ref={ref}
      className={cn(
        commonStyles.card,
        themeStyles.card,
        commonStyles[`variant-${variant}`],
        themeStyles[`variant-${variant}`],
        commonStyles[`size-${size}`],
        loading && commonStyles.loading,
        is3DEnabled && commonStyles.card3D,
        className
      )}
      style={{
        rotateX: is3DEnabled ? rotateX : 0,
        rotateY: is3DEnabled ? rotateY : 0,
        perspective: 1000,
        transformStyle: "preserve-3d"
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!is3DEnabled ? { y: -5, transition: { duration: 0.2 } } : undefined}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onClick}
    >
      {/* Premium shine overlay for 3D effect */}
      {is3DEnabled && (
        <motion.div 
          className={commonStyles.shineOverlay}
          style={{
            background: shineBackground
          }}
        />
      )}
      
      {title && (
        <div className={cn(commonStyles.cardHeader, themeStyles.cardHeader)}>
          {Icon && <Icon className={cn(commonStyles.cardIcon, themeStyles.cardIcon)} size={24} />}
          <h3 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>{title}</h3>
        </div>
      )}
      <div className={cn(commonStyles.cardContent, themeStyles.cardContent)}>
        {children}
      </div>
    </motion.div>
  );
};

export default Card;
