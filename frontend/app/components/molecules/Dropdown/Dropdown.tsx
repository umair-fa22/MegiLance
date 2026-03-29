// @AI-HINT: This is a Dropdown component, a molecular element for selecting an option from a list.
'use client';

import React, { useState, useRef, useEffect, useId, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
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
  /** Available options */
  options: DropdownOption[];
  /** Currently selected option */
  selected: DropdownOption | null;
  /** Callback when option is selected */
  onSelect: (option: DropdownOption) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the dropdown */
  ariaLabel?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Name attribute for form integration */
  name?: string;
  /** Required field indicator */
  required?: boolean;
}

// Type-ahead search timeout in ms
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLUListElement>(null);
  const typeAheadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listId = useId();
  const labelId = useId();
  const errorId = useId();

  // Filter out only enabled options for navigation
  const enabledOptions = useMemo(
    () => options.filter((opt) => !opt.disabled),
    [options]
  );

  const handleSelect = useCallback((option: DropdownOption) => {
    if (option.disabled) return;
    onSelect(option);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [onSelect]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    // Focus the selected option or first option
    const selectedIndex = options.findIndex((opt) => opt.value === selected?.value);
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, options, selected]);

  // Type-ahead search functionality
  const handleTypeAhead = useCallback((char: string) => {
    if (typeAheadTimeoutRef.current) {
      clearTimeout(typeAheadTimeoutRef.current);
    }

    const newQuery = typeAheadQuery + char.toLowerCase();
    setTypeAheadQuery(newQuery);

    // Find matching option
    const matchIndex = options.findIndex(
      (opt) => !opt.disabled && opt.label.toLowerCase().startsWith(newQuery)
    );

    if (matchIndex >= 0) {
      setFocusedIndex(matchIndex);
    }

    typeAheadTimeoutRef.current = setTimeout(() => {
      setTypeAheadQuery('');
    }, TYPE_AHEAD_TIMEOUT);
  }, [typeAheadQuery, options]);

  useEffect(() => {
    return () => {
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle keyboard on trigger when closed
      if (!isOpen && document.activeElement === triggerRef.current) {
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
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prevIndex) => {
            let nextIndex = prevIndex + 1;
            while (nextIndex < options.length && options[nextIndex]?.disabled) {
              nextIndex++;
            }
            return nextIndex < options.length ? nextIndex : prevIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prevIndex) => {
            let nextIndex = prevIndex - 1;
            while (nextIndex >= 0 && options[nextIndex]?.disabled) {
              nextIndex--;
            }
            return nextIndex >= 0 ? nextIndex : prevIndex;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (focusedIndex >= 0 && !options[focusedIndex]?.disabled) {
            handleSelect(options[focusedIndex]);
          }
          break;
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && !options[focusedIndex]?.disabled) {
            handleSelect(options[focusedIndex]);
          }
          break;
        case 'Tab':
          // Close on tab but allow natural focus movement
          setIsOpen(false);
          break;
        case 'Home':
          event.preventDefault();
          // Find first enabled option
          const firstEnabled = options.findIndex((opt) => !opt.disabled);
          setFocusedIndex(firstEnabled >= 0 ? firstEnabled : 0);
          break;
        case 'End':
          event.preventDefault();
          // Find last enabled option
          for (let i = options.length - 1; i >= 0; i--) {
            if (!options[i].disabled) {
              setFocusedIndex(i);
              break;
            }
          }
          break;
        default:
          // Type-ahead search for printable characters
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
  }, [isOpen, focusedIndex, options, handleSelect, openDropdown, handleTypeAhead]);

  useEffect(() => {
    if (isOpen && focusedIndex !== -1) {
      const optionElement = document.getElementById(`${listId}-option-${focusedIndex}`);
      optionElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, focusedIndex, listId]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(commonStyles.dropdown, themeStyles.dropdown, className)} ref={dropdownRef}>
      <button
        ref={triggerRef}
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
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            ref={optionsRef}
            id={listId}
            className={cn(commonStyles.options, themeStyles.options)}
            role="listbox"
            aria-labelledby={labelId}
            aria-activedescendant={focusedIndex >= 0 ? `${listId}-option-${focusedIndex}` : undefined}
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
                  id={`${listId}-option-${index}`}
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
      {error && errorMessage && (
        <span id={errorId} className={cn(commonStyles.errorMessage, themeStyles.errorMessage)} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

export default Dropdown;
