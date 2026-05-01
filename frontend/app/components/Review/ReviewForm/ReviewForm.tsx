// @AI-HINT: Review and rating system - multi-criteria rating with verification
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Star, SendHorizontal, CheckCircle } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './ReviewForm.common.module.css';
import lightStyles from './ReviewForm.light.module.css';
import darkStyles from './ReviewForm.dark.module.css';

interface ReviewFormProps {
  contractId: string;
  revieweeId: string;
  revieweeName: string;
  projectTitle: string;
  onSubmit?: () => void;
}

interface ReviewData {
  rating: number;
  criteria: {
    quality: number;
    communication: number;
    timeliness: number;
    professionalism: number;
  };
  comment: string;
  wouldRecommend: boolean;
  isPublic: boolean;
}

export default function ReviewForm({
  contractId,
  revieweeId,
  revieweeName,
  projectTitle,
  onSubmit,
}: ReviewFormProps) {
  const { resolvedTheme } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [hoveredCriteria, setHoveredCriteria] = useState<{ [key: string]: number | null }>({});

  const [review, setReview] = useState<ReviewData>({
    rating: 0,
    criteria: {
      quality: 0,
      communication: 0,
      timeliness: 0,
      professionalism: 0,
    },
    comment: '',
    wouldRecommend: true,
    isPublic: true,
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    subtitle: cn(commonStyles.subtitle, themeStyles.subtitle),
    section: cn(commonStyles.section, themeStyles.section),
    sectionTitle: cn(commonStyles.sectionTitle, themeStyles.sectionTitle),
    ratingStars: cn(commonStyles.ratingStars, themeStyles.ratingStars),
    star: cn(commonStyles.star, themeStyles.star),
    criteriaGrid: cn(commonStyles.criteriaGrid, themeStyles.criteriaGrid),
    criteriaItem: cn(commonStyles.criteriaItem, themeStyles.criteriaItem),
    textarea: cn(commonStyles.textarea, themeStyles.textarea),
    checkbox: cn(commonStyles.checkbox, themeStyles.checkbox),
    actions: cn(commonStyles.actions, themeStyles.actions),
    successMessage: cn(commonStyles.successMessage, themeStyles.successMessage),
    charCount: cn(commonStyles.charCount, themeStyles.charCount),
    successIcon: cn(commonStyles.successIcon, themeStyles.successIcon),
    successTitle: commonStyles.successTitle,
    ratingLabel: commonStyles.ratingLabel,
    criteriaLabel: commonStyles.criteriaLabel,
    starActive: themeStyles.starActive,
    starInactive: themeStyles.starInactive,
    toast: cn(commonStyles.toast, themeStyles.toast),
    toastSuccess: cn(commonStyles.toast, themeStyles.toastSuccess),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (review.rating === 0) {
      setToast({message: 'Please provide an overall rating', type: 'error'});
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (review.comment.trim().length < 50) {
      setToast({message: 'Please write at least 50 characters in your review', type: 'error'});
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const allCriteriaRated = Object.values(review.criteria).every(rating => rating > 0);
    if (!allCriteriaRated) {
      setToast({message: 'Please rate all criteria', type: 'error'});
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await api.reviews.create({
        contract_id: Number(contractId),
        reviewed_user_id: Number(revieweeId),
        rating: review.rating,
        review_text: review.comment,
        quality_rating: review.criteria.quality,
        communication_rating: review.criteria.communication,
        deadline_rating: review.criteria.timeliness,
        professionalism_rating: review.criteria.professionalism,
        would_recommend: review.wouldRecommend,
        is_public: review.isPublic,
      });

      setSubmitted(true);
      onSubmit?.();
    } catch {
      setToast({message: 'Failed to submit review. Please try again.', type: 'error'});
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (
    currentRating: number,
    onRate: (rating: number) => void,
    hoveredValue: number | null,
    onHover: (rating: number | null) => void
  ) => {
    return (
      <div className={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            type="button"
            className={styles.star}
            onMouseEnter={() => onHover(rating)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onRate(rating)}
            aria-label={`Rate ${rating} stars`}
          >
            <Star
              className={
                rating <= (hoveredValue || currentRating)
                  ? styles.starActive
                  : styles.starInactive
              }
              size={32}
              fill={rating <= (hoveredValue || currentRating) ? '#eab308' : 'none'}
            />
          </button>
        ))}
        <span className={styles.ratingLabel}>
          {hoveredValue || currentRating || 0}/5
        </span>
      </div>
    );
  };

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2 className={styles.successTitle}>Review Submitted!</h2>
          <p>Thank you for your feedback. Your review helps build trust in our community.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Write a Review</h1>
        <p className={styles.subtitle}>
          Review your experience working with <strong>{revieweeName}</strong> on <em>{projectTitle}</em>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Overall Rating</h2>
          {renderStars(
            review.rating,
            (rating) => setReview({ ...review, rating }),
            hoveredRating,
            setHoveredRating
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Detailed Ratings</h2>
          <div className={styles.criteriaGrid}>
            {Object.entries({
              quality: 'Work Quality',
              communication: 'Communication',
              timeliness: 'Timeliness',
              professionalism: 'Professionalism',
            }).map(([key, label]) => (
              <div key={key} className={styles.criteriaItem}>
                <label className={styles.criteriaLabel}>{label}</label>
                {renderStars(
                  review.criteria[key as keyof typeof review.criteria],
                  (rating) =>
                    setReview({
                      ...review,
                      criteria: { ...review.criteria, [key]: rating },
                    }),
                  hoveredCriteria[key] || null,
                  (value) => setHoveredCriteria({ ...hoveredCriteria, [key]: value })
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Written Review</h2>
          <textarea
            className={styles.textarea}
            rows={8}
            placeholder="Share details about your experience working together. What went well? What could be improved? (Minimum 50 characters)"
            value={review.comment}
            onChange={(e) => setReview({ ...review, comment: e.target.value })}
            maxLength={2000}
          />
          <div className={styles.charCount}>
            {review.comment.length}/2000 characters
            {review.comment.length < 50 && ` (${50 - review.comment.length} more needed)`}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={review.wouldRecommend}
              onChange={(e) => setReview({ ...review, wouldRecommend: e.target.checked })}
            />
            <span>I would recommend this {revieweeName.includes('freelancer') ? 'freelancer' : 'client'} to others</span>
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={review.isPublic}
              onChange={(e) => setReview({ ...review, isPublic: e.target.checked })}
            />
            <span>Make this review public (visible on their profile)</span>
          </label>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            isLoading={submitting}
            disabled={submitting}
          >
            <SendHorizontal size={16} className="mr-2" />
            Submit Review
          </Button>
        </div>
      </form>

      {toast && (
        <div className={toast.type === 'success' ? styles.toastSuccess : styles.toast}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
