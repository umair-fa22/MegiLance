// @AI-HINT: This is a versatile, enterprise-grade Input component. It supports labels, icons, validation states (error), and is fully themed. All styles are per-component only.

'use client';

import React, { useId, useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import commonStyles from './Input.common.module.css';
import lightStyles from './Input.light.module.css';
import darkStyles from './Input.dark.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hideLabel?: boolean;
  iconBefore?: React.ReactNode;
  iconAfter?: React.ReactNode;
  error?: string | boolean;
  helpText?: string;
  wrapperClassName?: string;
  fullWidth?: boolean;
  floatingLabel?: boolean;
  showPasswordToggle?: boolean;
  passwordStrength?: 'weak' | 'medium' | 'strong';
  characterLimit?: number;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  hideLabel,
  iconBefore,
  iconAfter,
  error,
  helpText,
  className = '',
  wrapperClassName = '',
  fullWidth = false,
  floatingLabel = false,
  showPasswordToggle = false,
  passwordStrength,
  characterLimit,
  addonBefore,
  addonAfter,
  type = 'text',
  ...props
}) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null; // Don't render until theme is resolved and mounted
  }
  
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  const hasError = !!error;
  const errorId = hasError ? `${inputId}-error` : undefined;
  const helpId = !hasError && helpText ? `${inputId}-help` : undefined;
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  // Character counter
  const currentValueLength = (props.value as string)?.length || 0;
  const showCharacterCounter = characterLimit && currentValueLength > 0;
  const characterCounterClass = cn(
    commonStyles.characterCounter,
    currentValueLength > characterLimit! * 0.9 ? commonStyles.error : 
    currentValueLength > characterLimit! * 0.7 ? commonStyles.warning : ''
  );

  // Handle password toggle
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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

  // Handle input group rendering
  const renderInputGroup = () => {
    if (addonBefore || addonAfter) {
      return (
        <div className={cn(commonStyles.inputGroup, themeStyles.inputGroup)}>
          {addonBefore && (
            <span className={cn(commonStyles.inputGroupAddon, themeStyles.inputGroupAddon)}>
              {addonBefore}
            </span>
          )}
          <input
            ref={inputRef}
            id={inputId}
            type={inputType}
            className={cn(
              commonStyles.inputField,
              themeStyles.inputField,
              iconBefore && commonStyles.inputFieldWithIconBefore,
              iconBefore && themeStyles.inputFieldWithIconBefore,
              iconAfter && commonStyles.inputFieldWithIconAfter,
              iconAfter && themeStyles.inputFieldWithIconAfter,
              className
            )}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={errorId ?? helpId}
            aria-errormessage={errorId}
            aria-required={props.required ? 'true' : undefined}
            autoComplete={type === 'password' ? (props.autoComplete || 'current-password') : props.autoComplete}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {addonAfter && (
            <span className={cn(commonStyles.inputGroupAddon, themeStyles.inputGroupAddon)}>
              {addonAfter}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={cn(commonStyles.inputContainer, themeStyles.inputContainer)}>
        {iconBefore && (
          <span className={cn(
            commonStyles.inputIcon, 
            themeStyles.inputIcon, 
            commonStyles.inputIconBefore, 
            themeStyles.inputIconBefore
          )}>
            {iconBefore}
          </span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type={inputType}
          className={cn(
            commonStyles.inputField,
            themeStyles.inputField,
            iconBefore && commonStyles.inputFieldWithIconBefore,
            iconBefore && themeStyles.inputFieldWithIconBefore,
            iconAfter && commonStyles.inputFieldWithIconAfter,
            iconAfter && themeStyles.inputFieldWithIconAfter,
            className
          )}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={errorId ?? helpId}
          aria-errormessage={errorId}
          aria-required={props.required ? 'true' : undefined}
          autoComplete={type === 'password' ? (props.autoComplete || 'current-password') : props.autoComplete}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className={cn(
              commonStyles.inputIcon,
              themeStyles.inputIcon,
              commonStyles.inputIconAfter,
              themeStyles.inputIconAfter
            )}
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        {iconAfter && !(showPasswordToggle && type === 'password') && (
          <span className={cn(
            commonStyles.inputIcon, 
            themeStyles.inputIcon, 
            commonStyles.inputIconAfter, 
            themeStyles.inputIconAfter
          )}>
            {iconAfter}
          </span>
        )}
        {!iconAfter && !showPasswordToggle && renderValidationIcon() && (
          <span className={cn(
            commonStyles.inputIcon, 
            themeStyles.inputIcon, 
            commonStyles.inputIconAfter, 
            themeStyles.inputIconAfter
          )}>
            {renderValidationIcon()}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        commonStyles.inputWrapper,
        themeStyles.inputWrapper,
        hasError && commonStyles.inputWrapperError,
        hasError && themeStyles.inputWrapperError,
        props.disabled && commonStyles.inputWrapperDisabled,
        props.disabled && themeStyles.inputWrapperDisabled,
        wrapperClassName,
        fullWidth && commonStyles.inputWrapperFullWidth,
        fullWidth && themeStyles.inputWrapperFullWidth,
        floatingLabel && commonStyles.inputWrapperFloating,
        isFocused && commonStyles.inputWrapperFocused
      )}
    >
      {label && !hideLabel && (
        <motion.label 
          htmlFor={inputId} 
          className={cn(
            commonStyles.inputLabel, 
            themeStyles.inputLabel,
            // Remove CSS-based floating class if we are animating with Framer Motion
            // showFloatingLabel && commonStyles.floatingLabel 
          )}
          initial={false}
          animate={floatingLabel ? (showFloatingLabel ? { y: -28, scale: 0.85, x: -2 } : { y: 0, scale: 1, x: 0 }) : {}}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {label}
        </motion.label>
      )}
      {renderInputGroup()}
      <AnimatePresence>
        {hasError && typeof error === 'string' && (
          <motion.p 
            id={errorId} 
            className={cn(commonStyles.errorMessage, themeStyles.errorMessage)}
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
          >
            <AlertCircle size={16} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {!hasError && helpText && (
        <p id={helpId} className={cn(commonStyles.helpText, themeStyles.helpText)}>
          {helpText}
        </p>
      )}
      {showCharacterCounter && (
        <p className={characterCounterClass}>
          {currentValueLength}/{characterLimit}
        </p>
      )}
      {passwordStrength && (
        <div className={cn(commonStyles.passwordStrength, themeStyles.passwordStrength, commonStyles[passwordStrength])}></div>
      )}
    </div>
  );
};

export default Input;
