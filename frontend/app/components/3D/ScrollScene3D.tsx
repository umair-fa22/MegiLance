// @AI-HINT: Premium scroll-triggered 3D scene component - Dora/Linear-style parallax and 3D animations
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import styles from './ScrollScene3D.common.module.css';

// ==========================================
// SCROLL PROGRESS HOOK
// ==========================================
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
      setProgress(Math.min(Math.max(currentProgress, 0), 1));
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { progress, scrollY };
}

// ==========================================
// INTERSECTION OBSERVER HOOK
// ==========================================
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [viewProgress, setViewProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) {
          setViewProgress(entry.intersectionRatio);
        }
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView, viewProgress };
}

// ==========================================
// 3D FLOATING DEVICE (Phone/Laptop mockup)
// ==========================================
export function FloatingDevice3D({
  type = 'phone',
  children,
  className = ''
}: {
  type?: 'phone' | 'laptop' | 'tablet';
  children?: React.ReactNode;
  className?: string;
}) {
  const { scrollY } = useScrollProgress();
  const { ref, isInView, viewProgress } = useInView();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isInView) {
      const rotateX = -10 + viewProgress * 15;
      const rotateY = -15 + viewProgress * 30;
      setRotation({ x: rotateX, y: rotateY });
    }
  }, [isInView, viewProgress]);

  return (
    <div 
      ref={ref}
      className={`${styles.deviceContainer} ${styles[type]} ${className}`}
      style={{
        transform: `perspective(1200px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(${isInView ? 50 : 0}px)`,
        opacity: isInView ? 1 : 0.3
      }}
    >
      <div className={styles.deviceFrame}>
        <div className={styles.deviceScreen}>
          {children}
        </div>
        <div className={styles.deviceReflection} />
      </div>
      <div className={styles.deviceShadow} />
    </div>
  );
}

// ==========================================
// PARALLAX 3D LAYERS (Dora-style depth)
// ==========================================
export function ParallaxLayers3D({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { scrollY } = useScrollProgress();
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      const relativeScroll = scrollY - elementTop + window.innerHeight;
      setOffset(relativeScroll * 0.1);
    }
  }, [scrollY]);

  return (
    <div ref={containerRef} className={`${styles.parallaxContainer} ${className}`}>
      <div className={styles.parallaxLayer} style={{ transform: `translateZ(-300px) translateY(${offset * 0.5}px) scale(1.3)` }}>
        <div className={styles.parallaxOrb} style={{ background: 'radial-gradient(circle, rgba(69, 115, 223, 0.3), transparent 70%)' }} />
      </div>
      <div className={styles.parallaxLayer} style={{ transform: `translateZ(-200px) translateY(${offset * 0.3}px) scale(1.2)` }}>
        <div className={styles.parallaxOrb} style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25), transparent 70%)' }} />
      </div>
      <div className={styles.parallaxLayer} style={{ transform: `translateZ(-100px) translateY(${offset * 0.15}px) scale(1.1)` }}>
        <div className={styles.parallaxGrid} />
      </div>
      <div className={styles.parallaxLayer} style={{ transform: 'translateZ(0)' }}>
        {children}
      </div>
    </div>
  );
}

