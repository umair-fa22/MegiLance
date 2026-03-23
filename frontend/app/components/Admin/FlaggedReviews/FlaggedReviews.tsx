// @AI-HINT: This component provides a fully theme-aware interface for admins to moderate flagged reviews. It uses per-component CSS modules and the cn utility for robust, maintainable styling.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Card from '@/app/components/Card/Card';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import StarRating from '@/app/components/StarRating/StarRating';
import { ThumbsUp, ThumbsDown, Search, MessageSquareQuote, ListFilter, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

import commonStyles from './FlaggedReviews.common.module.css';
import lightStyles from './FlaggedReviews.light.module.css';
import darkStyles from './FlaggedReviews.dark.module.css';

interface APIReview {
  id: number;
  contract_id: number;
  reviewer_id: number;
  reviewed_user_id: number;
  rating: number;
  communication_rating?: number;
  quality_rating?: number;
  professionalism_rating?: number;
  deadline_rating?: number;
  review_text?: string;
  response?: string;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
}

interface FlaggedReview {
  id: string;
  reviewer: { id: number; name: string; avatarUrl: string; };
  reviewee: { id: number; name: string; avatarUrl: string; };
  rating: number;
  content: string;
  reason: string;
  dateFlagged: string;
  status: 'Pending' | 'Kept' | 'Removed';
}

// Detect flag reasons based on review content
function detectFlagReason(review: APIReview): { reason: string; shouldFlag: boolean } {
  const text = (review.review_text || '').toLowerCase();
  
  // Spam patterns
  const spamKeywords = ['http://', 'https://', '.com', 'click here', 'check out', 'discount', 'free'];
  if (spamKeywords.some(kw => text.includes(kw))) {
    return { reason: 'Spam', shouldFlag: true };
  }
  
  // Inappropriate language
  const inappropriateKeywords = ['scam', 'scammer', 'fraud', 'criminal', 'idiot', 'stupid'];
  if (inappropriateKeywords.some(kw => text.includes(kw))) {
    return { reason: 'Inappropriate Language', shouldFlag: true };
  }
  
  // Low rating with short review (possibly unfair)
  if (review.rating <= 2 && (!review.review_text || review.review_text.length < 50)) {
    return { reason: 'Potentially Unfair Review', shouldFlag: true };
  }
  
  // Very low rating
  if (review.rating <= 1) {
    return { reason: 'Very Low Rating', shouldFlag: true };
  }
  
  return { reason: '', shouldFlag: false };
}

export default function FlaggedReviews() {
  const { resolvedTheme } = useTheme();
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reviews and users in parallel
      const [reviewsData, usersData] = await Promise.all([
        api.reviews.list({ page_size: 100 }),
        api.admin.getUsers({ limit: 200 }),
      ]);
      
      const users = (usersData as any).users ?? usersData ?? [];
      
      // Create user lookup map
      const userMap = new Map<number, { name: string; avatar_url?: string }>();
      users.forEach((u: { id: number; name: string; avatar_url?: string }) => {
        userMap.set(u.id, { name: u.name || 'Unknown', avatar_url: u.avatar_url });
      });
      
      // Transform and filter flagged reviews
      const flaggedReviews: FlaggedReview[] = (reviewsData as unknown as APIReview[])
        .map(review => {
          const { reason, shouldFlag } = detectFlagReason(review);
          if (!shouldFlag) return null;
          
          const reviewer = userMap.get(review.reviewer_id) || { name: `User #${review.reviewer_id}`, avatar_url: '' };
          const reviewee = userMap.get(review.reviewed_user_id) || { name: `User #${review.reviewed_user_id}`, avatar_url: '' };
          
          return {
            id: String(review.id),
            reviewer: { id: review.reviewer_id, name: reviewer.name, avatarUrl: reviewer.avatar_url || '' },
            reviewee: { id: review.reviewed_user_id, name: reviewee.name, avatarUrl: reviewee.avatar_url || '' },
            rating: review.rating,
            content: review.review_text || 'No review text provided.',
            reason,
            dateFlagged: review.created_at || new Date().toISOString(),
            status: 'Pending' as const,
          };
        })
        .filter((r) => r !== null) as FlaggedReview[];
      
      setReviews(flaggedReviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleAction = async (id: string, newStatus: 'Kept' | 'Removed') => {
    // Optimistic update
    setReviews(prev => prev.map(review => (review.id === id ? { ...review, status: newStatus } : review)));
    
    // If removing, call delete API
    if (newStatus === 'Removed') {
      try {
        await api.reviews.delete(Number(id));
      } catch {
        // Review removal failed, revert optimistic update
        setReviews(prev => prev.map(review => (review.id === id ? { ...review, status: 'Pending' } : review)));
      }
    }
  };

  const filteredReviews = reviews
    .filter(review => statusFilter === 'All' || review.status === statusFilter)
    .filter(review => 
      review.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewee.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusBadgeVariant = (status: FlaggedReview['status']) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Kept': return 'success';
      case 'Removed': return 'danger';
      default: return 'default';
    }
  };


  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <header className={commonStyles.header}>
        <div className={commonStyles.headerContent}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>Flagged Review Queue</h2>
          <p className={cn(commonStyles.description, themeStyles.description)}>
            {loading ? 'Loading...' : `Showing ${filteredReviews.length} of ${reviews.length} flagged reviews.`}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchReviews}
          iconBefore={<RefreshCw size={16} />}
          aria-label="Refresh reviews"
        >
          Refresh
        </Button>
      </header>

      <div className={cn(commonStyles.filterToolbar, themeStyles.filterToolbar)}>
        <Input
          id="search-reviews"
          placeholder="Search by reviewer or reviewee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          iconBefore={<Search size={16} />}
        />
        <Select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: 'All', label: 'All Statuses' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Kept', label: 'Kept' },
            { value: 'Removed', label: 'Removed' },
          ]}
        />
      </div>

      {loading ? (
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          <Loader2 className={commonStyles.spinner} size={32} />
          <p>Loading flagged reviews...</p>
        </div>
      ) : error ? (
        <div className={cn(commonStyles.errorState, themeStyles.errorState)}>
          <AlertTriangle size={32} />
          <h3>Failed to load reviews</h3>
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchReviews}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className={commonStyles.reviewList}>
          {filteredReviews.map(review => (
            <Card key={review.id} className={cn(commonStyles.reviewCard, themeStyles.reviewCard)}>
              <div className={commonStyles.cardHeader}>
                <div className={commonStyles.userInfo}>
                  <UserAvatar src={review.reviewer.avatarUrl} name={review.reviewer.name} size={40} />
                  <div className={commonStyles.userMeta}>
                    <span className={commonStyles.userName}>{review.reviewer.name}</span>
                    <span className={commonStyles.userRole}>Reviewer</span>
                  </div>
                </div>
                <div className={commonStyles.userInfo}>
                  <UserAvatar src={review.reviewee.avatarUrl} name={review.reviewee.name} size={40} />
                  <div className={commonStyles.userMeta}>
                    <span className={commonStyles.userName}>{review.reviewee.name}</span>
                    <span className={commonStyles.userRole}>Reviewee</span>
                  </div>
                </div>
              </div>

              <div className={commonStyles.reviewContent}>
                <MessageSquareQuote className={cn(commonStyles.quoteIcon, themeStyles.quoteIcon)} size={20} />
                <p>{review.content}</p>
              </div>

              <div className={commonStyles.reviewDetails}>
                <StarRating rating={review.rating} />
                <Badge variant="default">Reason: {review.reason}</Badge>
              </div>

              <footer className={commonStyles.cardFooter}>
                <span className={cn(commonStyles.date, themeStyles.date)}>
                  Flagged: {new Date(review.dateFlagged).toLocaleDateString()}
                </span>
                {review.status === 'Pending' ? (
                  <div className={commonStyles.actions}>
                    <Button variant="success" size="sm" onClick={() => handleAction(review.id, 'Kept')}>
                      <ThumbsUp size={14} /> Keep Review
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleAction(review.id, 'Removed')}>
                      <ThumbsDown size={14} /> Remove Review
                    </Button>
                  </div>
                ) : (
                  <Badge variant={getStatusBadgeVariant(review.status)}>{review.status}</Badge>
                )}
              </footer>
            </Card>
          ))}
          {filteredReviews.length === 0 && (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <ListFilter size={48} />
              <h3>No Flagged Reviews</h3>
              <p>{reviews.length === 0 ? 'No reviews require moderation at this time.' : 'Adjust your filters to see more reviews.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlaggedReviews;
