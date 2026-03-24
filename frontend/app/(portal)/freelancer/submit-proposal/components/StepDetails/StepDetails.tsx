// @AI-HINT: Enhanced first step in proposal submission with AI-powered writing assistance and real-time validation.
'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Calculator, CheckCircle, AlertCircle, Clock } from 'lucide-react';

import { ProposalData, ProposalErrors } from '../../SubmitProposal.types';
import Textarea from '@/app/components/Textarea/Textarea';
import Input from '@/app/components/Input/Input';
import { Label } from '@/app/components/Label/Label';
import Select from '@/app/components/Select/Select';
import { AIProposalAssistant } from '@/app/components/AI';

import common from './StepDetails.common.module.css';
import light from './StepDetails.light.module.css';
import dark from './StepDetails.dark.module.css';

interface StepDetailsProps {
  data: ProposalData;
  updateData: (update: Partial<ProposalData>) => void;
  errors: ProposalErrors;
}

const MIN_COVER_LETTER = 100;
const MAX_COVER_LETTER = 5000;

const availabilityOptions = [
  { value: 'immediate', label: 'Immediate - Can start today' },
  { value: '1-2_weeks', label: '1-2 Weeks - Need to wrap up current work' },
  { value: '1_month', label: '1 Month - Finishing another project' },
  { value: 'flexible', label: 'Flexible - Open to discussion' },
];

const StepDetails: React.FC<StepDetailsProps> = ({ data, updateData, errors }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  // Character count and progress
  const charCount = data.coverLetter.length;
  const charProgress = Math.min((charCount / MIN_COVER_LETTER) * 100, 100);
  const isOverLimit = charCount > MAX_COVER_LETTER;
  const isValidLength = charCount >= MIN_COVER_LETTER && charCount <= MAX_COVER_LETTER;

  // Calculate estimated total
  const estimatedTotal = useMemo(() => {
    return (data.hourlyRate || 0) * (data.estimatedHours || 0);
  }, [data.hourlyRate, data.estimatedHours]);

  const handleAIGenerate = (content: string) => {
    updateData({ coverLetter: content });
  };

  return (
    <div className={cn(common.container, themed.container)}>
      <div className={common.header}>
        <h2 className={cn(common.title, themed.title)}>Project Details</h2>
        <p className={cn(common.description, themed.description)}>
          Craft a compelling proposal that showcases your skills and experience.
        </p>
      </div>

      <div className={common.form}>
        {/* Cover Letter Section */}
        <div className={common.formGroup}>
          <div className={cn(common.labelRow, themed.labelRow)}>
            <Label htmlFor="coverLetter">Cover Letter</Label>
          </div>

          <div className="mb-4">
            <AIProposalAssistant 
              {...{
                jobDescription: "Please review the job description and write a proposal.",
                currentProposal: data.coverLetter,
                onGenerate: handleAIGenerate,
                onImprove: handleAIGenerate,
              } as any}
            />
          </div>

          <Textarea
            id="coverLetter"
            value={data.coverLetter}
            onChange={(e) => updateData({ coverLetter: e.target.value })}
            placeholder="Explain why you're the best fit for this project. Highlight relevant experience and skills..."
            rows={8}
            aria-invalid={!!errors.coverLetter}
            aria-describedby={errors.coverLetter ? "coverLetter-error" : "coverLetter-hint"}
          />
          
          {/* Character Counter */}
          <div className={cn(common.charCounter, themed.charCounter)}>
            <div className={cn(common.charProgress, themed.charProgress)}>
              <motion.div 
                className={cn(
                  common.charProgressFill, 
                  themed.charProgressFill,
                  isValidLength && common.charProgressValid,
                  isOverLimit && common.charProgressError
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(charProgress, 100)}%` }}
              />
            </div>
            <span className={cn(
              common.charCount, 
              themed.charCount,
              isOverLimit && common.charCountError
            )}>
              {isValidLength && <CheckCircle size={12} />}
              {isOverLimit && <AlertCircle size={12} />}
              {charCount}/{MAX_COVER_LETTER} characters
              {charCount < MIN_COVER_LETTER && ` (min ${MIN_COVER_LETTER})`}
            </span>
          </div>
          
          {errors.coverLetter && (
            <p id="coverLetter-error" className={cn(common.error, themed.error)}>
              {errors.coverLetter}
            </p>
          )}
        </div>

        {/* Pricing Section */}
        <div className={cn(common.pricingSection, themed.pricingSection)}>
          <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>
            <Calculator size={18} />
            Pricing & Timeline
          </h3>
          
          <div className={common.row}>
            <div className={common.formGroup}>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="1"
                value={data.estimatedHours || ''}
                onChange={(e) => updateData({ estimatedHours: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g., 40"
                aria-invalid={!!errors.estimatedHours}
                aria-describedby={errors.estimatedHours ? "estimatedHours-error" : undefined}
              />
              {errors.estimatedHours && (
                <p id="estimatedHours-error" className={cn(common.error, themed.error)}>
                  {errors.estimatedHours}
                </p>
              )}
            </div>

            <div className={common.formGroup}>
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="5"
                max="500"
                value={data.hourlyRate || ''}
                onChange={(e) => updateData({ hourlyRate: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g., 50"
                aria-invalid={!!errors.hourlyRate}
                aria-describedby={errors.hourlyRate ? "hourlyRate-error" : undefined}
              />
              {errors.hourlyRate && (
                <p id="hourlyRate-error" className={cn(common.error, themed.error)}>
                  {errors.hourlyRate}
                </p>
              )}
            </div>
          </div>

          {/* Estimated Total */}
          {estimatedTotal > 0 && (
            <motion.div 
              className={cn(common.estimatedCard, themed.estimatedCard)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={cn(common.estimatedRow, themed.estimatedRow)}>
                <span>Estimated Total</span>
                <span className={cn(common.estimatedTotal, themed.estimatedTotal)}>
                  ${estimatedTotal.toLocaleString()}
                </span>
              </div>
              <div className={cn(common.estimatedBreakdown, themed.estimatedBreakdown)}>
                <span>{data.estimatedHours} hours × ${data.hourlyRate}/hr</span>
                <span className={cn(common.serviceFee, themed.serviceFee)}>
                  Platform fee (10%): ${(estimatedTotal * 0.1).toFixed(2)}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Availability Section */}
        <div className={common.formGroup}>
          <Label htmlFor="availability">
            <Clock size={16} className={common.inlineIcon} />
            Availability
          </Label>
          <Select
            id="availability"
            options={availabilityOptions}
            value={data.availability}
            onChange={(e) => updateData({ availability: e.target.value as any })}
          />
          <p id="availability-hint" className={cn(common.hint, themed.hint)}>
            Let the client know when you can start working on their project.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StepDetails;
