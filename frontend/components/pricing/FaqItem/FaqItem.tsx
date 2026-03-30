/* AI-HINT: This component renders a single FAQ item with an expandable answer. It manages its own open/closed state and uses CSS transitions for a smooth accordion effect. */

'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import commonStyles from './FaqItem.common.module.css';
import lightStyles from './FaqItem.light.module.css';
import darkStyles from './FaqItem.dark.module.css';

interface FaqItemProps {
  question: string;
  children: React.ReactNode;
}

export const FaqItem: React.FC<FaqItemProps> = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const itemClasses = [
    commonStyles.item,
    lightcommonStyles.theme,
    darkcommonStyles.theme,
  ].join(' ');

  const chevronClasses = [
    commonStyles.chevron,
    isOpen ? commonStyles.chevronOpen : ''
  ].join(' ');

  const answerClasses = [
    commonStyles.answer,
    isOpen ? commonStyles.answerOpen : ''
  ].join(' ');

  return (
    <div className={itemClasses}>
      <button className={commonStyles.question} onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <ChevronDown className={chevronClasses} />
      </button>
      <div className={answerClasses}>
        <div className={commonStyles.answerContent}>
          {children}
        </div>
      </div>
    </div>
  );
};
