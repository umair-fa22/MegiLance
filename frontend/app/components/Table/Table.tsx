// @AI-HINT: This is a Table component, an organism for displaying structured data with full accessibility support.
'use client';

import React, { useId, useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import commonStyles from './Table.common.module.css';
import lightStyles from './Table.light.module.css';
import darkStyles from './Table.dark.module.css';

// Generic type for row data to allow for flexible table data
export type TableRow = Record<string, unknown>;

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn {
  /** Unique key for the column, corresponds to data field */
  key: string;
  /** Column header text */
  header: string;
  /** Optional render function for custom cell content */
  render?: (row: TableRow, rowIndex: number) => React.ReactNode;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Custom sort comparator */
  sortFn?: (a: TableRow, b: TableRow) => number;
  /** Accessible label for the column (if different from header) */
  ariaLabel?: string;
  /** Column width (CSS value) */
  width?: string;
}

export interface TableProps {
  /** Column definitions */
  columns: TableColumn[];
  /** Row data */
  data: TableRow[];
  /** Table caption for accessibility */
  caption?: string;
  /** Hide caption visually but keep for screen readers */
  hideCaption?: boolean;
  /** Unique row key field (defaults to 'id' or row index) */
  rowKey?: string;
  /** Callback when a row is clicked */
  onRowClick?: (row: TableRow, index: number) => void;
  /** Enable row hover effect */
  hoverable?: boolean;
  /** Enable striped rows */
  striped?: boolean;
  /** Enable compact mode */
  compact?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Loading state */
  loading?: boolean;
}

const Table: React.FC<TableProps> = ({ 
  columns, 
  data, 
  caption,
  hideCaption = false,
  rowKey = 'id',
  onRowClick,
  hoverable = true,
  striped = false,
  compact = false,
  emptyMessage = 'No data available',
  className,
  loading = false,
}) => {
  const tableId = useId();
  const { resolvedTheme } = useTheme();
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);


  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const handleSort = useCallback((column: TableColumn) => {
    if (!column.sortable) return;
    
    if (sortColumn === column.key) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column.key);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;
    
    const column = columns.find(c => c.key === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      if (column.sortFn) {
        const result = column.sortFn(a, b);
        return sortDirection === 'desc' ? -result : result;
      }
      
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [data, columns, sortColumn, sortDirection]);

  const getRowKey = (row: TableRow, index: number): string => {
    const key = row[rowKey];
    if (key !== null && key !== undefined) return String(key);
    return `row-${index}`;
  };

  const getSortIcon = (column: TableColumn) => {
    if (!column.sortable) return null;
    
    if (sortColumn !== column.key) {
      return <ChevronsUpDown size={14} className={commonStyles.sortIcon} aria-hidden="true" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp size={14} className={commonStyles.sortIconActive} aria-hidden="true" />;
    }
    return <ChevronDown size={14} className={commonStyles.sortIconActive} aria-hidden="true" />;
  };

  const getSortAriaLabel = (column: TableColumn): string => {
    if (!column.sortable) return column.ariaLabel || column.header;
    
    const baseLabel = column.ariaLabel || column.header;
    if (sortColumn !== column.key) {
      return `${baseLabel}, click to sort ascending`;
    }
    if (sortDirection === 'asc') {
      return `${baseLabel}, sorted ascending, click to sort descending`;
    }
    return `${baseLabel}, sorted descending, click to clear sort`;
  };

  return (
    <div 
      className={cn(
        commonStyles.tableContainer, 
        themeStyles.tableContainer,
        loading && commonStyles.loading,
        className
      )}
      role="region"
      aria-labelledby={caption ? `${tableId}-caption` : undefined}
      aria-busy={loading}
    >
      <table 
        className={cn(
          commonStyles.table, 
          themeStyles.table,
          compact && commonStyles.compact,
          striped && commonStyles.striped
        )}
      >
        {caption && (
          <caption 
            id={`${tableId}-caption`}
            className={cn(
              commonStyles.caption, 
              themeStyles.caption,
              hideCaption && commonStyles.visuallyHidden
            )}
          >
            {caption}
          </caption>
        )}
        <thead className={cn(commonStyles.tableThead, themeStyles.tableThead)}>
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key} 
                scope="col" 
                className={cn(
                  commonStyles.tableTh, 
                  themeStyles.tableTh,
                  col.sortable && commonStyles.sortable
                )}
                style={col.width ? { width: col.width } : undefined}
                aria-sort={
                  sortColumn === col.key 
                    ? sortDirection === 'asc' ? 'ascending' : 'descending'
                    : undefined
                }
                onClick={col.sortable ? () => handleSort(col) : undefined}
                onKeyDown={col.sortable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort(col);
                  }
                } : undefined}
                tabIndex={col.sortable ? 0 : undefined}
                role={col.sortable ? 'columnheader button' : 'columnheader'}
                aria-label={getSortAriaLabel(col)}
              >
                <span className={commonStyles.thContent}>
                  {col.header}
                  {getSortIcon(col)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(commonStyles.tableTbody, themeStyles.tableTbody)}>
          {sortedData.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className={cn(commonStyles.emptyState, themeStyles.emptyState)}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr 
                key={getRowKey(row, rowIndex)} 
                className={cn(
                  commonStyles.tableTbodyTr, 
                  themeStyles.tableTbodyTr, 
                  rowIndex === sortedData.length - 1 && commonStyles.tableTbodyTrLastChild,
                  hoverable && commonStyles.hoverable,
                  onRowClick && commonStyles.clickable
                )}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                onKeyDown={onRowClick ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick(row, rowIndex);
                  }
                } : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((col) => (
                  <td 
                    key={`${col.key}-${rowIndex}`} 
                    className={cn(commonStyles.tableTd, themeStyles.tableTd)}
                  >
                    {col.render ? col.render(row, rowIndex) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
