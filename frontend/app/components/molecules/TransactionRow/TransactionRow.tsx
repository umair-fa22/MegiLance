// @AI-HINT: This is the refactored TransactionRow component, using premium, theme-aware styles and the useMemo hook for a polished and efficient implementation.
'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import commonStyles from './TransactionRow.common.module.css';
import lightStyles from './TransactionRow.light.module.css';
import darkStyles from './TransactionRow.dark.module.css';

export interface TransactionRowProps {
  date: string;
  description: string;
  amount: string | number;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ date, description, amount }) => {
  const { resolvedTheme } = useTheme();

  const styles = useMemo(() => {
    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
    return { ...commonStyles, ...themeStyles };
  }, [resolvedTheme]);

  const isPositive = typeof amount === 'number' ? amount >= 0 : !String(amount).startsWith('-');
  const formattedAmount = typeof amount === 'number' 
    ? `${amount >= 0 ? '+' : ''}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}`
    : amount;

  return (
    <div
      className={styles.row}
      aria-label={`Transaction: ${description} on ${date} for ${formattedAmount}`}
    >
      <span className={styles.date} title={`Date: ${date}`}>{date}</span>
      <span className={styles.description} title={description}>{description}</span>
      <span
        className={`${styles.amount} ${isPositive ? styles.positive : styles.negative}`}
        title={`Amount: ${formattedAmount}`}
      >
        {formattedAmount}
      </span>
    </div>
  );
};

export default TransactionRow;
