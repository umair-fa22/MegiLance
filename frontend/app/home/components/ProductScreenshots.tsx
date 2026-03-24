// @AI-HINT: Product Screenshots carousel component for the Homepage. Features a responsive, touch-friendly carousel with modern animations and navigation controls.
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import Image from 'next/image';

import commonStyles from './ProductScreenshots.common.module.css';
import lightStyles from './ProductScreenshots.light.module.css';
import darkStyles from './ProductScreenshots.dark.module.css';

interface Screenshot {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

const screenshots: Screenshot[] = [
  {
    id: 1,
    title: 'AI-Powered Matching',
    description: 'Our intelligent algorithm connects you with the perfect projects or talent.',
    imageUrl: '/images/screenshots/ai-matching.png',
  },
  {
    id: 2,
    title: 'Blockchain Payments',
    description: 'Secure, instant payments in USDC with transparent escrow protection.',
    imageUrl: '/images/screenshots/blockchain-payments.png',
  },
  {
    id: 3,
    title: 'Project Dashboard',
    description: 'Track progress, milestones, and collaborate in real-time.',
    imageUrl: '/images/screenshots/project-dashboard.png',
  },
  {
    id: 4,
    title: 'Talent Profiles',
    description: 'Showcase your skills with AI-enhanced portfolios and verified credentials.',
    imageUrl: '/images/screenshots/talent-profiles.png',
  },
];

const ProductScreenshots: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const styles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance carousel
  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % screenshots.length);
      }, 5000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? screenshots.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % screenshots.length
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <div className={cn(commonStyles.carouselContainer, styles.carouselContainer)}>
      <div className={commonStyles.carouselHeader}>
        <h2 className={cn(commonStyles.carouselTitle, styles.carouselTitle)}>Experience MegiLance</h2>
        <p className={cn(commonStyles.carouselSubtitle, styles.carouselSubtitle)}>
          See how our platform transforms the way you work
        </p>
      </div>

      <div 
        className={cn(commonStyles.carouselWrapper, styles.carouselWrapper)}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <button 
          className={cn(commonStyles.navButton, commonStyles.prevButton, styles.navButton)}
          onClick={goToPrevious}
          aria-label="Previous screenshot"
        >
          <ChevronLeft size={24} />
        </button>

        <div className={cn(commonStyles.carouselSlides, styles.carouselSlides)}>
          {screenshots.map((screenshot, index) => (
            <div 
              key={screenshot.id}
              className={cn(
                commonStyles.slide,
                styles.slide,
                index === currentIndex && commonStyles.slideActive,
                index === currentIndex && styles.slideActive
              )}
              role="tabpanel"
              aria-roledescription="slide"
              aria-label={`${screenshot.title} - Slide ${index + 1} of ${screenshots.length}`}
            >
              <div className={cn(commonStyles.slideContent, styles.slideContent)}>
                <div className={cn(commonStyles.screenshotContainer, styles.screenshotContainer)}>
                  <Image 
                    src={screenshot.imageUrl} 
                    alt={screenshot.title}
                    className={cn(commonStyles.screenshotImage, styles.screenshotImage)}
                    loading="lazy"
                    width={800}
                    height={600}
                  />
                </div>
                <div className={cn(commonStyles.slideInfo, styles.slideInfo)}>
                  <h3 className={cn(commonStyles.slideTitle, styles.slideTitle)}>{screenshot.title}</h3>
                  <p className={cn(commonStyles.slideDescription, styles.slideDescription)}>
                    {screenshot.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          className={cn(commonStyles.navButton, commonStyles.nextButton, styles.navButton)}
          onClick={goToNext}
          aria-label="Next screenshot"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className={cn(commonStyles.carouselControls, styles.carouselControls)}>
        <div className={cn(commonStyles.indicators, styles.indicators)}>
          {screenshots.map((_, index) => (
            <button
              key={index}
              className={cn(
                commonStyles.indicator,
                styles.indicator,
                index === currentIndex && commonStyles.indicatorActive,
                index === currentIndex && styles.indicatorActive
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
        
        <button 
          className={cn(commonStyles.autoPlayButton, styles.autoPlayButton)}
          onClick={toggleAutoPlay}
          aria-label={isAutoPlaying ? "Pause auto-advance" : "Resume auto-advance"}
        >
          {isAutoPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ProductScreenshots;
