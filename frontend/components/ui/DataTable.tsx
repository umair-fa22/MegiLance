// @AI-HINT: Reusable DataTable component with sorting, pagination, and theming
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import commonStyles from './DataTable.common.module.css';
import lightStyles from './DataTable.light.module.css';
import darkStyles from './DataTable.dark.module.css';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, data, keyExtractor, onRowClick }: DataTableProps<T>) {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a: any, b: any) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  return (
    <div className={cn(commonStyles.wrapper, themeStyles.wrapper)}>
      <table className={cn(commonStyles.table, themeStyles.table)}>
        <thead className={cn(commonStyles.thead, themeStyles.thead)}>
          <motion.tr initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring" as const }}>
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  commonStyles.th,
                  themeStyles.th,
                  col.sortable && commonStyles.sortable
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className={commonStyles.thContent}>
                  {col.header}
                  {col.sortable && (
                    <span className={commonStyles.sortIcon}>
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      ) : (
                        <ChevronsUpDown size={16} />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </motion.tr>
        </thead>
        <tbody>
          {sortedData.map(row => (
            <motion.tr initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring" as const }}
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                commonStyles.tr,
                themeStyles.tr,
                onRowClick && commonStyles.clickable
              )}
            >
              {columns.map(col => (
                <td key={col.key} className={cn(commonStyles.td, themeStyles.td)}>
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
