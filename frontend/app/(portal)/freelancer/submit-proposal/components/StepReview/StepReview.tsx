// @AI-HINT: Final step in the proposal submission flow - review and confirm.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

import { ProposalData } from '../../SubmitProposal.types';
import Button from '@/app/components/Button/Button';

import common from './StepReview.common.module.css';
import light from './StepReview.light.module.css';
import dark from './StepReview.dark.module.css';

interface StepReviewProps {
  data: ProposalData;
}

const StepReview: React.FC<StepReviewProps> = ({ data }) => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  // Format availability for display
  const formatAvailability = (availability: string) => {
    switch (availability) {
      case 'immediate': return 'Immediate';
      case '1-2_weeks': return '1-2 Weeks';
      case '1_month': return '1 Month';
      case 'flexible': return 'Flexible';
      default: return availability;
    }
  };

  return (
    <div className={cn(common.container, themed.container)}>
      <div className={common.header}>
        <h2 className={cn(common.title, themed.title)}>Review Your Proposal</h2>
        <p className={cn(common.description, themed.description)}>
          Please review all details before submitting your proposal.
        </p>
      </div>

      <div className={common.reviewSection}>
        <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>Cover Letter</h3>
        <div className={cn(common.reviewItem, themed.reviewItem)}>
          <p className={cn(common.reviewValue, themed.reviewValue)}>{data.coverLetter}</p>
        </div>
      </div>

      <div className={common.reviewGrid}>
        <div className={common.reviewSection}>
          <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>Estimated Hours</h3>
          <div className={cn(common.reviewItem, themed.reviewItem)}>
            <p className={cn(common.reviewValue, themed.reviewValue)}>{data.estimatedHours} hours</p>
          </div>
        </div>

        <div className={common.reviewSection}>
          <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>Hourly Rate</h3>
          <div className={cn(common.reviewItem, themed.reviewItem)}>
            <p className={cn(common.reviewValue, themed.reviewValue)}>${data.hourlyRate}/hour</p>
          </div>
        </div>

        <div className={common.reviewSection}>
          <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>Availability</h3>
          <div className={cn(common.reviewItem, themed.reviewItem)}>
            <p className={cn(common.reviewValue, themed.reviewValue)}>{formatAvailability(data.availability)}</p>
          </div>
        </div>
      </div>

      <div className={common.reviewSection}>
        <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>Attachments</h3>
        <div className={cn(common.reviewItem, themed.reviewItem)}>
          {data.attachments.length > 0 ? (
            <ul className={cn(common.attachmentsList, themed.attachmentsList)}>
              {data.attachments.map((attachment, index) => (
                <li key={index} className={cn(common.attachmentItem, themed.attachmentItem)}>
                  {attachment}
                </li>
              ))}
            </ul>
          ) : (
            <p className={cn(common.reviewValue, themed.reviewValue)}>No attachments</p>
          )}
        </div>
      </div>

      <div className={cn(common.termsSection, themed.termsSection)}>
        <div className={cn(common.termsAgreement, themed.termsAgreement)}>
          <span className={cn(common.termsIcon, themed.termsIcon)}>✓</span>
          <span className={cn(common.termsText, themed.termsText)}>
            I agree to the terms and conditions
          </span>
        </div>
      </div>
    </div>
  );
};

export default StepReview;
