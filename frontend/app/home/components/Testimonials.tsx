// @AI-HINT: A section showcasing real user reviews fetched from the API, designed with a premium, modern aesthetic.

'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import TestimonialCard from './TestimonialCard';
import type { Testimonial } from './TestimonialCard';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';
import commonStyles from './Testimonials.common.module.css';
import lightStyles from './Testimonials.light.module.css';
import darkStyles from './Testimonials.dark.module.css';

const Testimonials: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

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
    <section className={cn(commonStyles.testimonials, themeStyles.testimonials)}>
      <SectionGlobe variant="green" size="sm" position="left" />
      <div className={commonStyles.container}>
        <div className={commonStyles.header}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>What Our Users Say</h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Real reviews from clients and freelancers on the MegiLance platform.
          </p>
        </div>
        {loading ? (
          <div className={commonStyles.testimonialsGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 200, borderRadius: 12, opacity: 0.1, background: 'currentColor' }} />
            ))}
          </div>
        ) : (
          <div className={commonStyles.testimonialsGrid}>
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.author} testimonial={testimonial} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