// ==========================================
// SCROLL-TRIGGERED 3D CARD STACK
// ==========================================
export function CardStack3D({
  cards,
  className = ''
}: {
  cards: Array<{ title: string; description: string; icon?: React.ReactNode; color?: string }>;
  className?: string;
}) {
  const { ref, isInView, viewProgress } = useInView();

  return (
    <div ref={ref} className={`${styles.cardStack} ${className}`}>
      {cards.map((card, index) => {
        const delay = index * 0.1;
        const translateZ = isInView ? index * -30 : index * -60;
        const translateY = isInView ? index * 20 : index * 40;
        const rotateX = isInView ? -5 + viewProgress * 10 : -15;
        const opacity = isInView ? 1 - index * 0.15 : 0.3;
        const scale = 1 - index * 0.05;

        return (
          <div
            key={index}
            className={styles.stackCard}
            style={{
              transform: `perspective(1000px) translateZ(${translateZ}px) translateY(${translateY}px) rotateX(${rotateX}deg) scale(${scale})`,
              opacity,
              transitionDelay: `${delay}s`,
              background: card.color || `linear-gradient(135deg, rgba(69, 115, 223, 0.1), rgba(139, 92, 246, 0.1))`
            }}
          >
            {card.icon && <div className={styles.cardIcon}>{card.icon}</div>}
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDescription}>{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 3D ROTATING SHOWCASE
// ==========================================
export function RotatingShowcase3D({
  items,
  className = ''
}: {
  items: Array<{ content: React.ReactNode; label?: string }>;
  className?: string;
}) {
  const { progress } = useScrollProgress();
  const [activeIndex, setActiveIndex] = useState(0);
  const anglePerItem = 360 / items.length;

  useEffect(() => {
    const newIndex = Math.floor(progress * items.length * 2) % items.length;
    setActiveIndex(newIndex);
  }, [progress, items.length]);

  return (
    <div className={`${styles.showcaseContainer} ${className}`}>
      <div 
        className={styles.showcaseCarousel}
        style={{ transform: `rotateY(${-activeIndex * anglePerItem}deg)` }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={styles.showcaseItem}
            style={{
              transform: `rotateY(${index * anglePerItem}deg) translateZ(300px)`
            }}
          >
            {item.content}
            {item.label && <span className={styles.showcaseLabel}>{item.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SCROLL-TRIGGERED TEXT REVEAL 3D
// ==========================================
export function TextReveal3D({
  text,
  className = ''
}: {
  text: string;
  className?: string;
}) {
  const { ref, isInView, viewProgress } = useInView();
  const words = text.split(' ');

  return (
    <div ref={ref} className={`${styles.textReveal} ${className}`}>
      {words.map((word, index) => {
        const delay = index * 0.05;
        const progress = Math.max(0, Math.min(1, (viewProgress - delay) * 2));
        
        return (
          <span
            key={index}
            className={styles.revealWord}
            style={{
              transform: `perspective(500px) rotateX(${90 - progress * 90}deg) translateY(${(1 - progress) * 30}px)`,
              opacity: progress,
              transitionDelay: `${delay}s`
            }}
          >
            {word}{' '}
          </span>
        );
      })}
    </div>
  );
}

// ==========================================
// 3D FLOATING ICONS ORBIT
// ==========================================
export function IconOrbit3D({
  icons,
  size = 200,
  className = ''
}: {
  icons: React.ReactNode[];
  size?: number;
  className?: string;
}) {
  const { progress } = useScrollProgress();
  const rotation = progress * 360;

  return (
    <div 
      className={`${styles.orbitContainer} ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className={styles.orbitRing}
        style={{ transform: `rotateX(70deg) rotateZ(${rotation}deg)` }}
      >
        {icons.map((icon, index) => {
          const angle = (index / icons.length) * 360;
          return (
            <div
              key={index}
              className={styles.orbitIcon}
              style={{
                transform: `rotate(${angle}deg) translateX(${size / 2 - 20}px) rotate(${-angle - rotation}deg)`
              }}
            >
              {icon}
            </div>
          );
        })}
      </div>
      <div className={styles.orbitCenter}>
        <div className={styles.orbitGlow} />
      </div>
    </div>
  );
}

// ==========================================
// 3D SCROLL-TRIGGERED TIMELINE
// ==========================================
export function Timeline3D({
  items,
  className = ''
}: {
  items: Array<{ title: string; description: string; date?: string; icon?: React.ReactNode }>;
  className?: string;
}) {
  const { progress } = useScrollProgress();

  return (
    <div className={`${styles.timeline} ${className}`}>
      <div className={styles.timelineLine}>
        <div 
          className={styles.timelineProgress}
          style={{ height: `${progress * 100}%` }}
        />
      </div>
      {items.map((item, index) => {
        const itemProgress = Math.max(0, Math.min(1, (progress * items.length) - index + 0.5));
        
        return (
          <div
            key={index}
            className={`${styles.timelineItem} ${index % 2 === 0 ? styles.left : styles.right}`}
            style={{
              transform: `perspective(1000px) translateX(${(1 - itemProgress) * (index % 2 === 0 ? -100 : 100)}px) rotateY(${(1 - itemProgress) * (index % 2 === 0 ? -30 : 30)}deg)`,
              opacity: itemProgress
            }}
          >
            <div className={styles.timelineCard}>
              {item.icon && <div className={styles.timelineIcon}>{item.icon}</div>}
              {item.date && <span className={styles.timelineDate}>{item.date}</span>}
              <h4 className={styles.timelineTitle}>{item.title}</h4>
              <p className={styles.timelineDescription}>{item.description}</p>
            </div>
            <div className={styles.timelineDot} />
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 3D HERO SCENE (Full-page 3D background)
// ==========================================
export function HeroScene3D({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { scrollY } = useScrollProgress();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  }, []);

  return (
    <div 
      className={`${styles.heroScene} ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Floating geometric shapes */}
      <div 
        className={styles.heroShape}
        style={{
          transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2 - scrollY * 0.3}px, 0) rotateX(${scrollY * 0.1}deg) rotateY(${scrollY * 0.05}deg)`
        }}
      >
        <div className={styles.heroCube}>
          <div className={`${styles.heroCubeFace} ${styles.front}`} />
          <div className={`${styles.heroCubeFace} ${styles.back}`} />
          <div className={`${styles.heroCubeFace} ${styles.right}`} />
          <div className={`${styles.heroCubeFace} ${styles.left}`} />
          <div className={`${styles.heroCubeFace} ${styles.top}`} />
          <div className={`${styles.heroCubeFace} ${styles.bottom}`} />
        </div>
      </div>

      {/* Floating spheres */}
      <div 
        className={`${styles.heroSphere} ${styles.sphere1}`}
        style={{
          transform: `translate3d(${mousePos.x * -1.5}px, ${mousePos.y * -1.5 - scrollY * 0.2}px, 0)`
        }}
      />
      <div 
        className={`${styles.heroSphere} ${styles.sphere2}`}
        style={{
          transform: `translate3d(${mousePos.x * 1}px, ${mousePos.y * 1 - scrollY * 0.15}px, 0)`
        }}
      />
      <div 
        className={`${styles.heroSphere} ${styles.sphere3}`}
        style={{
          transform: `translate3d(${mousePos.x * -0.5}px, ${mousePos.y * -0.5 - scrollY * 0.1}px, 0)`
        }}
      />

      {/* Floating rings */}
      <div 
        className={styles.heroRing}
        style={{
          transform: `translate3d(${mousePos.x * 0.8}px, ${-scrollY * 0.25}px, 0) rotateX(${70 + scrollY * 0.05}deg) rotateZ(${scrollY * 0.1}deg)`
        }}
      />

      {/* Grid floor */}
      <div 
        className={styles.heroGrid}
        style={{
          transform: `perspective(1000px) rotateX(${60 + scrollY * 0.02}deg) translateY(${scrollY * 0.3}px)`
        }}
      />

      {/* Content */}
      <div className={styles.heroContent}>
        {children}
      </div>
    </div>
  );
}

// ==========================================
// 3D BENTO GRID
// ==========================================
export function BentoGrid3D({
  items,
  className = ''
}: {
  items: Array<{ 
    content: React.ReactNode; 
    size?: 'small' | 'medium' | 'large';
    color?: string;
  }>;
  className?: string;
}) {
  const { ref, isInView } = useInView();

  return (
    <div ref={ref} className={`${styles.bentoGrid} ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`${styles.bentoItem} ${styles[item.size || 'medium']}`}
          style={{
            transform: isInView 
              ? 'perspective(1000px) rotateX(0deg) translateY(0)' 
              : `perspective(1000px) rotateX(-10deg) translateY(${50 + index * 20}px)`,
            opacity: isInView ? 1 : 0,
            transitionDelay: `${index * 0.1}s`,
            background: item.color
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}

// Default export
const ScrollScene3D = {
  FloatingDevice3D,
  ParallaxLayers3D,
  CardStack3D,
  RotatingShowcase3D,
  TextReveal3D,
  IconOrbit3D,
  Timeline3D,
  HeroScene3D,
  BentoGrid3D
};

export default ScrollScene3D;
