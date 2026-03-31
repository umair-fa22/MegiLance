/* AI-HINT: This component renders a single FAQ item with an expandable answer. It manages its own open/closed state and uses CSS transitions for a smooth accordion effect. */

'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import commonStyles from './FaqItem.common.module.css';
import lightStyles from './FaqItem.light.module.css';
import darkStyles from './FaqItem.dark.module.css';

interface FaqItemProps {
  question: string;
  children: React.ReactNode;
}

export const FaqItem: React.FC<FaqItemProps> = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  if (!resolvedTheme) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const itemClasses = cn(commonStyles.item, themeStyles.item);

  const chevronClasses = cn(commonStyles.chevron, themeStyles.chevron, isOpen && commonStyles.chevronOpen);

  const answerClasses = cn(commonStyles.answer, isOpen && commonStyles.answerOpen);

  return (
    <div className={itemClasses}>
      <button className={cn(commonStyles.question, themeStyles.question)} onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <ChevronDown className={chevronClasses} />
      </button>
      <div className={answerClasses}>
        <div className={cn(commonStyles.answerContent, themeStyles.answerContent)}>
          {children}
        </div>
      </div>
    </div>
  );
};
