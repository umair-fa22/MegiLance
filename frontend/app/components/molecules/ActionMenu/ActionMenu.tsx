// @AI-HINT: Reusable ActionMenu component using Floating UI and React Portals for consistent action overflow across the dashboard without layout clipping.
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';
import { cn } from '@/lib/utils';
import commonStyles from './ActionMenu.common.module.css';
import lightStyles from './ActionMenu.light.module.css';
import darkStyles from './ActionMenu.dark.module.css';

export interface ActionMenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Action handler */
  action: () => void;
  /** Optional icon (Lucide or custom) */
  icon?: React.ReactNode;
  /** Optional destructive flag for styling (e.g. red color) */
  destructive?: boolean;
}

export interface ActionMenuProps {
  /** Items to display in the menu */
  items: ActionMenuItem[];
  /** Optional custom trigger element */
  trigger?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Aria label for the menu */
  ariaLabel?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  trigger,
  className,
  ariaLabel = 'Open actions menu',
  size = 'md',
}) => {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-end',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        refs.reference.current && !(refs.reference.current as HTMLElement).contains(event.target as Node) &&
        refs.floating.current && !(refs.floating.current as HTMLElement).contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeMenu();
        (refs.reference.current as HTMLElement)?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu, refs]);

  const handleAction = useCallback(
    (e: React.MouseEvent, action: () => void) => {
      e.stopPropagation();
      action();
      closeMenu();
    },
    [closeMenu]
  );

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.container, themeStyles.container, className)} ref={menuRef}>
      <div ref={refs.setReference}>
      {trigger ? (
        <div onClick={toggleMenu} role="button" tabIndex={0} aria-haspopup="true" aria-expanded={isOpen} className={commonStyles.customTrigger}>
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          className={cn(commonStyles.trigger, themeStyles.trigger, commonStyles[\size-\\])}
          onClick={toggleMenu}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
        >
          <MoreVertical className={commonStyles.icon} />
        </button>
      )}
      </div>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={refs.setFloating}
              style={{ ...floatingStyles, zIndex: 1000 }}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(commonStyles.menu, themeStyles.menu)}
              role="menu"
              aria-orientation="vertical"
            >
              {items.length === 0 ? (
                <div className={cn(commonStyles.empty, themeStyles.empty)}>No actions</div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      commonStyles.item,
                      themeStyles.item,
                      item.destructive && commonStyles.destructive,
                      item.destructive && themeStyles.destructive
                    )}
                    onClick={(e) => handleAction(e, item.action)}
                    role="menuitem"
                  >
                    {item.icon && <span className={commonStyles.itemIcon}>{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </div>
  );
};

export default ActionMenu;
