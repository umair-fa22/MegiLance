// @AI-HINT: Display-only star rating component with fractional star support, accessible labels, and theme-aware styling.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

import commonStyles from './StarRating.common.module.css';
import lightStyles from './StarRating.light.module.css';
import darkStyles from './StarRating.dark.module.css';

export interface StarRatingProps {
  /** Rating value (supports decimals e.g. 4.3) */
  rating: number;
  /** Total number of stars to display */
  totalStars?: number;
  /** Star size in pixels */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the numeric rating beside stars */
  showValue?: boolean;
  /** Whether to show review count */
  reviewCount?: number;
  /** Additional class names */
  className?: string;
}

const sizeMap = { sm: 12, md: 16, lg: 20 };

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalStars = 5,
  size = 'md',
  showValue = false,
  reviewCount,
  className,
}) => {
  const { resolvedTheme } = useTheme();

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const pixelSize = sizeMap[size];
  const clampedRating = Math.min(Math.max(0, rating), totalStars);

  const renderStar = (index: number) => {
    const fillAmount = clampedRating - index;

    if (fillAmount >= 1) {
      // Fully filled star
      return (
        <Star
          key={index}
          className={cn(commonStyles.star, themeStyles.star, commonStyles.filled, themeStyles.filled)}
          size={pixelSize}
          fill="currentColor"
          aria-hidden="true"
        />
      );
    }

    if (fillAmount >= 0.25) {
      // Half-filled star
      return (
        <span key={index} className={commonStyles.halfStarWrapper} aria-hidden="true">
          <Star
            className={cn(commonStyles.star, themeStyles.star, commonStyles.empty, themeStyles.empty)}
            size={pixelSize}
            aria-hidden="true"
          />
          <StarHalf
            className={cn(commonStyles.halfStar, themeStyles.star, commonStyles.filled, themeStyles.filled)}
            size={pixelSize}
            fill="currentColor"
            aria-hidden="true"
          />
        </span>
      );
    }

    // Empty star
    return (
      <Star
        key={index}
        className={cn(commonStyles.star, themeStyles.star, commonStyles.empty, themeStyles.empty)}
        size={pixelSize}
        aria-hidden="true"
      />
    );
  };

  const ariaLabel = reviewCount !== undefined
    ? `${clampedRating.toFixed(1)} out of ${totalStars} stars from ${reviewCount} reviews`
    : `${clampedRating.toFixed(1)} out of ${totalStars} stars`;

  return (
    <div
      className={cn(commonStyles.starRating, commonStyles[size], className)}
      role="img"
      aria-label={ariaLabel}
    >
      <span className={commonStyles.starsContainer}>
        {Array.from({ length: totalStars }, (_, index) => renderStar(index))}
      </span>
      {showValue && (
        <span className={cn(commonStyles.ratingValue, themeStyles.ratingValue)}>
          {clampedRating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn(commonStyles.reviewCount, themeStyles.reviewCount)}>
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
};

export default StarRating;
