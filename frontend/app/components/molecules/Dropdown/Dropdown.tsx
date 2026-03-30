// @AI-HINT: This is a Dropdown component, recreated to use Floating UI and Portals to prevent layout clipping.
'use client';

import React, { useState, useRef, useEffect, useId, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';
import { cn } from '@/lib/utils';
import commonStyles from './Dropdown.common.module.css';
import lightStyles from './Dropdown.light.module.css';
import darkStyles from './Dropdown.dark.module.css';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  selected: DropdownOption | null;
  onSelect: (option: DropdownOption) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  name?: string;
  required?: boolean;
}

const TYPE_AHEAD_TIMEOUT = 500;

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selected,
  onSelect,
  placeholder = 'Select...',
  className = '',
  ariaLabel,
  disabled = false,
  error = false,
  errorMessage,
  name,
  required = false,
}) => {
  const { resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [typeAheadQuery, setTypeAheadQuery] = useState('');
  
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const typeAheadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listId = useId();
  const labelId = useId();
  const errorId = useId();

  const handleSelect = useCallback((option: DropdownOption) => {
    if (option.disabled) return;
    onSelect(option);
    setIsOpen(false);
    (refs.reference.current as HTMLElement)?.focus();
  }, [onSelect, refs]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    const selectedIndex = options.findIndex((opt) => opt.value === selected?.value);
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, options, selected]);

  const handleTypeAhead = useCallback((char: string) => {
    if (typeAheadTimeoutRef.current) clearTimeout(typeAheadTimeoutRef.current);
    const newQuery = typeAheadQuery + char.toLowerCase();
    setTypeAheadQuery(newQuery);
    
    const matchIndex = options.findIndex(
      (opt) => !opt.disabled && opt.label.toLowerCase().startsWith(newQuery)
    );
    if (matchIndex >= 0) setFocusedIndex(matchIndex);
    
    typeAheadTimeoutRef.current = setTimeout(() => setTypeAheadQuery(''), TYPE_AHEAD_TIMEOUT);
  }, [typeAheadQuery, options]);

  useEffect(() => {
    return () => {
      if (typeAheadTimeoutRef.current) clearTimeout(typeAheadTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (refs.reference.current && !(refs.reference.current as HTMLElement).contains(event.target as Node) &&
          refs.floating.current && !(refs.floating.current as HTMLElement).contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen && document.activeElement === refs.reference.current) {
        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowUp':
          case 'Enter':
          case ' ':
            event.preventDefault();
            openDropdown();
            return;
        }
      }

      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          (refs.reference.current as HTMLElement)?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prevIndex) => {
            let nextIndex = prevIndex + 1;
            while (nextIndex < options.length && options[nextIndex]?.disabled) nextIndex++;
            return nextIndex < options.length ? nextIndex : prevIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prevIndex) => {
            let nextIndex = prevIndex - 1;
            while (nextIndex >= 0 && options[nextIndex]?.disabled) nextIndex--;
            return nextIndex >= 0 ? nextIndex : prevIndex;
          });
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && !options[focusedIndex]?.disabled) {
            handleSelect(options[focusedIndex]);
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
        case 'Home':
          event.preventDefault();
          const firstEnabled = options.findIndex((opt) => !opt.disabled);
          setFocusedIndex(firstEnabled >= 0 ? firstEnabled : 0);
          break;
        case 'End':
          event.preventDefault();
          for (let i = options.length - 1; i >= 0; i--) {
            if (!options[i].disabled) {
              setFocusedIndex(i);
              break;
            }
          }
          break;
        default:
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            handleTypeAhead(event.key);
          }
          break;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, options, handleSelect, openDropdown, handleTypeAhead, refs]);

  useEffect(() => {
    if (isOpen && focusedIndex !== -1) {
      const optionElement = document.getElementById(${listId}-option-);
      optionElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusedIndex, listId]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.dropdown, themeStyles.dropdown, className)} ref={dropdownRef}>
      <button
        ref={refs.setReference}
        type="button"
        name={name}
        className={cn(
          commonStyles.trigger,
          themeStyles.trigger,
          disabled && commonStyles.disabled,
          disabled && themeStyles.disabled,
          error && commonStyles.error,
          error && themeStyles.error
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={ariaLabel || placeholder}
        aria-required={required}
        aria-invalid={error}
        aria-describedby={error && errorMessage ? errorId : undefined}
      >
        <span id={labelId} className={cn(commonStyles.label, themeStyles.label, !selected && commonStyles.placeholder)}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={cn(commonStyles.caret, themeStyles.caret, isOpen && commonStyles.caretOpen)}
          aria-hidden="true"
        />
      </button>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              ref={refs.setFloating}
              style={{ ...floatingStyles, zIndex: 1000 }}
              id={listId}
              className={cn(commonStyles.options, themeStyles.options)}
              role="listbox"
              aria-labelledby={labelId}
              aria-activedescendant={focusedIndex >= 0 ? ${listId}-option- : undefined}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {options.length === 0 ? (
                <li className={cn(commonStyles.noOptions, themeStyles.noOptions)} role="option" aria-disabled="true">
                  No options available
                </li>
              ) : (
                options.map((option, index) => (
                  <li
                    id={${listId}-option-}
                    key={option.value}
                    className={cn(
                      commonStyles.option,
                      themeStyles.option,
                      focusedIndex === index && commonStyles.optionFocused,
                      focusedIndex === index && themeStyles.optionFocused,
                      selected?.value === option.value && commonStyles.optionSelected,
                      selected?.value === option.value && themeStyles.optionSelected,
                      option.disabled && commonStyles.optionDisabled,
                      option.disabled && themeStyles.optionDisabled
                    )}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => !option.disabled && setFocusedIndex(index)}
                    role="option"
                    aria-selected={selected?.value === option.value}
                    aria-disabled={option.disabled}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </FloatingPortal>

      {error && errorMessage && (
        <span id={errorId} className={cn(commonStyles.errorMessage, themeStyles.errorMessage)} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default Dropdown;
