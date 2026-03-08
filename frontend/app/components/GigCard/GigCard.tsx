// @AI-HINT: Fiverr-style gig card component for marketplace listings with seller info, ratings, and pricing
'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Heart, Star, Award, ShoppingCart } from 'lucide-react';
import common from './GigCard.common.module.css';
import light from './GigCard.light.module.css';
import dark from './GigCard.dark.module.css';

export interface GigSeller {
  id: number | string;
  name: string;
  username?: string;
  avatarUrl?: string;
  level: 'new_seller' | 'bronze' | 'silver' | 'gold' | 'platinum';
  isTopRated?: boolean;
}

export interface GigCardProps {
  id: number | string;
  title: string;
  slug?: string;
  thumbnailUrl?: string;
  seller: GigSeller;
  startingPrice: number;
  averageRating: number;
  totalReviews: number;
  category?: string;
  tags?: string[];
  isFeatured?: boolean;
  isProSeller?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: (id: number | string) => void;
  onQuickOrder?: (id: number | string) => void;
  className?: string;
}

const levelDisplayNames: Record<string, string> = {
  new_seller: 'New Seller',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

const GigCard: React.FC<GigCardProps> = ({
  id,
  title,
  slug,
  thumbnailUrl,
  seller,
  startingPrice,
  averageRating,
  totalReviews,
  category,
  tags = [],
  isFeatured = false,
  isProSeller = false,
  isFavorited = false,
  onFavoriteToggle,
  onQuickOrder,
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(isFavorited);


  const themed = resolvedTheme === 'dark' ? dark : light;
  const gigUrl = slug ? `/gigs/${slug}` : `/gigs/${id}`;
  const sellerUrl = `/freelancers/${seller.id}`;

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalFavorited(!localFavorited);
    onFavoriteToggle?.(id);
  }, [localFavorited, id, onFavoriteToggle]);

  const handleQuickOrder = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickOrder?.(id);
  }, [id, onQuickOrder]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `(${(count / 1000).toFixed(1)}k)`;
    }
    return `(${count})`;
  };

  return (
    <article
      className={cn(common.card, themed.theme, className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocusWithin(false);
        }
      }}
    >
      {/* Image Section */}
      <Link href={gigUrl} className={common.imageWrapper}>
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className={common.image}
            priority={isFeatured}
          />
        ) : (
          <div className={cn(common.image, common.thumbnailFallback)}>
            <ShoppingCart size={48} className={common.thumbnailIcon} aria-hidden="true" />
          </div>
        )}

        {/* Pro Seller Label */}
        {isProSeller && (
          <span className={cn(common.proLabel, themed.proLabel)}>PRO</span>
        )}

        {/* Level Badge */}
        {seller.level !== 'new_seller' && (
          <span
            className={cn(
              common.levelBadge,
              themed.levelBadge,
              themed[seller.level]
            )}
          >
            <Award size={12} />
            {levelDisplayNames[seller.level]}
          </span>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={cn(
            common.favoriteButton,
            themed.favoriteButton,
            localFavorited && themed.active
          )}
          aria-label={localFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={18}
            fill={localFavorited ? 'currentColor' : 'none'}
          />
        </button>
      </Link>

      {/* Content Section */}
      <div className={common.content}>
        {/* Seller Row */}
        <Link href={sellerUrl} className={common.sellerRow}>
          <div className={common.sellerAvatar}>
            {seller.avatarUrl ? (
              <Image
                src={seller.avatarUrl}
                alt={seller.name}
                width={28}
                height={28}
              />
            ) : (
              <div className={cn(common.sellerAvatarFallback, themed.sellerAvatarFallback)}>
                {seller.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={common.sellerInfo}>
            <span className={cn(common.sellerName, themed.sellerName)}>
              {seller.name}
            </span>
            <span
              className={cn(
                common.sellerLevel,
                themed.sellerLevel,
                seller.isTopRated && themed.topRated
              )}
            >
              {seller.isTopRated && <Star size={10} fill="currentColor" />}
              {seller.isTopRated
                ? 'Top Rated'
                : levelDisplayNames[seller.level]}
            </span>
          </div>
        </Link>

        {/* Title */}
        <div className={common.titleWrapper}>
          <Link href={gigUrl} className={cn(common.title, themed.title)}>
            {title}
          </Link>
        </div>

        {/* Rating Row */}
        {totalReviews > 0 && (
          <div className={cn(common.ratingRow, themed.ratingRow)}>
            <Star
              size={14}
              className={cn(common.starIcon, themed.starIcon)}
              fill="currentColor"
            />
            <span className={cn(common.ratingValue, themed.ratingValue)}>
              {averageRating.toFixed(1)}
            </span>
            <span className={cn(common.ratingCount, themed.ratingCount)}>
              {formatReviewCount(totalReviews)}
            </span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className={common.tags}>
            {tags.slice(0, 3).map((tag, index) => (
              <span key={index} className={cn(common.tag, themed.tag)}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer/Price */}
        <div className={cn(common.footer, themed.footer)}>
          <span className={cn(common.priceLabel, themed.priceLabel)}>
            Starting at
          </span>
          <span className={cn(common.priceValue, themed.priceValue)}>
            {formatPrice(startingPrice)}
          </span>
        </div>
      </div>

      {/* Quick Actions - visible on hover AND focus for keyboard accessibility */}
      {(isHovered || isFocusWithin) && onQuickOrder && (
        <div className={cn(common.quickActions, themed.quickActions)}>
          <button
            onClick={handleQuickOrder}
            className={cn(common.quickActionBtn, themed.quickActionBtn)}
          >
            Quick Order
          </button>
          <Link
            href={gigUrl}
            className={cn(
              common.quickActionBtn,
              themed.quickActionBtn,
              themed.secondary
            )}
          >
            View Details
          </Link>
        </div>
      )}
    </article>
  );
};

export default GigCard;
