// @AI-HINT: Premium 3D CSS Objects Component - Enhanced visual elements for premium UI
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import styles from './ThreeD.common.module.css';

// ==========================================
// 3D FLOATING CUBE
// ==========================================
export function FloatingCube({ 
  size = 60, 
  className = '' 
}: { 
  size?: number; 
  className?: string;
}) {
  return (
    <div 
      className={`${styles.cube} ${className}`}
      style={{ 
        width: size, 
        height: size,
        '--cube-size': `${size / 2}px`
      } as React.CSSProperties}
    >
      <div className={`${styles.cubeFace} ${styles.front}`} />
      <div className={`${styles.cubeFace} ${styles.back}`} />
      <div className={`${styles.cubeFace} ${styles.right}`} />
      <div className={`${styles.cubeFace} ${styles.left}`} />
      <div className={`${styles.cubeFace} ${styles.top}`} />
      <div className={`${styles.cubeFace} ${styles.bottom}`} />
    </div>
  );
}

// ==========================================
// 3D FLOATING SPHERE
// ==========================================
export function FloatingSphere({ 
  size = 80, 
  variant = 'blue',
  className = '' 
}: { 
  size?: number;
  variant?: 'blue' | 'purple' | 'orange' | 'gradient';
  className?: string;
}) {
  return (
    <div 
      className={`${styles.sphere} ${styles[`sphere${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ==========================================
// 3D FLOATING RING
// ==========================================
export function FloatingRing({ 
  size = 100, 
  thickness = 8,
  className = '' 
}: { 
  size?: number;
  thickness?: number;
  className?: string;
}) {
  return (
    <div 
      className={`${styles.ring} ${className}`}
      style={{ 
        width: size, 
        height: size,
        borderWidth: thickness
      }}
    />
  );
}

// ==========================================
// 3D FLOATING TORUS (Donut)
// ==========================================
export function FloatingTorus({ 
  size = 80, 
  className = '' 
}: { 
  size?: number;
  className?: string;
}) {
  return (
    <div 
      className={`${styles.torus} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ==========================================
// 3D ANIMATED ORB (Background decoration)
// ==========================================
export function AnimatedOrb({ 
  size = 300, 
  variant = 'blue',
  blur = 40,
  opacity = 0.6,
  className = '' 
}: { 
  size?: number;
  variant?: 'blue' | 'purple' | 'orange' | 'gradient';
  blur?: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <div 
      className={`${styles.orb} ${styles[`orb${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}
      style={{ 
        width: size, 
        height: size,
        filter: `blur(${blur}px)`,
        opacity
      }}
    />
  );
}

// ==========================================
// 3D PARTICLES SYSTEM
// ==========================================
export function ParticlesSystem({ 
  count = 8,
  className = '' 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={`${styles.particles} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.particle} />
      ))}
    </div>
  );
}

// ==========================================
// 3D ORBITING ELEMENTS
// ==========================================
export function OrbitingElements({ 
  count = 4,
  size = 200,
  className = '' 
}: { 
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div 
      className={`${styles.orbitContainer} ${className}`}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={styles.orbitElement}
          style={{ animationDelay: `${-i * (8 / count)}s` }}
        />
      ))}
    </div>
  );
}

