// @AI-HINT: A section showcasing real user reviews fetched from the API, designed with a premium, modern aesthetic.

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, useInView } from 'framer-motion';

import TestimonialCard from './TestimonialCard';
import type { Testimonial } from './TestimonialCard';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';
import commonStyles from './Testimonials.common.module.css';
import lightStyles from './Testimonials.light.module.css';
import darkStyles from './Testimonials.dark.module.css';



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: 'spring' as const, 
      stiffness: 120, 
      damping: 20 
    }
  },
};

const Testimonials: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/v1/reviews?limit=3');
        if (res.ok) {
          const data = await res.json();
          const reviews = (data.reviews || data || []).slice(0, 3);
          if (reviews.length > 0) {
            setTestimonials(reviews.map((r: any) => ({
              quote: r.review_text || r.comment || r.text || '',
              author: r.reviewer_name || r.reviewer?.name || 'Verified User',
              title: r.reviewer_title || r.reviewer?.title || 'MegiLance User',
              avatarUrl: r.reviewer_avatar || r.reviewer?.avatar_url || '',
              rating: r.rating || 5,
            })));
          }
        }
      } catch {
        // No reviews available yet
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (!loading && testimonials.length === 0) return null;

  return (
    <section className={cn(commonStyles.testimonials, themeStyles.testimonials)} ref={ref}>
      <SectionGlobe variant="green" size="sm" position="left" />
      <div className={commonStyles.container}>
        <motion.div 
          className={commonStyles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className={cn(commonStyles.title, themeStyles.title)}>What Our Users Say</h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Real reviews from clients and freelancers on the MegiLance platform.
          </p>
        </motion.div>

        {loading ? (
          <div className={commonStyles.testimonialsGrid}>
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                style={{ height: 200, borderRadius: 12, background: 'currentColor' }} 
              />
            ))}
          </div>
        ) : (
          <motion.div 
            className={commonStyles.testimonialsGrid}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.author} variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }} transition={{ type: 'spring' as const, stiffness: 300 }}>
                <TestimonialCard testimonial={testimonial} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;

