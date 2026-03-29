// @AI-HINT: This is the Modal component for dialogs, confirmations, and overlays. All styles are per-component only. See Modal.common.css, Modal.light.css, and Modal.dark.css for theming.
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import commonStyles from './Modal.common.module.css';
import lightStyles from './Modal.light.module.css';
import darkStyles from './Modal.dark.module.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Optional description for screen readers */
  description?: string;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  /** Whether clicking outside the modal closes it (default: true) */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the modal (default: true) */
  closeOnEscape?: boolean;
  /** ID of the element that triggered the modal (for returning focus) */
  triggerElementId?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  description,
  footer, 
  size = 'medium', 
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  triggerElementId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  // Generate unique IDs for accessibility
  const modalTitleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const modalDescId = useRef(`modal-desc-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
    // Return focus to trigger element or previously focused element
    requestAnimationFrame(() => {
      if (triggerElementId) {
        document.getElementById(triggerElementId)?.focus();
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    });
  }, [onClose, triggerElementId]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        handleClose();
      }
    };

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = 'hidden';
      // Focus the modal after a brief delay to ensure it's rendered
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose, closeOnEscape]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const sizeClass = {
    small: commonStyles.sizeSmall,
    medium: commonStyles.sizeMedium,
    large: commonStyles.sizeLarge,
  }[size];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={cn(commonStyles.modalOverlay, themeStyles.modalOverlay)}
          onClick={handleOverlayClick}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={cn(commonStyles.modalContent, themeStyles.modalContent, sizeClass, className)}
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? modalTitleId.current : undefined}
            aria-describedby={description ? modalDescId.current : undefined}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              mass: 1
            }}
          >
            <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
              {title && (
                <h2 
                  id={modalTitleId.current} 
                  className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}
                >
                  {title}
                </h2>
              )}
              <button 
                type="button"
                onClick={handleClose} 
                className={cn(commonStyles.closeButton, themeStyles.closeButton)} 
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {description && (
              <p id={modalDescId.current} className="sr-only">
                {description}
              </p>
            )}
            <div className={cn(commonStyles.modalBody, themeStyles.modalBody)}>
              {children}
            </div>
            {footer && (
              <div className={cn(commonStyles.modalFooter, themeStyles.modalFooter)}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
