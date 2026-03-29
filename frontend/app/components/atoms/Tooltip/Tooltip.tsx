// @AI-HINT: This is a Tooltip component, an atomic element for showing information on hover.
'use client';

import React, { useState, useRef, cloneElement, useId } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './Tooltip.common.module.css';
import lightStyles from './Tooltip.light.module.css';
import darkStyles from './Tooltip.dark.module.css';

export interface TooltipProps {
  children: React.ReactElement;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, text, position = 'top', delay = 200, className = '' }) => {
  const { resolvedTheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  const positionMap = {
    top: commonStyles.tooltipTop,
    bottom: commonStyles.tooltipBottom,
    left: commonStyles.tooltipLeft,
    right: commonStyles.tooltipRight,
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  const triggerProps = {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
    'aria-describedby': visible ? tooltipId : undefined,
  };

  return (
    <div className={cn(commonStyles.tooltipWrapper, className)}>
      {cloneElement(children, triggerProps)}
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            commonStyles.tooltip,
            resolvedTheme === 'light' ? lightStyles.tooltip : darkStyles.tooltip,
            positionMap[position]
          )}
        >
          {text}
          <div className={commonStyles.tooltipArrow} data-popper-arrow />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