// ==========================================
// 3D INTERACTIVE HOVER CARD
// ==========================================
export function HoverCard3D({ 
  children,
  className = '',
  intensity = 15
}: { 
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  };

  return (
    <div
      ref={cardRef}
      className={`${styles.hoverCard3D} ${className}`}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// ==========================================
// 3D FLIP CARD
// ==========================================
export function FlipCard3D({ 
  front,
  back,
  className = ''
}: { 
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.flipContainer} ${className}`}>
      <div className={styles.flipper}>
        <div className={styles.flipFront}>{front}</div>
        <div className={styles.flipBack}>{back}</div>
      </div>
    </div>
  );
}

// ==========================================
// 3D GLASS CARD
// ==========================================
export function GlassCard3D({ 
  children,
  className = ''
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`${styles.glassCard} ${resolvedTheme === 'dark' ? styles.dark : styles.light} ${className}`}>
      {children}
    </div>
  );
}

// ==========================================
// 3D FLOATING BADGE
// ==========================================
export function FloatingBadge3D({ 
  children,
  variant = 'primary',
  className = ''
}: { 
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'gradient';
  className?: string;
}) {
  return (
    <div className={`${styles.badge3D} ${styles[`badge${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}>
      {children}
    </div>
  );
}

// ==========================================
// 3D ICON CONTAINER
// ==========================================
export function Icon3D({ 
  children,
  size = 60,
  className = ''
}: { 
  children: React.ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <div 
      className={`${styles.icon3D} ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

// ==========================================
// 3D DEPTH BUTTON
// ==========================================
export function Button3D({ 
  children,
  onClick,
  variant = 'primary',
  className = ''
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  className?: string;
}) {
  return (
    <button 
      className={`${styles.button3D} ${styles[`btn${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ==========================================
// 3D BACKGROUND SCENE
// ==========================================
export function BackgroundScene3D({ 
  className = '',
  showGrid = true,
  showOrbs = true,
  showParticles = true
}: { 
  className?: string;
  showGrid?: boolean;
  showOrbs?: boolean;
  showParticles?: boolean;
}) {
  return (
    <div className={`${styles.backgroundScene} ${className}`}>
      {showGrid && <div className={styles.grid3D} />}
      {showOrbs && (
        <>
          <AnimatedOrb variant="blue" size={400} className={styles.orbTopRight} />
          <AnimatedOrb variant="purple" size={350} className={styles.orbBottomLeft} />
          <AnimatedOrb variant="orange" size={250} className={styles.orbCenter} />
        </>
      )}
      {showParticles && <ParticlesSystem count={12} />}
    </div>
  );
}

// ==========================================
// 3D STATS CARD
// ==========================================
export function StatsCard3D({ 
  icon,
  value,
  label,
  trend,
  className = ''
}: { 
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}) {
  return (
    <div className={`${styles.statsCard3D} ${className}`}>
      <div className={styles.statsIcon}>{icon}</div>
      <div className={styles.statsContent}>
        <div className={styles.statsValue}>{value}</div>
        <div className={styles.statsLabel}>{label}</div>
        {trend && (
          <div className={`${styles.statsTrend} ${trend.positive ? styles.positive : styles.negative}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3D SECTION DIVIDER
// ==========================================
export function SectionDivider3D({ 
  className = '' 
}: { 
  className?: string;
}) {
  return <div className={`${styles.sectionDivider} ${className}`} />;
}

// ==========================================
// MAGNETIC CURSOR ELEMENT - PREMIUM
// ==========================================
export function MagneticElement({ 
  children,
  className = '',
  strength = 0.3,
  radius = 100
}: { 
  children: React.ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      if (distance < radius) {
        setIsHovering(true);
        const pull = (1 - distance / radius) * strength;
        setPosition({
          x: distX * pull,
          y: distY * pull
        });
      } else {
        setIsHovering(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setPosition({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, radius]);

  return (
    <div
      ref={elementRef}
      className={`${styles.magneticElement} ${isHovering ? styles.magneticActive : ''} ${className}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isHovering ? 'transform 0.15s ease-out' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      {children}
    </div>
  );
}

// ==========================================
// AURORA WRAPPER - PREMIUM
// ==========================================
export function AuroraWrapper({ 
  children,
  className = '',
  intensity = 1
}: { 
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  return (
    <div className={`${styles.auroraWrapper} ${className}`}>
      <div 
        className={styles.auroraBackground}
        style={{ opacity: 0.15 * intensity }}
      />
      <div className={styles.auroraContent}>
        {children}
      </div>
    </div>
  );
}

// ==========================================
// LIQUID METAL CARD - PREMIUM
// ==========================================
export function LiquidMetalCard({ 
  children,
  className = ''
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.liquidMetalCard} ${className}`}>
      <div className={styles.liquidMetal} />
      <div className={styles.liquidMetalContent}>
        {children}
      </div>
    </div>
  );
}

// ==========================================
// HOLOGRAPHIC BADGE - PREMIUM
// ==========================================
export function HolographicBadge({ 
  children,
  className = '',
  variant = 'default'
}: { 
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'exclusive';
}) {
  return (
    <div className={`${styles.holographicBadge} ${styles[`holo${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}>
      <div className={styles.holoShimmer} />
      <div className={styles.holoBadgeContent}>
        {children}
      </div>
    </div>
  );
}

// ==========================================
// DEPTH PARALLAX CONTAINER - PREMIUM
// ==========================================
export function DepthParallax({ 
  children,
  className = '',
  layers = 3
}: { 
  children: React.ReactNode;
  className?: string;
  layers?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      });
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    return () => container?.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className={`${styles.depthParallax} ${className}`}>
      {Array.from({ length: layers }).map((_, i) => (
        <div
          key={i}
          className={styles.parallaxLayer}
          style={{
            transform: `translate3d(${(mousePosition.x - 0.5) * (i + 1) * 20}px, ${(mousePosition.y - 0.5) * (i + 1) * 20}px, ${i * 50}px)`,
            zIndex: layers - i
          }}
        />
      ))}
      <div className={styles.parallaxContent}>{children}</div>
    </div>
  );
}

// ==========================================
// GLOW BUTTON - PREMIUM
// ==========================================
export function GlowButton3D({ 
  children,
  onClick,
  className = '',
  variant = 'primary'
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'premium';
}) {
  return (
    <button 
      className={`${styles.glowButton3D} ${styles[`glow${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${className}`}
      onClick={onClick}
    >
      <span className={styles.glowButtonInner}>{children}</span>
      <span className={styles.glowButtonShine} />
      <span className={styles.glowButtonRing} />
    </button>
  );
}

// Default export for convenience
const ThreeD = {
  FloatingCube,
  FloatingSphere,
  FloatingRing,
  FloatingTorus,
  AnimatedOrb,
  ParticlesSystem,
  OrbitingElements,
  HoverCard3D,
  FlipCard3D,
  GlassCard3D,
  FloatingBadge3D,
  Icon3D,
  Button3D,
  BackgroundScene3D,
  StatsCard3D,
  SectionDivider3D,
  // Premium components
  MagneticElement,
  AuroraWrapper,
  LiquidMetalCard,
  HolographicBadge,
  DepthParallax,
  GlowButton3D
};

export default ThreeD;
