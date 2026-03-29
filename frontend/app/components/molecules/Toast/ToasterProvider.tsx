// @AI-HINT: ToasterProvider exposes a global context to enqueue/dismiss toasts and renders a portal-based toast stack.
'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Toast, { ToastProps, ToastVariant } from './Toast';
import commonStyles from './ToasterProvider.common.module.css';
import lightStyles from './ToasterProvider.light.module.css';
import darkStyles from './ToasterProvider.dark.module.css';

export interface ToasterItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToasterContextValue {
  notify: (item: Omit<ToasterItem, 'id'>) => string;
  dismiss: (id: string) => void;
  // Convenience helpers used across pages (added to resolve missing property TS errors)
  success: (description: string, title?: string) => string;
  error: (description: string, title?: string) => string;
  info: (description: string, title?: string) => string;
}

const ToasterContext = createContext<ToasterContextValue | null>(null);
export const useToaster = () => {
  const ctx = useContext(ToasterContext);
  if (!ctx) throw new Error('useToaster must be used within <ToasterProvider>');
  return ctx;
};

export const ToasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToasterItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const notify = useCallback((item: Omit<ToasterItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [{ id, ...item }, ...prev].slice(0, 6));
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const success = useCallback((description: string, title = 'Success') => notify({ title, description, variant: 'success' }), [notify]);
  const error = useCallback((description: string, title = 'Error') => notify({ title, description, variant: 'danger' }), [notify]);
  const info = useCallback((description: string, title = 'Info') => notify({ title, description, variant: 'info' }), [notify]);

  const value = useMemo(() => ({ notify, dismiss, success, error, info }), [notify, dismiss, success, error, info]);

  return (
    <ToasterContext.Provider value={value}>
      {children}
      {isMounted && createPortal(
        <div className={cn(commonStyles.stack, themeStyles.stack)} aria-live="polite" aria-atomic="false">
          {items.map(({ id, title, description, variant = 'info', duration = 4000 }) => (
            <Toast
              key={id}
              title={title}
              description={description}
              variant={variant}
              show={true}
              duration={duration}
              onClose={() => dismiss(id)}
            />
          ))}
        </div>,
        document.body,
      )}
    </ToasterContext.Provider>
  );
};
