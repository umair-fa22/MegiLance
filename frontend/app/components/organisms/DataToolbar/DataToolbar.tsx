// @AI-HINT: Reusable, theme-aware toolbar for data pages (search, sort, page size, export). Avoid global styles; use per-component CSS modules.
'use client';

import React, { useMemo, useState, useId } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './DataToolbar.common.module.css';
import lightStyles from './DataToolbar.light.module.css';
import darkStyles from './DataToolbar.dark.module.css';
import type { ExportFormat } from '@/app/lib/csv';

export interface SortOption {
  value: string; // e.g. 'date:desc'
  label: string; // e.g. 'Newest'
}

interface DataToolbarProps {
  query: string;
  onQueryChange: (val: string) => void;
  sortValue: string; // e.g. `${key}:${dir}`
  onSortChange: (val: string) => void;
  pageSize: number;
  onPageSizeChange: (val: number) => void;
  sortOptions: SortOption[];
  pageSizeOptions?: number[]; // default [10,20,50]
  onExportCSV?: () => void; // backward-compatible single CSV export
  exportLabel?: string; // label for CSV button OR generic export button
  // New multi-format export API (optional)
  onExport?: (format: ExportFormat) => void;
  exportFormats?: ExportFormat[]; // defaults to ['csv','xlsx','pdf'] when onExport is provided
  exportDefaultFormat?: ExportFormat; // default 'csv'
  'aria-label'?: string;
  searchPlaceholder?: string;
  searchTitle?: string;
  sortTitle?: string;
  pageSizeTitle?: string;
  exportFormatTitle?: string;
}

const DataToolbar: React.FC<DataToolbarProps> = ({
  query,
  onQueryChange,
  sortValue,
  onSortChange,
  pageSize,
  onPageSizeChange,
  sortOptions,
  pageSizeOptions = [10, 20, 50],
  onExportCSV,
  exportLabel = 'Export',
  onExport,
  exportFormats,
  exportDefaultFormat = 'csv',
  'aria-label': ariaLabel = 'Data filters and actions',
  searchPlaceholder = 'Search',
  searchTitle = 'Search',
  sortTitle = 'Sort by',
  pageSizeTitle = 'Results per page',
  exportFormatTitle = 'Export format',
}) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const [fmt, setFmt] = useState<ExportFormat>(exportDefaultFormat);
  const uid = useId();
  const idQ = `${uid}-q`;
  const idSort = `${uid}-sort`;
  const idExportFmt = `${uid}-export-format`;
  const idPageSize = `${uid}-page-size`;

  return (
    <div className={styles.toolbar} role="group" aria-label={ariaLabel} title={ariaLabel}>
      <label htmlFor={idQ} className={styles.srOnly}>Search</label>
      <input
        id={idQ}
        className={styles.input}
        type="search"
        placeholder={searchPlaceholder}
        title={searchTitle}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <label htmlFor={idSort} className={styles.srOnly}>Sort</label>
      <select
        id={idSort}
        className={styles.select}
        value={sortValue}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Sort"
        title={sortTitle}
      >
        {sortOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {onExport && (
        <>
          <label htmlFor={idExportFmt} className={styles.srOnly}>Export format</label>
          <select
            id={idExportFmt}
            className={styles.select}
            value={fmt}
            onChange={(e) => setFmt(e.target.value as ExportFormat)}
            aria-label="Export format"
            title={exportFormatTitle}
          >
            {(exportFormats ?? ['csv','xlsx','pdf']).map(f => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
          <button
            type="button"
            className={styles.button}
            onClick={() => onExport(fmt)}
            aria-label={`${exportLabel} ${fmt.toUpperCase()}`}
            title={`${exportLabel} as ${fmt.toUpperCase()}`}
          >{exportLabel}</button>
        </>
      )}
      {!onExport && onExportCSV && (
        <button type="button" className={styles.button} onClick={onExportCSV} aria-label={exportLabel}>{exportLabel}</button>
      )}

      <label htmlFor={idPageSize} className={styles.srOnly}>Results per page</label>
      <select
        id={idPageSize}
        className={styles.select}
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        aria-label="Results per page"
        title={pageSizeTitle}
      >
        {pageSizeOptions.map(sz => <option key={sz} value={sz}>{sz}/page</option>)}
      </select>
    </div>
  );
};

export default DataToolbar;
