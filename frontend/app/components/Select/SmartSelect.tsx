// @AI-HINT: Modern smart select/dropdown component with search, icons, keyboard navigation, and AI suggestions
'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
} from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Check,
  Search,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './SmartSelect.common.module.css';
import lightStyles from './SmartSelect.light.module.css';
import darkStyles from './SmartSelect.dark.module.css';

// ============================================================================
// Types
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  category?: string;
  aiRecommended?: boolean;
  metadata?: Record<string, any>;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SmartSelectProps {
  /** Options array or grouped options */
  options: SelectOption[] | SelectGroup[];
  /** Currently selected value(s) */
  value?: string | string[];
  /** Callback when selection changes */
  onChange?: (value: string | string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Helper text below the select */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Enable search/filter */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Allow clearing selection */
  clearable?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Max height of dropdown */
  maxHeight?: number;
  /** Show AI recommendations badge */
  showAIBadge?: boolean;
  /** Custom render for option */
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
  /** Custom render for selected value */
  renderValue?: (selected: SelectOption | SelectOption[]) => React.ReactNode;
  /** On search callback for async search */
  onSearch?: (query: string) => void;
  /** No options message */
  noOptionsMessage?: string;
  /** Enable create new option */
  creatable?: boolean;
  /** On create callback */
  onCreate?: (value: string) => void;
  /** Create label format */
  createLabel?: (value: string) => string;
  /** Additional className */
  className?: string;
  /** Required field */
  required?: boolean;
  /** Name attribute */
  name?: string;
  /** ID attribute */
  id?: string;
  /** Auto focus */
  autoFocus?: boolean;
  /** Portal dropdown to body */
  portal?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

function isGrouped(options: SelectOption[] | SelectGroup[]): options is SelectGroup[] {
  return options.length > 0 && 'options' in options[0];
}

function flattenOptions(options: SelectOption[] | SelectGroup[]): SelectOption[] {
  if (isGrouped(options)) {
    return options.flatMap((group) => group.options);
  }
  return options;
}

function filterOptions(
  options: SelectOption[],
  query: string
): SelectOption[] {
  if (!query.trim()) return options;
  const lowerQuery = query.toLowerCase();
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(lowerQuery) ||
      opt.description?.toLowerCase().includes(lowerQuery) ||
      opt.value.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// Component
// ============================================================================

const SmartSelect = forwardRef<HTMLDivElement, SmartSelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option...',
      label,
      helperText,
      error,
      searchable = false,
      searchPlaceholder = 'Search...',
      multiple = false,
      clearable = false,
      disabled = false,
      loading = false,
      fullWidth = false,
      size = 'md',
      maxHeight = 280,
      showAIBadge = true,
      renderOption,
      renderValue,
      onSearch,
      noOptionsMessage = 'No options found',
      creatable = false,
      onCreate,
      createLabel = (v) => `Create "${v}"`,
      className,
      required = false,
      name,
      id,
      autoFocus = false,
    },
    ref
  ) => {
    const { resolvedTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [mounted, setMounted] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

    // Flatten and filter options
    const flatOptions = useMemo(() => flattenOptions(options), [options]);
    const filteredOptions = useMemo(
      () => filterOptions(flatOptions, searchQuery),
      [flatOptions, searchQuery]
    );

    // Get selected option(s)
    const selectedOptions = useMemo(() => {
      if (!value) return [];
      const values = Array.isArray(value) ? value : [value];
      return flatOptions.filter((opt) => values.includes(opt.value));
    }, [value, flatOptions]);

    // AI recommended options first
    const sortedOptions = useMemo(() => {
      return [...filteredOptions].sort((a, b) => {
        if (a.aiRecommended && !b.aiRecommended) return -1;
        if (!a.aiRecommended && b.aiRecommended) return 1;
        return 0;
      });
    }, [filteredOptions]);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Handle outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search on open
    useEffect(() => {
      if (isOpen && searchable && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Reset highlight on search
    useEffect(() => {
      setHighlightedIndex(-1);
    }, [searchQuery]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const item = listRef.current.children[highlightedIndex] as HTMLElement;
        if (item) {
          item.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [highlightedIndex]);

    const handleSelect = useCallback(
      (option: SelectOption) => {
        if (option.disabled) return;

        if (multiple) {
          const currentValues = Array.isArray(value) ? value : value ? [value] : [];
          const newValues = currentValues.includes(option.value)
            ? currentValues.filter((v) => v !== option.value)
            : [...currentValues, option.value];
          onChange?.(newValues);
        } else {
          onChange?.(option.value);
          setIsOpen(false);
          setSearchQuery('');
        }
      },
      [multiple, value, onChange]
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.(multiple ? [] : '');
      },
      [multiple, onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;

        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (isOpen && highlightedIndex >= 0) {
              handleSelect(sortedOptions[highlightedIndex]);
            } else if (isOpen && creatable && searchQuery && filteredOptions.length === 0) {
              onCreate?.(searchQuery);
              setSearchQuery('');
              setIsOpen(false);
            } else {
              setIsOpen(true);
            }
            break;
          case 'Escape':
            setIsOpen(false);
            setSearchQuery('');
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (!isOpen) {
              setIsOpen(true);
            } else {
              setHighlightedIndex((prev) =>
                prev < sortedOptions.length - 1 ? prev + 1 : 0
              );
            }
            break;
          case 'ArrowUp':
            e.preventDefault();
            if (isOpen) {
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : sortedOptions.length - 1
              );
            }
            break;
          case 'Home':
            if (isOpen) {
              e.preventDefault();
              setHighlightedIndex(0);
            }
            break;
          case 'End':
            if (isOpen) {
              e.preventDefault();
              setHighlightedIndex(sortedOptions.length - 1);
            }
            break;
        }
      },
      [disabled, isOpen, highlightedIndex, sortedOptions, handleSelect, creatable, searchQuery, filteredOptions, onCreate]
    );

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch?.(query);
      },
      [onSearch]
    );
  
    // Render selected value(s)
    const renderSelectedValue = () => {
      if (selectedOptions.length === 0) {
        return <span className={cn(commonStyles.placeholder, themeStyles.placeholder)}>{placeholder}</span>;
      }

      if (renderValue) {
        return renderValue(multiple ? selectedOptions : selectedOptions[0]);
      }

      if (multiple) {
        return (
          <div className={commonStyles.selectedTags}>
            {selectedOptions.slice(0, 3).map((opt) => (
              <span key={opt.value} className={cn(commonStyles.tag, themeStyles.tag)}>
                {opt.icon && <span className={commonStyles.tagIcon}>{opt.icon}</span>}
                {opt.label}
              </span>
            ))}
            {selectedOptions.length > 3 && (
              <span className={cn(commonStyles.tagMore, themeStyles.tagMore)}>
                +{selectedOptions.length - 3} more
              </span>
            )}
          </div>
        );
      }

      const selected = selectedOptions[0];
      return (
        <span className={commonStyles.selectedValue}>
          {selected.icon && <span className={commonStyles.selectedIcon}>{selected.icon}</span>}
          {selected.label}
        </span>
      );
    };

    // Render individual option
    const renderOptionItem = (option: SelectOption, index: number) => {
      const isSelected = selectedOptions.some((o) => o.value === option.value);
      const isHighlighted = highlightedIndex === index;

      if (renderOption) {
        return (
          <div
            key={option.value}
            className={cn(
              commonStyles.option,
              themeStyles.option,
              isSelected && commonStyles.optionSelected,
              isSelected && themeStyles.optionSelected,
              isHighlighted && commonStyles.optionHighlighted,
              isHighlighted && themeStyles.optionHighlighted,
              option.disabled && commonStyles.optionDisabled
            )}
            onClick={() => handleSelect(option)}
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            {renderOption(option, isSelected)}
          </div>
        );
      }

      return (
        <div
          key={option.value}
          className={cn(
            commonStyles.option,
            themeStyles.option,
            isSelected && commonStyles.optionSelected,
            isSelected && themeStyles.optionSelected,
            isHighlighted && commonStyles.optionHighlighted,
            isHighlighted && themeStyles.optionHighlighted,
            option.disabled && commonStyles.optionDisabled
          )}
          onClick={() => handleSelect(option)}
          onMouseEnter={() => setHighlightedIndex(index)}
          role="option"
          aria-selected={isSelected}
          aria-disabled={option.disabled}
        >
          <div className={commonStyles.optionContent}>
            {option.icon && (
              <span className={cn(commonStyles.optionIcon, themeStyles.optionIcon)}>
                {option.icon}
              </span>
            )}
            <div className={commonStyles.optionText}>
              <span className={cn(commonStyles.optionLabel, themeStyles.optionLabel)}>
                {option.label}
                {option.aiRecommended && showAIBadge && (
                  <span className={cn(commonStyles.aiBadge, themeStyles.aiBadge)}>
                    <Sparkles size={12} />
                    AI Pick
                  </span>
                )}
              </span>
              {option.description && (
                <span className={cn(commonStyles.optionDescription, themeStyles.optionDescription)}>
                  {option.description}
                </span>
              )}
            </div>
          </div>
          {isSelected && (
            <Check
              size={16}
              className={cn(commonStyles.checkIcon, themeStyles.checkIcon)}
            />
          )}
        </div>
      );
    };

    if (!mounted) {
      return (
        <div className={cn(commonStyles.container, fullWidth && commonStyles.fullWidth, className)}>
          {label && <label className={cn(commonStyles.label, lightStyles.label)}>{label}</label>}
          <div className={cn(commonStyles.trigger, lightStyles.trigger, commonStyles[`size${size.toUpperCase()}`])}>
            <span className={cn(commonStyles.placeholder, lightStyles.placeholder)}>{placeholder}</span>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          commonStyles.container,
          fullWidth && commonStyles.fullWidth,
          disabled && commonStyles.disabled,
          error && commonStyles.hasError,
          className
        )}
      >
        {label && (
          <label
            htmlFor={id}
            className={cn(commonStyles.label, themeStyles.label)}
          >
            {label}
            {required && <span className={commonStyles.required}>*</span>}
          </label>
        )}

        <div
          ref={ref}
          id={id}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            commonStyles.trigger,
            themeStyles.trigger,
            commonStyles[`size${size.toUpperCase()}`],
            isOpen && commonStyles.triggerOpen,
            isOpen && themeStyles.triggerOpen,
            error && commonStyles.triggerError,
            error && themeStyles.triggerError
          )}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
        >
          <div className={commonStyles.valueContainer}>
            {renderSelectedValue()}
          </div>

          <div className={commonStyles.indicators}>
            {loading && (
              <Loader2 size={16} className={cn(commonStyles.loader, themeStyles.loader)} />
            )}
            {clearable && selectedOptions.length > 0 && !loading && (
              <button
                type="button"
                className={cn(commonStyles.clearButton, themeStyles.clearButton)}
                onClick={handleClear}
                aria-label="Clear selection"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={18}
              className={cn(
                commonStyles.chevron,
                themeStyles.chevron,
                isOpen && commonStyles.chevronOpen
              )}
            />
          </div>

          {/* Hidden input for form submission */}
          <input
            type="hidden"
            name={name}
            value={Array.isArray(value) ? value.join(',') : value || ''}
          />
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={cn(commonStyles.dropdown, themeStyles.dropdown)}
              style={{ maxHeight }}
            >
              {searchable && (
                <div className={cn(commonStyles.searchContainer, themeStyles.searchContainer)}>
                  <Search size={16} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
                  <input
                    ref={inputRef}
                    type="text"
                    className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus={autoFocus}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className={cn(commonStyles.searchClear, themeStyles.searchClear)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery('');
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              <div
                ref={listRef}
                className={commonStyles.optionsList}
                role="listbox"
                aria-multiselectable={multiple}
                style={{ maxHeight: searchable ? maxHeight - 52 : maxHeight }}
              >
                {sortedOptions.length === 0 ? (
                  <div className={cn(commonStyles.noOptions, themeStyles.noOptions)}>
                    {creatable && searchQuery ? (
                      <button
                        type="button"
                        className={cn(commonStyles.createOption, themeStyles.createOption)}
                        onClick={() => {
                          onCreate?.(searchQuery);
                          setSearchQuery('');
                          setIsOpen(false);
                        }}
                      >
                        <Sparkles size={14} />
                        {createLabel(searchQuery)}
                      </button>
                    ) : (
                      noOptionsMessage
                    )}
                  </div>
                ) : (
                  <>
                    {isGrouped(options) ? (
                      options.map((group) => {
                        const groupOptions = filterOptions(group.options, searchQuery);
                        if (groupOptions.length === 0) return null;
                        return (
                          <div key={group.label} className={commonStyles.group}>
                            <div className={cn(commonStyles.groupLabel, themeStyles.groupLabel)}>
                              {group.label}
                            </div>
                            {groupOptions.map((opt) =>
                              renderOptionItem(
                                opt,
                                sortedOptions.findIndex((o) => o.value === opt.value)
                              )
                            )}
                          </div>
                        );
                      })
                    ) : (
                      sortedOptions.map((opt, idx) => renderOptionItem(opt, idx))
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helper/Error text */}
        {(helperText || error) && (
          <div
            className={cn(
              commonStyles.helperText,
              error ? themeStyles.errorText : themeStyles.helperText
            )}
          >
            {error && <AlertCircle size={14} />}
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

SmartSelect.displayName = 'SmartSelect';

export default SmartSelect;
