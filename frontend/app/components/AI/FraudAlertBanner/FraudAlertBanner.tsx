// @AI-HINT: Premium security alert component with severity levels, expandable details, and actionable steps
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, X, Lock } from 'lucide-react'
import commonStyles from './FraudAlertBanner.common.module.css';
import lightStyles from './FraudAlertBanner.light.module.css';
import darkStyles from './FraudAlertBanner.dark.module.css';

export type AlertSeverity = 'high' | 'medium' | 'low';

interface FraudAlertBannerProps {
  message: string;
  severity?: AlertSeverity;
  details?: string[];
  onDismiss?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const FraudAlertBanner: React.FC<FraudAlertBannerProps> = ({ 
  message, 
  severity = 'medium',
  details = [],
  onDismiss,
  onAction,
  actionLabel = 'Review Security'
}) => {
  const { resolvedTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const getSeverityStyles = () => {
    switch (severity) {
      case 'high': return themeStyles.containerHigh;
      case 'medium': return themeStyles.containerMedium;
      case 'low': return themeStyles.containerLow;
      default: return themeStyles.containerMedium;
    }
  };

  const getIcon = () => {
    switch (severity) {
      case 'high': return <ShieldAlert size={16} />;
      case 'medium': return <AlertTriangle size={16} />;
      case 'low': return <Info size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container, getSeverityStyles())}>
      <div className={commonStyles.header}>
        <div className={cn(commonStyles.iconWrapper, themeStyles.iconWrapper)}>
          {getIcon()}
          <div className={commonStyles.iconPulse} />
        </div>
        
        <div className={commonStyles.content}>
          <div className={cn(commonStyles.title, themeStyles.title)}>
            Security Alert
            <span className={cn(commonStyles.severityBadge, themeStyles.severityBadge)}>
              {severity} Priority
            </span>
          </div>
          
          <p className={cn(commonStyles.message, themeStyles.message)}>
            {message}
          </p>

          {details.length > 0 && (
            <>
              <button 
                className={cn(commonStyles.detailsButton, themeStyles.detailsButton)}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Hide Details' : 'Why is this flagged?'}
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {isExpanded && (
                <div className={cn(commonStyles.detailsPanel, themeStyles.detailsPanel)}>
                  <strong>Analysis Details:</strong>
                  <ul className={commonStyles.detailsList}>
                    {details.map((detail, index) => (
                      <li key={index} className={cn(commonStyles.detailItem, themeStyles.detailItem)}>
                        <Lock size={12} className={commonStyles.detailIcon} />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {onAction && (
            <div className={commonStyles.actions}>
              <button 
                className={cn(commonStyles.actionButton, themeStyles.actionButton)}
                onClick={onAction}
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>

        {onDismiss && (
          <button 
            className={cn(commonStyles.dismissButton, themeStyles.dismissButton)}
            onClick={onDismiss}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FraudAlertBanner;
