// @AI-HINT: A section showcasing user testimonials to build trust and social proof, designed with a premium, modern aesthetic.

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import TestimonialCard from './TestimonialCard';
import type { Testimonial } from './TestimonialCard';
import SectionGlobe from '@/app/components/Animations/SectionGlobe/SectionGlobe';
import commonStyles from './Testimonials.common.module.css';
import lightStyles from './Testimonials.light.module.css';
import darkStyles from './Testimonials.dark.module.css';

const testimonialsData: Testimonial[] = [
  {
    quote: 'MegiLance has revolutionized the way I work. The AI tools are a game-changer, and the secure payment system gives me peace of mind.',
    author: 'Alexia C.',
    title: 'Senior Frontend Developer',
    avatarUrl: 'https://i.pravatar.cc/150?u=alexia',
    rating: 5,
  },
  {
    quote: 'As a client, finding top talent has never been easier. The platform is intuitive, and the quality of freelancers is outstanding.',
    author: 'John D.',
    title: 'Startup Founder',
    avatarUrl: 'https://i.pravatar.cc/150?u=john',
    rating: 5,
  },
  {
    quote: 'The instant USDC payments are incredible. No more waiting for bank transfers or dealing with high fees. This is the future!',
    author: 'Maria S.',
    title: 'UX/UI Designer',
    avatarUrl: 'https://i.pravatar.cc/150?u=maria',
    rating: 5,
  },
];

const Testimonials: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <section className={cn(commonStyles.testimonials, themeStyles.testimonials)}>
      <SectionGlobe variant="green" size="sm" position="left" />
      <div className={commonStyles.container}>
        <div className={commonStyles.header}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>Trusted by the Best</h2>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            See what our users are saying about their experience on the MegiLance platform.
          </p>
        </div>
        <div className={commonStyles.testimonialsGrid}>
          {testimonialsData.map((testimonial) => (
            <TestimonialCard key={testimonial.author} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;