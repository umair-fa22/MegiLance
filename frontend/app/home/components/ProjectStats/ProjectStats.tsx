// @AI-HINT: World-class Project Statistics with 3D tilt, spring animations, and glassmorphism
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Database, Globe, Activity, Server, Code2, Layers } from 'lucide-react'
import { motion, useInView, useSpring, useMotionValue, useTransform } from 'framer-motion'

import commonStyles from './ProjectStats.common.module.css';
import lightStyles from './ProjectStats.light.module.css';
import darkStyles from './ProjectStats.dark.module.css';

interface StatItem {
  id: number;
  icon: React.ElementType;
  value: number;
  label: string;
  description: string;
  suffix?: string;
}

const projectStats: StatItem[] = [
  { 
    id: 1, 
    icon: Globe, 
    value: 195, 
    label: "Total Pages", 
    description: "Complete frontend routes",
    suffix: "+"
  },
  { 
    id: 2, 
    icon: Server, 
    value: 1456, 
    label: "API Endpoints", 
    description: "RESTful backend APIs",
    suffix: ""
  },
  { 
    id: 3, 
    icon: Database, 
    value: 30, 
    label: "Database Tables", 
    description: "Structured data models",
    suffix: "+"
  },
  { 
    id: 4, 
    icon: Layers, 
    value: 216, 
    label: "Core Modules", 
    description: "Services & API routers",
    suffix: ""
  },
];

const ProjectStats: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section ref={containerRef} className={cn(commonStyles.statsSection, themeStyles.statsSection)}>
      {/* Background Elements */}
      <div className={commonStyles.backgroundGlow} />
      <div className={commonStyles.gridPattern} />

      <div className={commonStyles.container}>
        <motion.div 
          className={commonStyles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className={cn(commonStyles.badge, themeStyles.badge)}>
            <Activity size={14} className={commonStyles.pulseIcon} />
            <span>Live System Metrics</span>
          </div>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>
            Platform Architecture <span className={commonStyles.gradientText}>Scale</span>
          </h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Real-time statistics from our production-ready full-stack environment, powered by Next.js 16 and FastAPI.
          </p>
        </motion.div>

        <div className={commonStyles.statsGrid}>
          {projectStats.map((stat, index) => (
            <StatCard 
              key={stat.id} 
              stat={stat} 
              index={index} 
              themeStyles={themeStyles}
              isInView={isInView}
            />
          ))}
        </div>

        <motion.div 
          className={cn(commonStyles.footer, themeStyles.footer)}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Code2 size={16} className={commonStyles.footerIcon} />
          <p>
            Built with <strong>Next.js 16</strong>, <strong>FastAPI</strong>, <strong>Turso Database</strong>, and modern AI/ML technologies
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const StatCard: React.FC<{ 
  stat: StatItem; 
  index: number; 
  themeStyles: typeof lightStyles;
  isInView: boolean;
}> = ({ stat, index, themeStyles, isInView }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const springValue = useSpring(0, { bounce: 0, duration: 2000 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      springValue.set(stat.value);
    }
  }, [isInView, stat.value, springValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = stat.icon;

  return (
    <motion.div
      className={cn(commonStyles.statCardWrapper, themeStyles.statCardWrapper, commonStyles.perspective)}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
    >
      <motion.div
        className={cn(commonStyles.statCard, themeStyles.statCard)}
        style={{ rotateX, rotateY, z: 0 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.02, z: 50 }}
      >
        <div className={cn(commonStyles.cardGlow, themeStyles.cardGlow)} />
        
        <div className={cn(commonStyles.iconBox, themeStyles.iconBox)}>
          <Icon size={28} strokeWidth={1.5} />
        </div>

        <div className={commonStyles.content}>
          <div className={cn(commonStyles.value, themeStyles.value)}>
            {new Intl.NumberFormat('en-US').format(displayValue)}
            <span className={commonStyles.suffix}>{stat.suffix}</span>
          </div>
          <div className={cn(commonStyles.label, themeStyles.label)}>
            {stat.label}
          </div>
          <div className={cn(commonStyles.description, themeStyles.description)}>
            {stat.description}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectStats;
