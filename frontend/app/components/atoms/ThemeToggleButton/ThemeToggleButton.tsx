// @AI-HINT: World-class floating theme toggle with Framer Motion, 3D transforms, magnetic hover, and glassmorphism
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import commonStyles from './ThemeToggleButton.common.module.css';
import lightStyles from './ThemeToggleButton.light.module.css';
import darkStyles from './ThemeToggleButton.dark.module.css';

const ThemeToggleButton: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Magnetic mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-100, 100], [15, -15]), {
    damping: 20,
    stiffness: 200,
  });
  const rotateY = useSpring(useTransform(mouseX, [-100, 100], [-15, 15]), {
    damping: 20,
    stiffness: 200,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const handleClick = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div className={commonStyles.themeToggleFloating}>
        <button className={commonStyles.themeToggleBtn} aria-label="Loading theme toggle">
          <Moon size={24} />
        </button>
      </div>
    );
  }

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={commonStyles.themeToggleFloating}>
      <motion.button
        ref={buttonRef}
        aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={cn(commonStyles.themeToggleBtn, themeStyles.themeToggleBtn)}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        {/* Floating particles effect on hover */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(commonStyles.particle, themeStyles.particle)}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 6) * 40,
                    y: Math.sin((i * Math.PI * 2) / 6) * 40,
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Icon with smooth transition */}
        <AnimatePresence mode="wait">
          {resolvedTheme === 'dark' ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0, scale: 0 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
              className={commonStyles.iconCenter}
            >
              <Sun size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0, scale: 0 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
              className={commonStyles.iconCenter}
            >
              <Moon size={24} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient glow ring */}
        <motion.div
          className={cn(commonStyles.glowRing, themeStyles.glowRing)}
          animate={{
            scale: isHovered ? [1, 1.15, 1] : 1,
            opacity: isHovered ? [0.5, 0.8, 0.5] : 0.3,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.button>
    </div>
  );
};

export default ThemeToggleButton;
