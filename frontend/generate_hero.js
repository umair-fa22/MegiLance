const fs = require('fs');
const path = require('path');

const dir = 'e:/MegiLance/frontend/app/home/components';

const tsxContent = \// @AI-HINT: Premium Immersive Hero Component - Editorial Brutalism & Organic Fluidity blend
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, Search, ShieldCheck, Zap, 
  Code, Palette, Smartphone, BarChart3, PenTool, Video 
} from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './Hero.common.module.css';
import lightStyles from './Hero.light.module.css';
import darkStyles from './Hero.dark.module.css';

// Optionally wrapping in existing 3D component if provided, else a clean div.
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
      router.push(\/explore?q=\\);
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

  const HeadlineText = "Find Top Talent.\\nFast & Secure.";
  
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
              {HeadlineText.split('\\n').map((line, i) => (
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
                      {word}
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
\

const cssCommon = \/* @AI-HINT: Premium Hero Common CSS - Deep spacing, advanced positioning, staggered reveal */
.preloadSpacer {
  height: 100vh;
  width: 100%;
}

.heroContainer {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8rem 1.5rem 6rem;
  box-sizing: border-box;
}

.heroInteractiveSurface {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.mouseGlow {
  position: absolute;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(120px);
  z-index: -1;
  will-change: transform;
}

.ambientOrb1, .ambientOrb2 {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  z-index: -2;
  animation: float 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.ambientOrb1 {
  width: 60vw;
  height: 60vw;
  top: -20%;
  left: -10%;
}

.ambientOrb2 {
  width: 50vw;
  height: 50vw;
  bottom: -20%;
  right: -10%;
  animation-delay: -10s;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(5%, 5%) scale(1.1); }
  100% { transform: translate(-5%, -5%) scale(0.9); }
}

.contentLayout {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  align-items: center;
  max-width: 900px;
}

.titleWrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.mainHeadline {
  font-family: var(--font-poppins, system-ui);
  font-size: clamp(3rem, 7vw, 6.5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  display: flex;
  flex-direction: column;
  gap: 0.2em;
}

.headlineLine {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.3em;
  overflow: hidden; /* For proper spring mask reveal */
  padding-bottom: 0.1em;
}

.headlineWord {
  display: inline-block;
  transform-origin: bottom left;
  will-change: transform, opacity;
}

.heroSubtitle {
  font-size: clamp(1.125rem, 2vw, 1.35rem);
  line-height: 1.6;
  max-width: 680px;
  margin: 0 auto;
  font-weight: 400;
}

.searchSection {
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.searchForm {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem 0.5rem 1.5rem;
  border-radius: 100px;
  width: 100%;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.08);
}

.searchIcon {
  flex-shrink: 0;
  transition: color 0.3s ease;
}

.searchInput {
  flex: 1;
  background: transparent;
  border: none;
  padding: 1rem;
  font-size: 1.125rem;
  font-weight: 500;
  outline: none;
  font-family: var(--font-inter, system-ui);
}

.searchInput::placeholder {
  font-weight: 400;
}

.searchBtn {
  border-radius: 100px;
  padding: 1rem 2rem;
  font-weight: 600;
  flex-shrink: 0;
}

.popularTagsWrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.popularPrefix {
  font-size: 0.9rem;
  font-weight: 500;
}

.tagsList {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.tagPill {
  font-size: 0.875rem;
  padding: 0.4rem 1rem;
  border-radius: 100px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.metricsRow {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.metricItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metricText {
  font-weight: 500;
  font-size: 0.95rem;
}

.metricDivider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
}

@media (max-width: 768px) {
  .searchForm {
    flex-direction: column;
    border-radius: 20px;
    padding: 1rem;
    gap: 1rem;
  }
  .searchInput {
    padding: 0.5rem;
    text-align: center;
  }
  .searchBtn {
    width: 100%;
    border-radius: 12px;
  }
  .metricsRow {
    flex-direction: column;
    gap: 0.75rem;
  }
  .metricDivider {
    display: none;
  }
}
\

const cssLight = \/* @AI-HINT: Premium Hero Light Theme - Soft gradients, elegant glassmorphism, elevated shadows */
.heroContainer {
  background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
}

.mouseGlow {
  background: radial-gradient(circle, rgba(69, 115, 223, 0.08) 0%, rgba(255, 255, 255, 0) 70%);
}

.ambientOrb1 {
  background: radial-gradient(circle, rgba(69, 115, 223, 0.12) 0%, rgba(255,255,255,0) 70%);
}

.ambientOrb2 {
  background: radial-gradient(circle, rgba(232, 17, 35, 0.04) 0%, rgba(255,255,255,0) 70%);
}

.mainHeadline {
  color: #0f172a;
}

.heroSubtitle {
  color: #475569;
}

.searchForm {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(69, 115, 223, 0.15);
}

.searchForm:focus-within {
  border-color: rgba(69, 115, 223, 0.4);
  box-shadow: 0 32px 64px rgba(69, 115, 223, 0.12), 0 0 0 4px rgba(69, 115, 223, 0.05);
  background: #ffffff;
}

.searchIcon {
  color: #94a3b8;
}

.searchForm:focus-within .searchIcon {
  color: #4573df;
}

.searchInput {
  color: #0f172a;
}
.searchInput::placeholder {
  color: #94a3b8;
}

.popularPrefix {
  color: #64748b;
}

.tagPill {
  background: rgba(255, 255, 255, 0.6);
  color: #334155;
  border-color: rgba(0, 0, 0, 0.05);
}

.tagPill:hover {
  background: #ffffff;
  color: #4573df;
  border-color: rgba(69, 115, 223, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(69, 115, 223, 0.08);
}

.metricText {
  color: #475569;
}
.metricIcon {
  color: #4573df;
}
\

const cssDark = \/* @AI-HINT: Premium Hero Dark Theme - Deep OLED blacks, cinematic neon bloom, stark high-contrast typography */
.heroContainer {
  background: linear-gradient(to bottom, #020617 0%, #0f172a 100%);
}

.mouseGlow {
  background: radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, rgba(2, 6, 23, 0) 70%);
}

.ambientOrb1 {
  background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(2, 6, 23, 0) 70%);
}

.ambientOrb2 {
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(2, 6, 23, 0) 70%);
}

.mainHeadline {
  color: #f8fafc;
}

.heroSubtitle {
  color: #94a3b8;
}

.searchForm {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.searchForm:focus-within {
  border-color: rgba(96, 165, 250, 0.4);
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(96, 165, 250, 0.2);
  background: rgba(15, 23, 42, 0.9);
}

.searchIcon {
  color: #64748b;
}

.searchForm:focus-within .searchIcon {
  color: #60a5fa;
}

.searchInput {
  color: #f8fafc;
}
.searchInput::placeholder {
  color: #475569;
}

.popularPrefix {
  color: #64748b;
}

.tagPill {
  background: rgba(30, 41, 59, 0.5);
  color: #cbd5e1;
  border-color: rgba(255, 255, 255, 0.05);
}

.tagPill:hover {
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  border-color: rgba(96, 165, 250, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
}

.metricText {
  color: #94a3b8;
}
.metricIcon {
  color: #60a5fa;
}
\

fs.writeFileSync(path.join(dir, 'Hero.tsx'), tsxContent);
fs.writeFileSync(path.join(dir, 'Hero.common.module.css'), cssCommon);
fs.writeFileSync(path.join(dir, 'Hero.light.module.css'), cssLight);
fs.writeFileSync(path.join(dir, 'Hero.dark.module.css'), cssDark);
console.log("Success! Premium Hero built.");
