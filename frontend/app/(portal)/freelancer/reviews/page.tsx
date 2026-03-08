// @AI-HINT: This is the Reviews page for freelancers to see client feedback. It has been fully refactored for a premium, theme-aware design.
'use client';

import api from '@/lib/api';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { cn } from '@/lib/utils';
import commonStyles from './ReviewsPage.common.module.css';
import lightStyles from './ReviewsPage.light.module.css';
import darkStyles from './ReviewsPage.dark.module.css';

interface Review {
  id: number;
  contract_id: number;
  reviewer_id: number;
  reviewed_user_id: number;
  rating: number;
  communication_rating?: number;
  quality_rating?: number;
  professionalism_rating?: number;
  deadline_rating?: number;
  review_text: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Enriched from API or joined data
  reviewer_name?: string;
  project_name?: string;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: Record<string, number>;
}

const StarRating: React.FC<{ rating: number; styles: any }> = ({ rating, styles }) => {
  return (
    <div
      className={cn(styles.starRating)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
      title={`${rating} out of 5 stars`}
    >
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          className={cn(styles.star, index < rating ? '' : styles.empty)}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ReviewsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user ID first
      const userData: any = await api.auth.me();
      const userId = userData.id;
      setCurrentUserId(userId);
      
      // Fetch reviews for this user (as the reviewed person)
      try {
        const reviewsData = await (api.reviews as any).list?.({ user_id: userId });
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (err) {
        console.error('Failed to fetch reviews list:', err);
        setReviews([]);
      }
      
      // Fetch review stats
      try {
        const statsData = await (api.reviews as any).getStats?.(userId);
        setStats(statsData as ReviewStats);
      } catch {
        // Stats endpoint might not exist - calculate manually
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Calculate stats if not from API
  const calculatedStats = useMemo(() => {
    if (stats) return stats;
    if (reviews.length === 0) return { average_rating: 0, total_reviews: 0, rating_breakdown: {} };
    
    const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average_rating: totalRating / reviews.length,
      total_reviews: reviews.length,
      rating_breakdown: {},
    };
  }, [stats, reviews]);

  const averageRating = calculatedStats.average_rating.toFixed(1);


  return (
    <PageTransition>
      <div className={cn(styles.pageWrapper)}>
        <ScrollReveal>
          <header className={cn(styles.header)}>
            <h1>My Reviews</h1>
            <p>See what clients are saying about your work.</p>
          </header>
        </ScrollReveal>

        {error ? (
          <ScrollReveal>
            <div className={cn(styles.errorState)}>
              <h3>Unable to Load Reviews</h3>
              <p>{error}</p>
              <Button variant="primary" onClick={fetchReviews}>Try Again</Button>
            </div>
          </ScrollReveal>
        ) : loading ? (
          <div className={cn(styles.loadingState)}>
            <div className={cn(styles.spinner)} />
            <p>Loading your reviews...</p>
          </div>
        ) : (
          <main className={cn(styles.mainGrid)}>
            <span className={cn(styles.srOnly)} aria-live="polite">
              {`Average rating ${averageRating} out of 5 based on ${reviews.length} review${reviews.length === 1 ? '' : 's'}.`}
            </span>
            <aside>
              <ScrollReveal delay={0.1}>
                <div className={cn(styles.summaryCard)} role="region" aria-label="Rating summary" title="Rating summary">
                  <h2>Overall Rating</h2>
                  <div className={cn(styles.summaryRating)}>
                    <span className={cn(styles.summaryRatingScore)}>{averageRating}</span>
                    <StarRating rating={Math.round(parseFloat(averageRating))} styles={styles} />
                  </div>
                  <p className={cn(styles.reviewCount)}>Based on {reviews.length} reviews</p>
                </div>
              </ScrollReveal>
            </aside>

            <section className={cn(styles.reviewsList)} role="region" aria-label="Client reviews" title="Client reviews">
              {reviews.length === 0 ? (
                <ScrollReveal delay={0.2}>
                  <div className={cn(styles.emptyState)}>
                    <h3>No Reviews Yet</h3>
                    <p>Complete projects to start receiving client feedback.</p>
                  </div>
                </ScrollReveal>
              ) : (
                <StaggerContainer delay={0.2}>
                  {reviews.map((review) => (
                    <StaggerItem key={review.id}>
                      <div className={cn(styles.reviewItem)}>
                        <div className={cn(styles.reviewItemHeader)}>
                          <UserAvatar name={review.reviewer_name || `User #${review.reviewer_id}`} />
                          <div className={cn(styles.reviewItemInfo)}>
                            <span className={cn(styles.clientName)}>{review.reviewer_name || `Client #${review.reviewer_id}`}</span>
                            <span className={cn(styles.projectName)}>
                              {review.project_name ? `for ${review.project_name}` : `Contract #${review.contract_id}`}
                            </span>
                          </div>
                          <div className={cn(styles.reviewItemRating)}>
                            <StarRating rating={review.rating} styles={styles} />
                            <span className={cn(styles.date)}>{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className={cn(styles.reviewItemComment)}>{review.review_text}</p>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </section>
          </main>
        )}
      </div>
    </PageTransition>
  );
};

export default ReviewsPage;

