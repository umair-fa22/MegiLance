// @AI-HINT: Accessible confirmation dialog for destructive actions (delete, cancel, etc.)
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertTriangle, X } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import Modal from '@/app/components/organisms/Modal/Modal';

import commonStyles from './ConfirmationDialog.common.module.css';
import lightStyles from './ConfirmationDialog.light.module.css';
import darkStyles from './ConfirmationDialog.dark.module.css';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  className?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
  onConfirm,
  onCancel,
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  const confirmVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary';

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className={cn(commonStyles.dialog, themeStyles.dialog, commonStyles[variant], themeStyles[variant], className)}>
        {/* Icon */}
        <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}>
          <AlertTriangle className={cn(commonStyles.icon, themeStyles.icon)} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className={cn(commonStyles.content, themeStyles.content)}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>{title}</h2>
          <p className={cn(commonStyles.description, themeStyles.description)}>{description}</p>
        </div>

        {/* Actions */}
        <div className={cn(commonStyles.actions, themeStyles.actions)}>
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming || isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            isLoading={isConfirming || isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
