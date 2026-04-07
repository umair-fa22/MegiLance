// @AI-HINT: Premium Immersive Hero Component - Editorial Brutalism & Organic Fluidity blend
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, Search, ShieldCheck, Zap, 
  Code, Palette, Smartphone, BarChart3
} from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './Hero.common.module.css';
import lightStyles from './Hero.light.module.css';
import darkStyles from './Hero.dark.module.css';

// Using Optional HeroScene3D wrapper if available
import { HeroScene3D } from '@/app/components/3D'; 

const POPULAR_CATEGORIES = [
  { label: 'Web Development', icon: Code, href: '/explore?category=web-development' },
  { label: 'UI/UX Design', icon: Palette, href: '/explore?category=ui-ux-design' },
  { label: 'Mobile Apps', icon: Smartphone, href: '/explore?category=mobile-apps' },
  { label: 'Data Science', icon: BarChart3, href: '/explore?category=data-science' },
];

export default function Hero() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Pointer spotlight effect
  const [mousePos, setMousePosition] = useState({ x: 0, y: 0 });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => setMounted(true), []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, router]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const HeadlineText = "Find Top Talent.\nFast & Secure.";
  
  if (!mounted) return <div className={commonStyles.preloadSpacer} />;

  const Wrapper = HeroScene3D ? HeroScene3D : 'div';

  return (
    <Wrapper className={cn(commonStyles.heroContainer, themeStyles.heroContainer)}>
      <motion.div 
        ref={containerRef}
        className={commonStyles.heroInteractiveSurface}
        onMouseMove={handleMouseMove}
        style={{ y: yParallax, opacity: opacityFade }}
      >
        {/* Mouse Glow Spotlight */}
        <motion.div 
          className={cn(commonStyles.mouseGlow, themeStyles.mouseGlow)}
          animate={{ x: mousePos.x - 400, y: mousePos.y - 400 }}
          transition={{ type: "spring", bounce: 0.25, mass: 0.5 }}
        />

        {/* Ambient background depth elements */}
        <div className={cn(commonStyles.ambientOrb1, themeStyles.ambientOrb1)} />
        <div className={cn(commonStyles.ambientOrb2, themeStyles.ambientOrb2)} />

        <div className={commonStyles.contentLayout}>
          
          {/* Typographic Engine Headline - Staggered Words */}
          <div className={commonStyles.titleWrapper}>
            <motion.h1 
              className={cn(commonStyles.mainHeadline, themeStyles.mainHeadline)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              {HeadlineText.split('\n').map((line, i) => (
                <span key={i} className={commonStyles.headlineLine}>
                  {line.split(' ').map((word, j) => (
                    <motion.span
                      key={j}
                      className={commonStyles.headlineWord}
                      initial={{ y: 80, opacity: 0, rotateZ: 5 }}
                      animate={{ y: 0, opacity: 1, rotateZ: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 15, 
                        delay: (i * 0.2) + (j * 0.1) 
                      }}
                    >
                      {word}&nbsp;
                    </motion.span>
                  ))}
                </span>
              ))}
            </motion.h1>
            
            <motion.p 
              className={cn(commonStyles.heroSubtitle, themeStyles.heroSubtitle)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              The premium marketplace for independent professionals. Connect with curated experts instantly and pay securely with escrow protection.
            </motion.p>
          </div>

          {/* Premium Search Experience */}
          <motion.div 
            className={commonStyles.searchSection}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
          >
            <form onSubmit={handleSearch} className={cn(commonStyles.searchForm, themeStyles.searchForm)}>
              <Search size={22} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What project are you hiring for today?"
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              />
              <Button type="submit" variant="primary" size="lg" className={commonStyles.searchBtn}>
                Explore Talent
              </Button>
            </form>

            {/* Quick Categories */}
            <div className={commonStyles.popularTagsWrap}>
              <span className={cn(commonStyles.popularPrefix, themeStyles.popularPrefix)}>Trending:</span>
              <div className={commonStyles.tagsList}>
                {POPULAR_CATEGORIES.map(({ label, href }) => (
                  <Link href={href} key={label} className={cn(commonStyles.tagPill, themeStyles.tagPill)}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Social Proof & Metrics */}
          <motion.div 
            className={commonStyles.metricsRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            <div className={commonStyles.metricItem}>
              <ShieldCheck size={20} className={themeStyles.metricIcon} />
              <span className={cn(commonStyles.metricText, themeStyles.metricText)}>100% Escrow Protected</span>
            </div>
            <div className={commonStyles.metricDivider} />
            <div className={commonStyles.metricItem}>
              <Zap size={20} className={themeStyles.metricIcon} />
              <span className={cn(commonStyles.metricText, themeStyles.metricText)}>AI Matched under 24h</span>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </Wrapper>
  );
}
