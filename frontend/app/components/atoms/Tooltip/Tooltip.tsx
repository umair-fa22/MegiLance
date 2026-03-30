// @AI-HINT: This is a Tooltip component, an atomic element for showing information on hover.
'use client';

import React, { useState, useRef, cloneElement, useId } from 'react';
import { useTheme } from 'next-themes';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, useHover, useFocus, useDismiss, useInteractions } from '@floating-ui/react';
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

  const { refs, floatingStyles, context } = useFloating({
    open: visible,
    onOpenChange: setVisible,
    placement: position,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate
  });
  
  const hover = useHover(context, { delay });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss]);

  const positionMap = {
    top: commonStyles.tooltipTop,
    bottom: commonStyles.tooltipBottom,
    left: commonStyles.tooltipLeft,
    right: commonStyles.tooltipRight,
  };

  const triggerProps = getReferenceProps({
    ref: refs.setReference,
    'aria-describedby': visible ? tooltipId : undefined,
  });

  return (
    <>
      {cloneElement(children, triggerProps)}
      {visible && (
        <FloatingPortal>
        <div
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 10000 }}
          {...getFloatingProps()}
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
        </FloatingPortal>
      )}
    </>
  );
};

export default Tooltip;
