// @AI-HINT: This is a reusable ActionMenu component for displaying a list of actions in a popover. It's designed for card-based UIs and supports theme-aware styling.
'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';

import commonStyles from './ActionMenu.common.module.css';
import lightStyles from './ActionMenu.light.module.css';
import darkStyles from './ActionMenu.dark.module.css';

export interface ActionMenuItem {
  /** Label text for the action */
  label?: string;
  /** Click handler */
  onClick?: () => void;
  /** Icon component */
  icon?: React.ElementType;
  /** Render as separator */
  isSeparator?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Destructive action styling (e.g., delete) */
  destructive?: boolean;
}

export interface ActionMenuProps {
  /** Menu items to display */
  items: ActionMenuItem[];
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Accessible label for the menu */
  ariaLabel?: string;
  /** Disable the entire menu */
  disabled?: boolean;
  /** Alignment of the menu */
  align?: 'start' | 'end';
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  trigger,
  ariaLabel = 'Actions menu',
  disabled = false,
  align = 'end',
}) => {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  // Get actionable items (not separators, not disabled)
  const actionableItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.isSeparator && !item.disabled);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    // Focus first actionable item
    if (actionableItems.length > 0) {
      setFocusedIndex(actionableItems[0].index);
    }
  }, [disabled, actionableItems]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleClose, handleOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      // Open on arrow down when focused on trigger
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
      case 'ArrowDown': {
        event.preventDefault();
        const currentActionIndex = actionableItems.findIndex(({ index }) => index === focusedIndex);
        const nextActionIndex = (currentActionIndex + 1) % actionableItems.length;
        setFocusedIndex(actionableItems[nextActionIndex].index);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const currentActionIndex = actionableItems.findIndex(({ index }) => index === focusedIndex);
        const prevActionIndex = (currentActionIndex - 1 + actionableItems.length) % actionableItems.length;
        setFocusedIndex(actionableItems[prevActionIndex].index);
        break;
      }
      case 'Home':
        event.preventDefault();
        if (actionableItems.length > 0) {
          setFocusedIndex(actionableItems[0].index);
        }
        break;
      case 'End':
        event.preventDefault();
        if (actionableItems.length > 0) {
          setFocusedIndex(actionableItems[actionableItems.length - 1].index);
        }
        break;
      case 'Tab':
        // Close menu on tab and let focus move naturally
        handleClose();
        break;
    }
  }, [isOpen, focusedIndex, actionableItems, handleClose, handleOpen]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const handleItemClick = (item: ActionMenuItem) => {
    if (item.disabled) return;
    if (item.onClick) {
      item.onClick();
    }
    handleClose();
  };

  return (
    <div className={cn(commonStyles.menuContainer)} ref={menuRef} onKeyDown={handleKeyDown}>
      {trigger ? (
        <button
          type="button"
          ref={triggerRef}
          onClick={handleToggle}
          className={cn(commonStyles.customTrigger, themeStyles.customTrigger)}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          aria-label={ariaLabel}
        >
          {trigger}
        </button>
      ) : (
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          aria-label={ariaLabel}
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </Button>
      )}

      {isOpen && (
        <div
          id={menuId}
          className={cn(
            commonStyles.menu,
            themeStyles.menu,
            align === 'start' && commonStyles.alignStart,
            align === 'end' && commonStyles.alignEnd
          )}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={triggerRef.current?.id}
        >
          {items.map((item, index) =>
            item.isSeparator ? (
              <div 
                key={`separator-${index}`} 
                className={cn(commonStyles.separator, themeStyles.separator)} 
                role="separator"
                aria-hidden="true"
              />
            ) : (
              <button
                key={item.label || `item-${index}`}
                ref={(el) => { itemRefs.current[index] = el; }}
                type="button"
                className={cn(
                  commonStyles.menuItem,
                  themeStyles.menuItem,
                  focusedIndex === index && commonStyles.menuItemFocused,
                  focusedIndex === index && themeStyles.menuItemFocused,
                  item.disabled && commonStyles.menuItemDisabled,
                  item.disabled && themeStyles.menuItemDisabled,
                  item.destructive && commonStyles.menuItemDestructive,
                  item.destructive && themeStyles.menuItemDestructive
                )}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => !item.disabled && setFocusedIndex(index)}
                role="menuitem"
                disabled={item.disabled}
                tabIndex={focusedIndex === index ? 0 : -1}
                aria-disabled={item.disabled}
              >
                {item.icon && (
                  <item.icon 
                    className={cn(commonStyles.itemIcon, themeStyles.itemIcon)} 
                    size={16} 
                    aria-hidden="true"
                  />
                )}
                <span className={cn(commonStyles.itemLabel, themeStyles.itemLabel)}>{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
