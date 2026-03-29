// @AI-HINT: This is a versatile, enterprise-grade Textarea component. It mirrors the Input component's features, supporting labels, validation states, and full theming for a consistent user experience across all forms with enhanced functionality.

'use client';

import React, { useId, useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

import commonStyles from './Textarea.common.module.css';
import lightStyles from './Textarea.light.module.css';
import darkStyles from './Textarea.dark.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hideLabel?: boolean;
  error?: string | boolean;
  helpText?: string;
  wrapperClassName?: string;
  fullWidth?: boolean;
  floatingLabel?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  autoResize?: boolean;
  smartSuggestions?: string[];
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  hideLabel,
  error,
  helpText,
  className = '',
  wrapperClassName = '',
  fullWidth = false,
  floatingLabel = false,
  maxLength,
  showCharacterCount = false,
  autoResize = false,
  smartSuggestions = [],
  ...props
}) => {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(props.value?.toString().length || 0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Click outside to close suggestions
  useEffect(() => {
    // Don't attach event listeners until theme is resolved
    if (!resolvedTheme) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [resolvedTheme]);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  const hasError = !!error;
  const errorId = hasError ? `${id}-error` : undefined;
  const helpId = !hasError && helpText ? `${id}-help` : undefined;
  
  // Calculate character count and warning states
  const currentLength = charCount;
  const isNearLimit = maxLength && currentLength >= maxLength * 0.8;
  const isOverLimit = maxLength && currentLength > maxLength;

  // Handle text change for character counting
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCharCount(value.length);
    
    // Auto-resize functionality
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    // Smart suggestions
    if (smartSuggestions.length > 0) {
      const lastWord = value.split(/\s+/).pop()?.toLowerCase() || '';
      if (lastWord.length > 2) {
        setShowSuggestions(true);
        setSelectedSuggestion(-1);
      } else {
        setShowSuggestions(false);
      }
    }
    
    props.onChange?.(e);
  };

  // Handle key events for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && smartSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < smartSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : smartSuggestions.length - 1
        );
      } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
        e.preventDefault();
        applySuggestion(smartSuggestions[selectedSuggestion]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    }
    
    props.onKeyDown?.(e);
  };

  // Apply suggestion to textarea
  const applySuggestion = (suggestion: string) => {
    if (textareaRef.current) {
      const currentValue = textareaRef.current.value;
      const words = currentValue.split(/\s+/);
      words[words.length - 1] = suggestion;
      const newValue = words.join(' ') + ' ';
      
      // Update textarea value
      textareaRef.current.value = newValue;
      setCharCount(newValue.length);
      
      // Trigger onChange event
      const event = new Event('input', { bubbles: true });
      textareaRef.current.dispatchEvent(event);
      
      // Hide suggestions
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
      
      // Focus back to textarea
      textareaRef.current.focus();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    applySuggestion(suggestion);
  };

  // Filter suggestions based on current input
  const filteredSuggestions = smartSuggestions.filter(suggestion => {
    if (!textareaRef.current) return false;
    const lastWord = textareaRef.current.value.split(/\s+/).pop()?.toLowerCase() || '';
    return suggestion.toLowerCase().includes(lastWord);
  });

  // Determine if we should show the floating label effect
  const showFloatingLabel = floatingLabel && (isFocused || props.value || props.placeholder);

  // Validation status icon
  const renderValidationIcon = () => {
    if (hasError) {
      return <XCircle size={16} className={cn(commonStyles.inputIcon, themeStyles.inputIcon)} />;
    }
    if (props.value && (props.value as string).length > 0) {
      return <CheckCircle size={16} className={cn(commonStyles.inputIcon, themeStyles.inputIcon)} />;
    }
    return null;
  };

  return (
    <div
      ref={suggestionsRef}
      className={cn(
        commonStyles.textareaWrapper,
        themeStyles.textareaWrapper,
        hasError && commonStyles.textareaWrapperError,
        hasError && themeStyles.textareaWrapperError,
        props.disabled && commonStyles.textareaWrapperDisabled,
        props.disabled && themeStyles.textareaWrapperDisabled,
        wrapperClassName,
        fullWidth && commonStyles.textareaWrapperFullWidth,
        fullWidth && themeStyles.textareaWrapperFullWidth,
        floatingLabel && commonStyles.textareaWrapperFloating,
        isFocused && commonStyles.textareaWrapperFocused,
        showSuggestions && commonStyles.suggestionContainer
      )}
    >
      {label && !hideLabel && (
        <label 
          htmlFor={id} 
          className={cn(
            commonStyles.textareaLabel, 
            themeStyles.textareaLabel,
            showFloatingLabel && commonStyles.floatingLabel
          )}
        >
          {label}
        </label>
      )}
      <div className={commonStyles.textareaContainer}>
        <textarea
          ref={textareaRef}
          id={id}
          className={cn(
            commonStyles.textareaField,
            themeStyles.textareaField,
            autoResize && commonStyles.autoResize,
            className
          )}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={errorId ?? helpId}
          aria-errormessage={errorId}
          aria-required={props.required}
          aria-label={hideLabel && label ? label : undefined}
          maxLength={maxLength}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {renderValidationIcon() && (
          <span className={cn(
            commonStyles.inputIcon, 
            themeStyles.inputIcon, 
            commonStyles.textareaIcon,
            themeStyles.textareaIcon
          )}>
            {renderValidationIcon()}
          </span>
        )}
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          className={cn(commonStyles.suggestionsList, themeStyles.suggestionsList)}
          role="listbox"
          aria-label="Suggestions"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              role="option"
              aria-selected={index === selectedSuggestion}
              tabIndex={-1}
              className={cn(
                commonStyles.suggestionItem,
                themeStyles.suggestionItem,
                index === selectedSuggestion && commonStyles.selected
              )}
              onClick={() => handleSuggestionClick(suggestion)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
      {hasError && typeof error === 'string' && (
        <p id={errorId} className={cn(commonStyles.errorMessage, themeStyles.errorMessage)}>
          <AlertCircle size={16} />
          {error}
        </p>
      )}
      {!hasError && helpText && (
        <p id={helpId} className={cn(commonStyles.helpText, themeStyles.helpText)}>
          {helpText}
        </p>
      )}
      {showCharacterCount && maxLength && (
        <div 
          className={cn(
            commonStyles.characterCounter, 
            themeStyles.characterCounter,
            isOverLimit && commonStyles.error,
            isNearLimit && !isOverLimit && commonStyles.warning
          )}
        >
          {currentLength}/{maxLength}
        </div>
      )}
      {maxLength && (
        <div className={commonStyles.wordCountVisualization}>
          <div className={commonStyles.wordCountBar}>
            <div 
              className={cn(
                commonStyles.wordCountFill,
                isOverLimit && commonStyles.error,
                isNearLimit && !isOverLimit && commonStyles.warning
              )}
              data-progress={Math.min(100, Math.round((currentLength / maxLength) * 100))}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Textarea;
