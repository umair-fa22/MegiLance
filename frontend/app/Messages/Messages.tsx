// @AI-HINT: Real-time Messages page - dual pane layout with ChatInbox and RealtimeChat
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import ChatInbox, { Conversation } from '@/app/components/organisms/Messaging/ChatInbox/ChatInbox';
import RealtimeChat from '@/app/components/organisms/Messaging/RealtimeChat';

import commonStyles from './Messages.common.module.css';
import lightStyles from './Messages.light.module.css';
import darkStyles from './Messages.dark.module.css';

const Messages: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (!user) {
    return null; // Not authenticated
  }

  return (
    <div className={commonStyles.container}>
      {/* Left Pane: Inbox */}
      <ChatInbox 
        onConversationSelect={(convo) => setActiveConversation(convo)} 
      />

      {/* Right Pane: Chat Window */}
      <div className={cn(commonStyles.chatSection, themeStyles.chatSection)}>
        {activeConversation ? (
          <RealtimeChat
            roomId={`conversation_${activeConversation.numericId}`}
            conversationId={activeConversation.numericId}
            currentUserId={user.id.toString()}
            currentUserName={user.name}
            otherUserId={activeConversation.userId}
            otherUserName={activeConversation.userName}
          />
        ) : (
          <div className={commonStyles.emptyState}>
            <MessageSquare className={commonStyles.emptyIcon} style={{ opacity: 0.2 }} />
            <p className={commonStyles.emptyTitle}>Select a conversation</p>
            <p>Choose a conversation from the list to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
