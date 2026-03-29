// @/app/(portal)/client/post-job/components/StepReview/StepReview.tsx
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PostJobData } from '../../PostJob.types';
import Badge from '@/app/components/atoms/Badge/Badge';

import common from './StepReview.common.module.css';
import light from './StepReview.light.module.css';
import dark from './StepReview.dark.module.css';

interface StepReviewProps {
  data: PostJobData;
}

const StepReview: React.FC<StepReviewProps> = ({ data }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={common.container}
    >
      <h2 className={cn(common.title, themed.title)}>Review your job post</h2>
      <p className={cn(common.subtitle, themed.subtitle)}>Please check the details below before submitting.</p>

      <div className={cn(common.card, themed.card)}>
        <h3 className={cn(common.card_title, themed.card_title)}>{data.title || 'Untitled Job Post'}</h3>
        
        <div className={common.grid}>
          <div className={common.grid_item}>
            <span className={cn(common.item_label, themed.item_label)}>Category</span>
            <span className={cn(common.item_value, themed.item_value)}>{data.category || '—'}</span>
          </div>
          <div className={common.grid_item}>
            <span className={cn(common.item_label, themed.item_label)}>Budget</span>
            <span className={cn(common.item_value, themed.item_value)}>
              {data.budgetAmount ? `$${data.budgetAmount}` : '—'} ({data.budgetType})
            </span>
          </div>
          <div className={common.grid_item}>
            <span className={cn(common.item_label, themed.item_label)}>Timeline</span>
            <span className={cn(common.item_value, themed.item_value)}>{data.timeline || '—'}</span>
          </div>
        </div>

        <div className={common.section_divider} />

        <div className={common.section}>
          <h4 className={cn(common.section_title, themed.section_title)}>Description</h4>
          <p className={cn(common.description, themed.description)}>{data.description || 'No description provided.'}</p>
        </div>

        <div className={common.section_divider} />

        <div className={common.section}>
          <h4 className={cn(common.section_title, themed.section_title)}>Required Skills</h4>
          {data.skills && data.skills.length > 0 ? (
            <div className={common.skills_container}>
              {data.skills.map(skill => (
                <Badge key={skill} variant="primary">{skill}</Badge>
              ))}
            </div>
          ) : (
            <p className={cn(common.description, themed.description)}>No skills specified.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StepReview;
