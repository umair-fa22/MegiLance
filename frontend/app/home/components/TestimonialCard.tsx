// @AI-HINT: A reusable card for displaying user testimonials, featuring a clean layout, avatar, and quote icon for a premium feel.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import StarRating from '@/app/components/StarRating/StarRating';

import commonStyles from './TestimonialCard.common.module.css';
import lightStyles from './TestimonialCard.light.module.css';
import darkStyles from './TestimonialCard.dark.module.css';

export interface Testimonial {
  quote: string;
  author: string;
  title: string;
  avatarUrl: string;
  rating: number;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div
      className={cn(
        commonStyles.testimonialCard,
        themeStyles.testimonialCard
      )}
    >
      <div className={commonStyles.cardHeader}>
        <StarRating rating={testimonial.rating} />
        <Quote className={cn(commonStyles.quoteIcon, themeStyles.quoteIcon)} />
      </div>
      <blockquote className={cn(commonStyles.quote, themeStyles.quote)}>
        {testimonial.quote}
      </blockquote>
      <div className={commonStyles.authorInfo}>
        <UserAvatar src={testimonial.avatarUrl} name={testimonial.author} size={44} />
        <div className={commonStyles.authorDetails}>
          <p className={cn(commonStyles.authorName, themeStyles.authorName)}>{testimonial.author}</p>
          <p className={cn(commonStyles.authorTitle, themeStyles.authorTitle)}>{testimonial.title}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
