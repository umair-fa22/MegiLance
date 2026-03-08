// @AI-HINT: This Notification component is fully theme-aware, using a sophisticated system of CSS variables for styling. The base structure and animations are in the .common.module.css file, while all colors are defined in the .light.module.css and .dark.module.css files. This ensures a consistent, premium look that adapts perfectly to the selected theme.
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './Notification.common.module.css';
import lightStyles from './Notification.light.module.css';
import darkStyles from './Notification.dark.module.css';

export interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onClose?: () => void;
  className?: string;
  persistent?: boolean; // If true, won't auto-dismiss even with duration set
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const positionMap = {
  'top-right': commonStyles.positionTopRight,
  'top-left': commonStyles.positionTopLeft,
  'bottom-right': commonStyles.positionBottomRight,
  'bottom-left': commonStyles.positionBottomLeft,
  'top-center': commonStyles.positionTopCenter,
  'bottom-center': commonStyles.positionBottomCenter,
};

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type = 'info', 
  title,
  duration = 5000,
  position = 'top-right',
  onClose,
  className = '',
  persistent = false
}) => {
  const { resolvedTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  const IconComponent = iconMap[type];
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  // Map duration to CSS duration buckets to avoid inline styles
  const getDurationClass = (ms: number) => {
    if (ms <= 2000) return commonStyles.progress2s;
    if (ms <= 3000) return commonStyles.progress3s;
    if (ms <= 5000) return commonStyles.progress5s;
    if (ms <= 8000) return commonStyles.progress8s;
    return commonStyles.progress10s;
  };

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for exit animation
  }, [onClose]);

  const startTimer = useCallback(() => {
    if (duration > 0 && !persistent && onClose) {
      startTimeRef.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, remainingTimeRef.current);
    }
  }, [duration, persistent, onClose, handleClose]);

  const pauseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (remainingTimeRef.current > 0) {
      startTimer();
    }
  }, [startTimer]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, persistent, onClose, startTimer]);

  useEffect(() => {
    if (isPaused) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  }, [isPaused, pauseTimer, resumeTimer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      handleClose();
    }
  };


  return (
    <div 
      className={cn(
        commonStyles.notification,
        themeStyles.notification,
        commonStyles[type],
        themeStyles[type],
        positionMap[position],
        !isVisible && commonStyles.hidden,
        className
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={onClose ? 0 : -1}
    >
      <div className={cn(commonStyles.notificationContent, themeStyles.notificationContent)}>
        <div className={cn(commonStyles.notificationIcon, themeStyles.notificationIcon)}>
          <IconComponent size={20} />
        </div>
        <div className={cn(commonStyles.notificationBody, themeStyles.notificationBody)}>
          {title && (
            <div className={cn(commonStyles.notificationTitle, themeStyles.notificationTitle)}>{title}</div>
          )}
          <div className={cn(commonStyles.notificationMessage, themeStyles.notificationMessage)}>{message}</div>
        </div>
        {onClose && (
          <button 
            className={cn(commonStyles.notificationClose, themeStyles.notificationClose)} 
            onClick={handleClose}
            aria-label="Close notification"
            type="button"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {duration > 0 && !persistent && (
        <div
          className={cn(
            commonStyles.notificationProgress,
            themeStyles.notificationProgress,
            getDurationClass(duration),
            isPaused && commonStyles.progressPaused
          )}
        />
      )}
    </div>
  );
};

export default Notification;
