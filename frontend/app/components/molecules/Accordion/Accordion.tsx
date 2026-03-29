// @AI-HINT: This is a reusable accordion component for displaying collapsible content, like FAQs.
'use client';

import React, { useState, useContext, createContext, useId, useRef, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Accordion.common.module.css';
import lightStyles from './Accordion.light.module.css';
import darkStyles from './Accordion.dark.module.css';

// @AI-HINT: The Accordion is now context-aware to allow for 'single' or 'multiple' open items.

interface AccordionContextType {
  openItems: string[];
  toggleItem: (id: string) => void;
  type: 'single' | 'multiple';
  registerItem: (id: string, ref: HTMLButtonElement | null) => void;
  navigateItems: (direction: 'next' | 'prev' | 'first' | 'last', currentId: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion component');
  }
  return context;
};

interface AccordionItemProps {
  /** Unique value for this item */
  value: string;
  /** Title displayed in the header */
  title: string;
  /** Content to display when expanded */
  children: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ value, title, children, disabled = false }) => {
  const { openItems, toggleItem, registerItem, navigateItems } = useAccordion();
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const contentId = useId();
  const buttonId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isOpen = openItems.includes(value);

  // Register this item with the accordion context
  React.useEffect(() => {
    registerItem(value, buttonRef.current);
    return () => registerItem(value, null);
  }, [value, registerItem]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        navigateItems('next', value);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateItems('prev', value);
        break;
      case 'Home':
        e.preventDefault();
        navigateItems('first', value);
        break;
      case 'End':
        e.preventDefault();
        navigateItems('last', value);
        break;
    }
  }, [navigateItems, value]);

  return (
    <div 
      className={cn(
        commonStyles.accordionItem, 
        themeStyles.accordionItem, 
        isOpen && commonStyles.open,
        disabled && commonStyles.disabled
      )}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <h3 className={commonStyles.accordionHeader}>
        <button
          ref={buttonRef}
          id={buttonId}
          type="button"
          onClick={() => !disabled && toggleItem(value)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls={contentId}
          aria-disabled={disabled}
          disabled={disabled}
          className={cn(commonStyles.accordionTrigger, themeStyles.accordionTrigger)}
        >
          <span className={commonStyles.accordionTitle}>{title}</span>
          <motion.span 
            className={cn(commonStyles.accordionIcon, themeStyles.accordionIcon)}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={buttonId}
            className={commonStyles.accordionContent}
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className={cn(commonStyles.accordionContentText, themeStyles.accordionContentText)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AccordionProps {
  /** Accordion items */
  children: React.ReactNode;
  /** Single or multiple items can be open */
  type?: 'single' | 'multiple';
  /** Default open item(s) */
  defaultValue?: string | string[];
  /** Additional CSS classes */
  className?: string;
  /** Callback when items change */
  onValueChange?: (value: string[]) => void;
}

const Accordion: React.FC<AccordionProps> = ({ 
  children, 
  type = 'single', 
  defaultValue, 
  className,
  onValueChange,
}) => {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const itemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const itemOrder = useRef<string[]>([]);

  const registerItem = useCallback((id: string, ref: HTMLButtonElement | null) => {
    if (ref) {
      itemRefs.current.set(id, ref);
      if (!itemOrder.current.includes(id)) {
        itemOrder.current.push(id);
      }
    } else {
      itemRefs.current.delete(id);
      itemOrder.current = itemOrder.current.filter(item => item !== id);
    }
  }, []);

  const navigateItems = useCallback((direction: 'next' | 'prev' | 'first' | 'last', currentId: string) => {
    const items = itemOrder.current;
    const currentIndex = items.indexOf(currentId);
    
    let targetIndex: number;
    switch (direction) {
      case 'next':
        targetIndex = (currentIndex + 1) % items.length;
        break;
      case 'prev':
        targetIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'first':
        targetIndex = 0;
        break;
      case 'last':
        targetIndex = items.length - 1;
        break;
    }

    const targetId = items[targetIndex];
    const targetRef = itemRefs.current.get(targetId);
    targetRef?.focus();
  }, []);

  const toggleItem = useCallback((id: string) => {
    let newOpenItems: string[];
    if (type === 'single') {
      newOpenItems = openItems.includes(id) ? [] : [id];
    } else {
      newOpenItems = openItems.includes(id) 
        ? openItems.filter(item => item !== id) 
        : [...openItems, id];
    }
    setOpenItems(newOpenItems);
    onValueChange?.(newOpenItems);
  }, [type, openItems, onValueChange]);

  const { resolvedTheme } = useTheme();
  
  // Don't render until theme is resolved
  
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type, registerItem, navigateItems }}>
      <div className={cn(commonStyles.accordionRoot, themeStyles.accordionRoot, className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export default Accordion;
