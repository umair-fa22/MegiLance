// @AI-HINT: Animated background component with floating particles for enhanced visual appeal.
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

import commonStyles from './AnimatedBackground.common.module.css';
import lightStyles from './AnimatedBackground.light.module.css';
import darkStyles from './AnimatedBackground.dark.module.css';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

const AnimatedBackground: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      // Reduce particle count for a cleaner look
      const particleCount = Math.min(30, Math.floor(window.innerWidth / 20));
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          // Smaller particles
          size: Math.random() * 2 + 0.5,
          // Slower movement
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          color: resolvedTheme === 'dark' ? 'rgba(69, 115, 223, 0.2)' : 'rgba(69, 115, 223, 0.1)',
          // More consistent opacity
          opacity: Math.random() * 0.3 + 0.1
        });
      }
    };
    
    initParticles();
    
    // Animation loop
    const animate = () => {
      if (!ctx) return;
      
      // Clear canvas with a semi-transparent fill for trail effect
      ctx.fillStyle = resolvedTheme === 'dark' ? 'rgba(15, 23, 42, 0.05)' : 'rgba(248, 250, 252, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles (removed connecting lines for cleaner look)
      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x <= 0 || particle.x >= canvas.width) particle.speedX *= -1;
        if (particle.y <= 0 || particle.y >= canvas.height) particle.speedY *= -1;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [resolvedTheme]);
  
  return (
    <div className={cn(commonStyles.container)}>
      <canvas 
        ref={canvasRef} 
        className={cn(commonStyles.canvas, themeStyles.canvas)}
      />
    </div>
  );
};

export default AnimatedBackground;
