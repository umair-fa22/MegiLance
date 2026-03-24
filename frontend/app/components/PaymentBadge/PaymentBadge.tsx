// @AI-HINT: This component displays a theme-aware status badge for payments. It uses a modern, CSS-variable-driven approach for styling to ensure it perfectly matches the application's current theme and the specific status (paid, pending, failed).
import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './PaymentBadge.common.module.css';
import lightStyles from './PaymentBadge.light.module.css';
import darkStyles from './PaymentBadge.dark.module.css';

export type PaymentStatus = 'paid' | 'pending' | 'failed';

export interface PaymentBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const statusLabels: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
};

const PaymentBadge: React.FC<PaymentBadgeProps> = ({ status, className }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const statusClass = commonStyles[status];

  return (
    <span
      className={cn(
        commonStyles.paymentBadge,
        themeStyles.paymentBadge,
        statusClass,
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
};

export default PaymentBadge;
