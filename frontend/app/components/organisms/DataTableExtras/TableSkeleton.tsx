// @AI-HINT: Simple table skeleton for loading states to avoid layout shifts.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './TableSkeleton.common.module.css';
import lightStyles from './TableSkeleton.light.module.css';
import darkStyles from './TableSkeleton.dark.module.css';

interface TableSkeletonProps {
  rows?: number;
  cols: number;
  dense?: boolean;
  useCards?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 6, cols, dense, useCards }) => {
  const { resolvedTheme } = useTheme();
  const styles = useMemo(() => (resolvedTheme === 'dark' ? { ...commonStyles, ...darkStyles } : { ...commonStyles, ...lightStyles }), [resolvedTheme]);
  return (
    <div className={styles.wrap} aria-hidden="true" data-cards={useCards ? '1' : '0'}>
      {[...Array(rows)].map((_, r) => (
        <div key={r} className={styles.row} data-dense={dense ? '1' : '0'}>
          {[...Array(cols)].map((__, c) => (<div key={c} className={styles.cell} />))}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
