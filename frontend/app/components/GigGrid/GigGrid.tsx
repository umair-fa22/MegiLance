// @AI-HINT: GigGrid component - responsive grid layout for displaying multiple gig cards with sorting/filtering
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Grid, List, Search, Package } from 'lucide-react';
import GigCard, { GigCardProps } from '@/app/components/GigCard/GigCard';
import Button from '@/app/components/Button/Button';
import common from './GigGrid.common.module.css';
import light from './GigGrid.light.module.css';
import dark from './GigGrid.dark.module.css';

export interface GigGridProps {
  gigs: GigCardProps[];
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showControls?: boolean;
  showPagination?: boolean;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  layout?: 'grid' | 'list';
  density?: 'compact' | 'normal' | 'wide';
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  onLayoutChange?: (layout: 'grid' | 'list') => void;
  onFavoriteToggle?: (id: number | string) => void;
  onQuickOrder?: (id: number | string) => void;
  currentPage?: number;
  totalPages?: number;
  totalResults?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

const GigGrid: React.FC<GigGridProps> = ({
  gigs,
  title,
  subtitle,
  showHeader = true,
  showControls = true,
  showPagination = true,
  isLoading = false,
  emptyTitle = 'No gigs found',
  emptyDescription = 'Try adjusting your search or filters to find what you\'re looking for.',
  emptyActionLabel = 'Clear Filters',
  onEmptyAction,
  layout = 'grid',
  density = 'normal',
  sortBy = 'recommended',
  onSortChange,
  onLayoutChange,
  onFavoriteToggle,
  onQuickOrder,
  currentPage = 1,
  totalPages = 1,
  totalResults,
  onPageChange,
  className,
}) => {
  const { resolvedTheme } = useTheme();


  const themed = resolvedTheme === 'dark' ? dark : light;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn(common.container, themed.theme, className)}>
        <div className={common.skeleton}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn(common.skeletonCard, themed.skeletonCard)} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (gigs.length === 0) {
    return (
      <div className={cn(common.container, themed.theme, className)}>
        <div className={common.emptyState}>
          <div className={cn(common.emptyIcon, themed.emptyIcon)}>
            <Package size={40} />
          </div>
          <h3 className={cn(common.emptyTitle, themed.emptyTitle)}>{emptyTitle}</h3>
          <p className={cn(common.emptyDescription, themed.emptyDescription)}>
            {emptyDescription}
          </p>
          {onEmptyAction && (
            <div className={common.emptyAction}>
              <Button variant="primary" onClick={onEmptyAction}>
                {emptyActionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className={common.pagination}>
        <button
          className={cn(common.pageButton, themed.pageButton)}
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>

        {pages.map((page, index) =>
          typeof page === 'number' ? (
            <button
              key={index}
              className={cn(
                common.pageButton,
                themed.pageButton,
                page === currentPage && cn(common.active, themed.active)
              )}
              onClick={() => onPageChange?.(page)}
            >
              {page}
            </button>
          ) : (
            <span key={index} className={cn(common.pageButton, common.ellipsis)}>
              {page}
            </span>
          )
        )}

        <button
          className={cn(common.pageButton, themed.pageButton)}
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className={cn(common.container, themed.theme, className)}>
      {/* Header */}
      {showHeader && (title || showControls) && (
        <div className={common.header}>
          <div className={common.titleSection}>
            {title && <h2 className={cn(common.title, themed.title)}>{title}</h2>}
            {subtitle && <p className={cn(common.subtitle, themed.subtitle)}>{subtitle}</p>}
            {totalResults !== undefined && (
              <span className={cn(common.resultsCount, themed.resultsCount)}>
                {totalResults.toLocaleString()} services available
              </span>
            )}
          </div>

          {showControls && (
            <div className={common.controls}>
              <select
                className={cn(common.sortDropdown, themed.sortDropdown)}
                value={sortBy}
                onChange={(e) => onSortChange?.(e.target.value)}
                aria-label="Sort by"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className={common.viewToggle}>
                <button
                  className={cn(
                    common.viewButton,
                    themed.viewButton,
                    layout === 'grid' && cn(common.active, themed.active)
                  )}
                  onClick={() => onLayoutChange?.('grid')}
                  aria-label="Grid view"
                  aria-pressed={layout === 'grid'}
                >
                  <Grid size={18} />
                </button>
                <button
                  className={cn(
                    common.viewButton,
                    themed.viewButton,
                    layout === 'list' && cn(common.active, themed.active)
                  )}
                  onClick={() => onLayoutChange?.('list')}
                  aria-label="List view"
                  aria-pressed={layout === 'list'}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gig Grid/List */}
      <div
        className={cn(
          layout === 'grid' ? common.grid : common.list,
          density === 'compact' && common.compact,
          density === 'wide' && common.wide
        )}
      >
        {gigs.map((gig) => (
          <GigCard
            key={gig.id}
            {...gig}
            onFavoriteToggle={onFavoriteToggle}
            onQuickOrder={onQuickOrder}
          />
        ))}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default GigGrid;
