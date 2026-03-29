// @AI-HINT: Reusable, theme-aware pagination bar with page numbers, accessible labels and keyboard-friendly controls.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import commonStyles from './PaginationBar.common.module.css';
import lightStyles from './PaginationBar.light.module.css';
import darkStyles from './PaginationBar.dark.module.css';

export interface PaginationBarProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Optional total result count for display */
  totalResults?: number;
  /** Navigate to previous page */
  onPrev: () => void;
  /** Navigate to next page */
  onNext: () => void;
  /** Navigate to a specific page */
  onPageChange?: (page: number) => void;
  /** Maximum number of page buttons visible at once */
  maxVisiblePages?: number;
  /** Additional class names */
  className?: string;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalResults,
  onPrev,
  onNext,
  onPageChange,
  maxVisiblePages = 5,
  className,
}) => {
  const { resolvedTheme } = useTheme();

  const themed = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Calculate visible page range
  const pageNumbers = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('ellipsis-start');
    }

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('ellipsis-end');
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  const handlePageClick = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn(commonStyles.paginationBar, themed.paginationBar, className)}
      role="navigation"
      aria-label="Pagination"
    >
      {/* First page */}
      {totalPages > maxVisiblePages && (
        <button
          type="button"
          className={cn(commonStyles.navButton, themed.navButton)}
          onClick={() => handlePageClick(1)}
          disabled={currentPage <= 1}
          aria-label="First page"
        >
          <ChevronsLeft size={16} aria-hidden="true" />
        </button>
      )}

      {/* Previous */}
      <button
        type="button"
        className={cn(commonStyles.navButton, themed.navButton)}
        onClick={onPrev}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {/* Page numbers */}
      <div className={commonStyles.pageNumbers}>
        {pageNumbers.map((page, index) => {
          if (typeof page === 'string') {
            return (
              <span
                key={page}
                className={cn(commonStyles.ellipsis, themed.ellipsis)}
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              className={cn(
                commonStyles.pageButton,
                themed.pageButton,
                isCurrent && cn(commonStyles.pageButtonActive, themed.pageButtonActive)
              )}
              onClick={() => handlePageClick(page)}
              aria-label={`Page ${page}`}
              aria-current={isCurrent ? 'page' : undefined}
              disabled={isCurrent}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next */}
      <button
        type="button"
        className={cn(commonStyles.navButton, themed.navButton)}
        onClick={onNext}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>

      {/* Last page */}
      {totalPages > maxVisiblePages && (
        <button
          type="button"
          className={cn(commonStyles.navButton, themed.navButton)}
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage >= totalPages}
          aria-label="Last page"
        >
          <ChevronsRight size={16} aria-hidden="true" />
        </button>
      )}

      {/* Info */}
      {typeof totalResults === 'number' && (
        <span className={cn(commonStyles.paginationInfo, themed.paginationInfo)} aria-live="polite">
          {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''}
        </span>
      )}
    </nav>
  );
};

export default PaginationBar;
