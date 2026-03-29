// @AI-HINT: Enhanced StepDetails with real-time validation, character counter, and accessibility improvements
'use client';

import React, { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import Input from '@/app/components/atoms/Input/Input';
import Select from '@/app/components/molecules/Select/Select';
import { PostJobData, PostJobErrors } from '../../PostJob.types';

import common from './StepDetails.common.module.css';
import light from './StepDetails.light.module.css';
import dark from './StepDetails.dark.module.css';

const CATEGORIES = ['Web Development', 'Mobile Apps', 'UI/UX Design', 'Data Science', 'AI/ML', 'DevOps'] as const;

// Title validation constants
const MIN_TITLE_LENGTH = 10;
const MAX_TITLE_LENGTH = 100;
const RECOMMENDED_TITLE_LENGTH = 30;

// Example titles for inspiration
const TITLE_EXAMPLES = [
  'Senior React Developer for E-commerce Platform',
  'Full-Stack Python Developer - Healthcare App',
  'Mobile App Designer for Fitness Startup',
  'Data Engineer for Real-time Analytics Pipeline'
];

interface StepDetailsProps {
  data: PostJobData;
  updateData: (update: Partial<PostJobData>) => void;
  errors: PostJobErrors;
}

const StepDetails: React.FC<StepDetailsProps> = ({ data, updateData, errors }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [showExamples, setShowExamples] = useState(false);

  // Title validation metrics
  const titleMetrics = useMemo(() => {
    const charCount = data.title.length;
    const wordCount = data.title.trim() ? data.title.trim().split(/\s+/).length : 0;
    const isMinMet = charCount >= MIN_TITLE_LENGTH;
    const isRecommendedMet = charCount >= RECOMMENDED_TITLE_LENGTH;
    const isOverMax = charCount > MAX_TITLE_LENGTH;
    
    return { charCount, wordCount, isMinMet, isRecommendedMet, isOverMax };
  }, [data.title]);

  // Handle example click
  const handleExampleClick = (example: string) => {
    updateData({ title: example });
    setShowExamples(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={common.container}
      role="region"
      aria-label="Job Details Step"
    >
      <h2 className={cn(common.title, themed.title)}>Start with the basics</h2>
      <p className={cn(common.subtitle, themed.subtitle)}>What is the job you need to get done?</p>

      <div className={common.form_group}>
        <div className={common.labelRow}>
          <label htmlFor="job-title" className={cn(common.label, themed.label)}>
            Job Title <span className={common.required}>*</span>
          </label>
          <button
            type="button"
            className={cn(common.exampleButton, themed.exampleButton)}
            onClick={() => setShowExamples(!showExamples)}
            aria-expanded={showExamples}
            aria-controls="title-examples"
          >
            <Sparkles size={14} />
            Examples
          </button>
        </div>

        <AnimatePresence>
          {showExamples && (
            <motion.div
              id="title-examples"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(common.examplesBox, themed.examplesBox)}
            >
              {TITLE_EXAMPLES.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(common.exampleItem, themed.exampleItem)}
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Input
          id="job-title"
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value.slice(0, MAX_TITLE_LENGTH) })}
          placeholder="e.g., Senior React Developer for Fintech App"
          error={errors.title}
          required
          characterLimit={MAX_TITLE_LENGTH}
          aria-describedby="title-help title-metrics"
        />
        
        {/* Title metrics */}
        <div id="title-metrics" className={common.metricsRow}>
          <span className={cn(
            common.metricItem,
            titleMetrics.isOverMax && common.error
          )}>
            {titleMetrics.charCount} / {MAX_TITLE_LENGTH} characters
          </span>
          
          <div className={common.validationRow}>
            {titleMetrics.charCount > 0 && (
              <>
                <span className={cn(
                  common.validationItem,
                  titleMetrics.isMinMet ? common.valid : common.invalid
                )}>
                  {titleMetrics.isMinMet ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  Min {MIN_TITLE_LENGTH} chars
                </span>
                {titleMetrics.isMinMet && (
                  <span className={cn(
                    common.validationItem,
                    titleMetrics.isRecommendedMet ? common.valid : common.pending
                  )}>
                    {titleMetrics.isRecommendedMet ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    Recommended {RECOMMENDED_TITLE_LENGTH}+ chars
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <p id="title-help" className={cn(common.help, themed.help)}>
          A clear, specific title attracts the right freelancers
        </p>
      </div>

      <div className={common.form_group}>
        <Select
          id="job-category"
          label="Category"
          value={data.category}
          onChange={(e) => updateData({ category: e.target.value as any })}
          options={CATEGORIES.map(c => ({ value: c, label: c }))}
          placeholder="Select a category"
          required
          error={errors.category}
          helpText="Choose the category that best describes your project"
        />
      </div>
    </motion.div>
  );
};

export default StepDetails;
