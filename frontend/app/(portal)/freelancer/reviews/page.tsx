// @AI-HINT: Enhanced Reviews page with sub-ratings, distribution histogram, filtering, sort, and response capability.
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
import {
  Star, Filter, ArrowUpDown, MessageSquare, TrendingUp,
  ChevronDown, ChevronUp, Search, X,
} from 'lucide-react';

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
  reviewer_name?: string;
  project_name?: string;
  response_text?: string;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: Record<string, number>;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterRating = 0 | 1 | 2 | 3 | 4 | 5;

const StarRating: React.FC<{ rating: number; themed: Record<string, string> }> = ({ rating, themed }) => (
  <div className={cn(commonStyles.starRating)} role="img" aria-label={`${rating} out of 5 stars`}>
    {[...Array(5)].map((_, i) => (
      <span key={i} className={cn(commonStyles.star, themed.star, i >= rating ? commonStyles.empty : '')} aria-hidden="true">★</span>
    ))}
  </div>
);

const SubRatingBar: React.FC<{ label: string; value: number; themed: Record<string, string> }> = ({ label, value, themed }) => (
  <div className={commonStyles.subRatingRow}>
    <span className={cn(commonStyles.subRatingLabel, themed.subRatingLabel)}>{label}</span>
    <div className={cn(commonStyles.subRatingBarBg, themed.subRatingBarBg)}>
      <div className={commonStyles.subRatingBarFill} style={{ width: `${(value / 5) * 100}%` }} />
    </div>
    <span className={cn(commonStyles.subRatingValue, themed.subRatingValue)}>{value.toFixed(1)}</span>
  </div>
);

const ReviewsPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterRating, setFilterRating] = useState<FilterRating>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [expandedReview, setExpandedReview] = useState<number | null>(null);

  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userData: any = await api.auth.me();
      const userId = userData.id;
      try {
        const reviewsData = await (api.reviews as any).list?.({ user_id: userId });
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch { setReviews([]); }
      try {
        const statsData = await (api.reviews as any).getStats?.(userId);
        setStats(statsData as ReviewStats);
      } catch { /* calculate manually */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Derived stats
  const calculatedStats = useMemo(() => {
    if (stats) return stats;
    if (reviews.length === 0) return { average_rating: 0, total_reviews: 0, rating_breakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } };
    const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
    const breakdown: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    reviews.forEach(r => { const k = String(Math.min(5, Math.max(1, Math.round(r.rating)))); breakdown[k] = (breakdown[k] || 0) + 1; });
    return { average_rating: totalRating / reviews.length, total_reviews: reviews.length, rating_breakdown: breakdown };
  }, [stats, reviews]);

  // Sub-rating averages
  const subRatings = useMemo(() => {
    const rated = reviews.filter(r => r.communication_rating || r.quality_rating);
    if (rated.length === 0) return null;
    const avg = (field: keyof Review) => {
      const vals = rated.map(r => (r[field] as number) || 0).filter(v => v > 0);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    return {
      communication: avg('communication_rating'),
      quality: avg('quality_rating'),
      professionalism: avg('professionalism_rating'),
      deadline: avg('deadline_rating'),
    };
  }, [reviews]);

  // Filter & sort
  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    if (filterRating > 0) result = result.filter(r => Math.round(r.rating) === filterRating);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.review_text?.toLowerCase().includes(q) ||
        r.reviewer_name?.toLowerCase().includes(q) ||
        r.project_name?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'highest': result.sort((a, b) => b.rating - a.rating); break;
      case 'lowest': result.sort((a, b) => a.rating - b.rating); break;
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [reviews, filterRating, searchQuery, sortBy]);

  const handleSubmitResponse = (reviewId: number) => {
    if (!responseText.trim()) return;
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, response_text: responseText } : r));
    setRespondingTo(null);
    setResponseText('');
  };

  const averageRating = calculatedStats.average_rating.toFixed(1);
  const maxBreakdownCount = Math.max(1, ...Object.values(calculatedStats.rating_breakdown));

  if (!resolvedTheme) return null;

  return (
    <PageTransition>
      <div className={cn(commonStyles.pageWrapper, themed.pageWrapper)}>
        {/* Header */}
        <ScrollReveal>
          <header className={cn(commonStyles.header, themed.header)}>
            <div className={commonStyles.headerTop}>
              <div>
                <h1 className={cn(commonStyles.headerTitle, themed.headerTitle)}>
                  <Star size={26} /> My Reviews
                </h1>
                <p className={cn(commonStyles.headerSubtitle, themed.headerSubtitle)}>
                  See what clients say and track your reputation.
                </p>
              </div>
            </div>
          </header>
        </ScrollReveal>

        {error ? (
          <div className={cn(commonStyles.errorState, themed.errorState)}>
            <h3>Unable to Load Reviews</h3>
            <p>{error}</p>
            <Button variant="primary" onClick={fetchReviews}>Try Again</Button>
          </div>
        ) : loading ? (
          <div className={cn(commonStyles.loadingState, themed.loadingState)}>
            <div className={commonStyles.spinner} />
            <p>Loading your reviews...</p>
          </div>
        ) : (
          <>
            {/* Summary Row */}
            <ScrollReveal delay={0.1}>
              <div className={commonStyles.summaryRow}>
                {/* Overall Rating */}
                <div className={cn(commonStyles.summaryCard, themed.summaryCard)}>
                  <span className={cn(commonStyles.summaryLabel, themed.summaryLabel)}>Overall Rating</span>
                  <span className={cn(commonStyles.summaryScore, themed.summaryScore)}>{averageRating}</span>
                  <StarRating rating={Math.round(parseFloat(averageRating))} themed={themed} />
                  <span className={cn(commonStyles.summaryCount, themed.summaryCount)}>
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Distribution Histogram */}
                <div className={cn(commonStyles.distributionCard, themed.distributionCard)}>
                  <h3 className={cn(commonStyles.distributionTitle, themed.distributionTitle)}>Rating Distribution</h3>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = calculatedStats.rating_breakdown[String(star)] || 0;
                    const pct = reviews.length > 0 ? (count / maxBreakdownCount) * 100 : 0;
                    return (
                      <button
                        key={star}
                        type="button"
                        className={cn(commonStyles.distRow, themed.distRow, filterRating === star ? commonStyles.distRowActive : '')}
                        onClick={() => setFilterRating(filterRating === star ? 0 : star as FilterRating)}
                        aria-label={`Filter by ${star} stars (${count} reviews)`}
                      >
                        <span className={cn(commonStyles.distLabel, themed.distLabel)}>{star}★</span>
                        <div className={cn(commonStyles.distBarBg, themed.distBarBg)}>
                          <div className={commonStyles.distBarFill} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={cn(commonStyles.distCount, themed.distCount)}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-rating Breakdown */}
                {subRatings && (
                  <div className={cn(commonStyles.subRatingsCard, themed.subRatingsCard)}>
                    <h3 className={cn(commonStyles.distributionTitle, themed.distributionTitle)}>Category Ratings</h3>
                    <SubRatingBar label="Communication" value={subRatings.communication} themed={themed} />
                    <SubRatingBar label="Work Quality" value={subRatings.quality} themed={themed} />
                    <SubRatingBar label="Professionalism" value={subRatings.professionalism} themed={themed} />
                    <SubRatingBar label="On-Time Delivery" value={subRatings.deadline} themed={themed} />
                  </div>
                )}
              </div>
            </ScrollReveal>

            {/* Toolbar */}
            <ScrollReveal delay={0.15}>
              <div className={cn(commonStyles.toolbar, themed.toolbar)}>
                <div className={cn(commonStyles.searchWrap, themed.searchWrap)}>
                  <Search size={16} className={commonStyles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={cn(commonStyles.searchInput, themed.searchInput)}
                    aria-label="Search reviews"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className={commonStyles.searchClear} aria-label="Clear search">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className={cn(commonStyles.sortSelect, themed.sortSelect)}
                  aria-label="Sort reviews"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
                {filterRating > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterRating(0)}
                    className={cn(commonStyles.clearFilter, themed.clearFilter)}
                  >
                    <X size={12} /> Clear {filterRating}★ filter
                  </button>
                )}
                <span className={cn(commonStyles.resultCount, themed.resultCount)}>
                  {filteredReviews.length} of {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            </ScrollReveal>

            {/* Reviews List */}
            <section aria-label="Client reviews">
              {filteredReviews.length === 0 ? (
                <div className={cn(commonStyles.emptyState, themed.emptyState)}>
                  <h3>{reviews.length === 0 ? 'No Reviews Yet' : 'No Matching Reviews'}</h3>
                  <p>{reviews.length === 0 ? 'Complete projects to start receiving client feedback.' : 'Try adjusting your filters.'}</p>
                </div>
              ) : (
                <StaggerContainer className={commonStyles.reviewsList} delay={0.2}>
                  {filteredReviews.map(review => {
                    const isExpanded = expandedReview === review.id;
                    return (
                      <StaggerItem key={review.id}>
                        <div className={cn(commonStyles.reviewItem, themed.reviewItem)}>
                          <div className={commonStyles.reviewItemHeader}>
                            <UserAvatar name={review.reviewer_name || `User #${review.reviewer_id}`} />
                            <div className={commonStyles.reviewItemInfo}>
                              <span className={cn(commonStyles.clientName, themed.clientName)}>
                                {review.reviewer_name || `Client #${review.reviewer_id}`}
                              </span>
                              <span className={cn(commonStyles.projectName, themed.projectName)}>
                                {review.project_name ? `for ${review.project_name}` : `Contract #${review.contract_id}`}
                              </span>
                            </div>
                            <div className={commonStyles.reviewItemRating}>
                              <StarRating rating={review.rating} themed={themed} />
                              <span className={cn(commonStyles.date, themed.date)}>
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <p className={cn(commonStyles.reviewItemComment, themed.reviewItemComment)}>{review.review_text}</p>

                          {/* Sub-ratings for this review */}
                          {(review.communication_rating || review.quality_rating) && (
                            <button
                              type="button"
                              className={cn(commonStyles.expandBtn, themed.expandBtn)}
                              onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              {isExpanded ? 'Hide details' : 'Show details'}
                            </button>
                          )}
                          {isExpanded && (
                            <div className={commonStyles.reviewSubRatings}>
                              {review.communication_rating && <SubRatingBar label="Communication" value={review.communication_rating} themed={themed} />}
                              {review.quality_rating && <SubRatingBar label="Quality" value={review.quality_rating} themed={themed} />}
                              {review.professionalism_rating && <SubRatingBar label="Professionalism" value={review.professionalism_rating} themed={themed} />}
                              {review.deadline_rating && <SubRatingBar label="Deadline" value={review.deadline_rating} themed={themed} />}
                            </div>
                          )}

                          {/* Response Section */}
                          {review.response_text && (
                            <div className={cn(commonStyles.responseBlock, themed.responseBlock)}>
                              <span className={cn(commonStyles.responseLabel, themed.responseLabel)}>Your Response:</span>
                              <p className={cn(commonStyles.responseText, themed.responseText)}>{review.response_text}</p>
                            </div>
                          )}

                          {!review.response_text && respondingTo !== review.id && (
                            <button
                              type="button"
                              className={cn(commonStyles.replyBtn, themed.replyBtn)}
                              onClick={() => { setRespondingTo(review.id); setResponseText(''); }}
                            >
                              <MessageSquare size={14} /> Reply
                            </button>
                          )}

                          {respondingTo === review.id && (
                            <div className={commonStyles.replyForm}>
                              <textarea
                                value={responseText}
                                onChange={e => setResponseText(e.target.value)}
                                placeholder="Write your response..."
                                className={cn(commonStyles.replyTextarea, themed.replyTextarea)}
                                rows={3}
                                aria-label="Write response"
                              />
                              <div className={commonStyles.replyActions}>
                                <Button variant="primary" size="sm" onClick={() => handleSubmitResponse(review.id)}>
                                  Submit
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setRespondingTo(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}
            </section>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default ReviewsPage;

