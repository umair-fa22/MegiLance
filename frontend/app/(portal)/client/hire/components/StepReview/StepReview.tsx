// @/app/(portal)/client/hire/components/StepReview/StepReview.tsx
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import common from './StepReview.common.module.css';
import light from './StepReview.light.module.css';
import dark from './StepReview.dark.module.css';

interface StepReviewProps {
  freelancerId: string;
  title: string;
  rateType: 'Hourly' | 'Fixed';
  rate: string;
  startDate: string;
}

const StepReview: React.FC<StepReviewProps> = ({ freelancerId, title, rateType, rate, startDate }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <section className={cn(common.section, themed.section)} aria-labelledby="review-step-title">
      <h2 id="review-step-title" className={cn(common.title, themed.title)}>
        Review & Confirm
      </h2>
      <p className={cn(common.subtitle, themed.subtitle)}>
        Please review the details below before sending the hiring request.
      </p>
      <dl className={cn(common.reviewList, themed.reviewList)}>
        <div className={common.reviewItem}>
          <dt className={cn(common.itemTitle, themed.itemTitle)}>Freelancer ID</dt>
          <dd className={cn(common.itemValue, themed.itemValue)}>{freelancerId || 'Not specified'}</dd>
        </div>
        <div className={common.reviewItem}>
          <dt className={cn(common.itemTitle, themed.itemTitle)}>Project Title</dt>
          <dd className={cn(common.itemValue, themed.itemValue)}>{title || 'Not specified'}</dd>
        </div>
        <div className={common.reviewItem}>
          <dt className={cn(common.itemTitle, themed.itemTitle)}>Payment Terms</dt>
          <dd className={cn(common.itemValue, themed.itemValue)}>
            {rate ? `${rateType} - $${rate}` : 'Not specified'}
          </dd>
        </div>
        <div className={common.reviewItem}>
          <dt className={cn(common.itemTitle, themed.itemTitle)}>Start Date</dt>
          <dd className={cn(common.itemValue, themed.itemValue)}>{startDate || 'Not specified'}</dd>
        </div>
      </dl>
    </section>
  );
};

export default StepReview;
