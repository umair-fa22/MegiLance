// @AI-HINT: Premium Hero component - the production-ready first impression. Features animated gradient mesh background, glassmorphism cards, floating 3D elements, and engaging micro-interactions.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  PlayCircle, 
  Sparkles, 
  ShieldCheck, 
  Bot, 
  Globe, 
  Star, 
  Users, 
  TrendingUp, 
  Award,
  Zap,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

import Button from '@/app/components/Button/Button';
import StatItem from './StatItem';
import { 
  FloatingCube, 
  FloatingSphere, 
  FloatingRing, 
  ParticlesSystem,
  OrbitingElements 
} from '@/app/components/3D';

import commonStyles from './Hero.common.module.css';
import lightStyles from './Hero.light.module.css';
import darkStyles from './Hero.dark.module.css';

const Hero: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Interactive mouse tracking for premium parallax effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setMousePosition({ x: x * 20, y: y * 20 });
  }, []);

  if (!mounted) {
    return (
      <section className={cn(commonStyles.heroContainer)} aria-label="Hero">
        <div className={commonStyles.contentWrapper}>
          <div className={commonStyles.loadingContainer}>
            <div className={commonStyles.loadingSpinner} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={cn(commonStyles.heroContainer, styles.heroContainer)}
      onMouseMove={handleMouseMove}
      aria-label="Hero"
    >
      {/* Premium animated mesh gradient background */}
      <div className={cn(commonStyles.meshBackground, styles.meshBackground)} />
      
      {/* Background particles - REMOVED */}
      
      {/* Floating orbs with parallax - REMOVED */}

      {/* Grid pattern overlay */}
      <div className={cn(commonStyles.gridPattern, styles.gridPattern)} />

      <div className={commonStyles.contentWrapper}>
        <div className={commonStyles.heroGrid}>
          {/* Left Column: Content */}
          <div className={commonStyles.leftColumn}>
            {/* Announcement badge */}
            <Link 
              href="/features" 
              className={cn(
                commonStyles.announcementBadge, 
                styles.announcementBadge,
                isVisible && commonStyles.fadeInUp,
                commonStyles.delay1
              )}
            >
              <span className={cn(commonStyles.badgeIcon, styles.badgeIcon)}>
                <Sparkles size={14} />
              </span>
              <span className={commonStyles.badgeText}>
                New: AI-powered instant matching is here
              </span>
              <ChevronRight size={16} className={commonStyles.badgeArrow} />
            </Link>

            {/* Main headline with gradient text */}
            <h1 
              className={cn(
                commonStyles.mainHeading, 
                styles.mainHeading,
                isVisible && commonStyles.fadeInUp,
                commonStyles.delay2
              )}
            >
              <span className={commonStyles.headingLine}>Where Elite Talent</span>
              <span className={cn(commonStyles.headingGradient, styles.headingGradient)}>
                Meets Innovation
              </span>
            </h1>

            {/* Value proposition */}
            <p 
              className={cn(
                commonStyles.subheading, 
                styles.subheading,
                isVisible && commonStyles.fadeInUp,
                commonStyles.delay3
              )}
            >
              Experience the future of work with MegiLance. Our AI-powered matching engine connects elite talent 
              with innovative projects instantly, while blockchain integration ensures secure, low-fee payments. 
              Built for the modern gig economy.
            </p>

            {/* CTA buttons */}
            <div 
              className={cn(
                commonStyles.ctaGroup,
                isVisible && commonStyles.fadeInUp,
                commonStyles.delay4
              )}
            >
              <Link href="/post-project" className={commonStyles.ctaLink}>
                <Button 
                  variant="primary" 
                  size="lg" 
                  className={cn(commonStyles.primaryCta, styles.primaryCta)}
                >
                  Post a Project Free
                  <ArrowRight size={18} className={commonStyles.ctaIcon} />
                </Button>
              </Link>
              <Link href="/signup" className={commonStyles.ctaLink}>
                <Button 
                  variant="outline" 
                  size="lg"
                  className={cn(commonStyles.secondaryCta, styles.secondaryCta)}
                >
                  <PlayCircle size={18} />
                  Join as Freelancer
                </Button>
              </Link>
            </div>

            {/* Social proof row - REMOVED as per user request */}
            
             {/* Trust badges - REMOVED as per user request */}
          </div>

          {/* Right Column: 3D Visuals */}
          <div className={commonStyles.rightColumn}>
            <div className={commonStyles.visualContainer}>
               {/* Enhanced 3D floating objects - Repositioned for Right Column */}
              <div className={cn(commonStyles.floating3D, commonStyles.floating3DTopLeft)}>
                <FloatingCube size={50} />
              </div>
              <div className={cn(commonStyles.floating3D, commonStyles.floating3DTopRight)}>
                <FloatingSphere size={70} variant="purple" />
              </div>
              <div className={cn(commonStyles.floating3D, commonStyles.floating3DBottomLeft)}>
                <FloatingRing size={80} thickness={6} />
              </div>
              <div className={cn(commonStyles.floating3D, commonStyles.floating3DBottomRight)}>
                <FloatingSphere size={55} variant="orange" />
              </div>
              <div className={cn(commonStyles.floating3D, commonStyles.floating3DCenterRight)}>
                <FloatingCube size={35} />
              </div>
              <div className={cn(commonStyles.floating3D, commonStyles.floating3DCenterLeft)}>
                <OrbitingElements count={4} size={120} />
              </div>

              {/* Feature pills - Floating in 3D space */}
              <div className={cn(commonStyles.floatingPill, commonStyles.pill1, styles.floatingPill)}>
                <Bot size={16} />
                <span>AI Smart Matching</span>
              </div>
              <div className={cn(commonStyles.floatingPill, commonStyles.pill2, styles.floatingPill)}>
                <Zap size={16} />
                <span>Instant Payments</span>
              </div>
              <div className={cn(commonStyles.floatingPill, commonStyles.pill3, styles.floatingPill)}>
                <ShieldCheck size={16} />
                <span>Blockchain Escrow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid with glassmorphism - Full Width Bottom (FYP Report Statistics) */}
        <div 
          className={cn(
            commonStyles.statsContainer,
            isVisible && commonStyles.fadeInUp,
            commonStyles.delay5
          )}
        >
          <div className={cn(commonStyles.statsGrid, styles.statsGrid)}>
            <StatItem 
              value={98} 
              label="AI Match Accuracy" 
              suffix="%"
              icon={<Bot size={20} />} 
            />
            <StatItem 
              value={5} 
              label="Platform Fee (Low)" 
              suffix="%"
              icon={<Award size={20} />} 
            />
            <StatItem 
              value={0} 
              label="Payment Delays" 
              suffix="s"
              icon={<Zap size={20} />} 
            />
            <StatItem 
              value={100} 
              label="Secure Escrow" 
              suffix="%"
              icon={<ShieldCheck size={20} />} 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;