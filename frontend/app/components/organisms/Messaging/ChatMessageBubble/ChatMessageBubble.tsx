// @AI-HINT: This component renders a single, theme-aware chat message bubble. It uses global CSS variables for all colors, ensuring the sender and receiver bubbles are styled consistently with the application's theme.
'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import commonStyles from './ChatMessageBubble.common.module.css';
import lightStyles from './ChatMessageBubble.light.module.css';
import darkStyles from './ChatMessageBubble.dark.module.css';

interface ChatMessageBubbleProps {
  text: string;
  timestamp: string;
  isSender: boolean;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ text, timestamp, isSender }) => {
  const { resolvedTheme } = useTheme();

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <div className={cn(
      commonStyles.container,
      isSender ? commonStyles.senderContainer : commonStyles.receiverContainer
    )}>
      <div className={cn(
        commonStyles.bubble,
        isSender ? themeStyles.sender : themeStyles.receiver
      )}>
        <p className={cn(commonStyles.text, isSender ? themeStyles.senderText : themeStyles.receiverText)}>{text}</p>
        <span className={cn(
          commonStyles.timestamp,
          isSender ? themeStyles.senderTimestamp : themeStyles.receiverTimestamp
        )}>{timestamp}</span>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
