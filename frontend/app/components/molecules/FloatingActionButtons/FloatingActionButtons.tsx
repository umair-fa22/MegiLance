// @AI-HINT: This component is a container for globally positioned floating action buttons, like the theme toggle and chat bot, ensuring they are stacked neatly and don't overlap.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './FloatingActionButtons.common.module.css';
import lightStyles from './FloatingActionButtons.light.module.css';
import darkStyles from './FloatingActionButtons.dark.module.css';

type Props = {
  children: React.ReactNode;
  position?: 'left' | 'right';
  className?: string;
};

const FloatingActionButtons: React.FC<Props> = ({ children, position = 'right', className }) => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  
  const sideClass = position === 'left' ? commonStyles.left : commonStyles.right;
  
  return (
    <div className={cn(commonStyles.container, themeStyles.container, sideClass, className)}>
      {children}
    </div>
  );
};

export default FloatingActionButtons;
