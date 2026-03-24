// @AI-HINT: This component displays a theme-aware list of conversations fetched from /messages/conversations API.
// Includes online status indicators and typing indicators via WebSocket.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Badge from '@/app/components/Badge/Badge';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import commonStyles from './ChatInbox.common.module.css';
import lightStyles from './ChatInbox.light.module.css';
import darkStyles from './ChatInbox.dark.module.css';

interface Conversation {
  id: string;
  numericId: number;
  userName: string;
  userId: number;
  avatarUrl: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

interface ApiConversation {
  id: number;
  client_id: number;
  freelancer_id: number;
  project_id: number | null;
  status: string;
  is_archived: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  other_user_id?: number;
  other_user_name?: string;
  other_user_avatar?: string;
  last_message_content?: string;
  unread_count?: number;
}

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

interface ChatInboxProps {
  onConversationSelect?: (conversationId: string) => void;
}

const ChatInbox: React.FC<ChatInboxProps> = ({ onConversationSelect }) => {
  const { resolvedTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  // Extract user IDs for online status tracking
  const userIds = useMemo(() => conversations.map(c => c.userId).filter(Boolean), [conversations]);
  const { isOnline } = useOnlineStatus(userIds);
  const { typingUsers } = useTypingIndicator();

  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true);
        
        const data: ApiConversation[] = await (api.messages as any).getConversations?.() || [];
        
        const transformed: Conversation[] = data.map((conv) => ({
          id: `convo_${conv.id}`,
          numericId: conv.id,
          userName: conv.other_user_name || `User ${conv.client_id || conv.freelancer_id}`,
          userId: conv.other_user_id || conv.client_id || conv.freelancer_id,
          avatarUrl: conv.other_user_avatar || '/avatars/default.png',
          lastMessage: conv.last_message_content || 'No messages yet',
          timestamp: formatTimestamp(conv.last_message_at || conv.created_at),
          unreadCount: conv.unread_count || 0,
        }));

        setConversations(transformed);
        if (transformed.length > 0 && !activeConversation) {
          setActiveConversation(transformed[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, []);

  // Get typing status for a specific conversation
  const getTypingForConversation = (conversationId: number) => {
    return typingUsers.filter(t => t.conversationId === conversationId);
  };

  const handleSelect = (convo: Conversation) => {
    setActiveConversation(convo.id);
    onConversationSelect?.(convo.id);
  };

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.header, themeStyles.header)}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>Inbox</h2>
        </div>
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          <div className={commonStyles.spinner} />
          <span>Loading conversations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.header, themeStyles.header)}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>Inbox</h2>
        </div>
        <div className={cn(commonStyles.errorState, themeStyles.errorState)}>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={cn(commonStyles.header, themeStyles.header)}>
        <h2 className={cn(commonStyles.title, themeStyles.title)}>Inbox</h2>
      </div>
      <div className={cn(commonStyles.list, themeStyles.list)}>
        {conversations.length === 0 ? (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            <span>No conversations yet</span>
          </div>
        ) : conversations.map(convo => {
          const typing = getTypingForConversation(convo.numericId);
          const online = isOnline(convo.userId);
          return (
            <div 
              key={convo.id} 
              className={cn(
                commonStyles.item, 
                themeStyles.item, 
                activeConversation === convo.id && commonStyles.active,
                activeConversation === convo.id && themeStyles.active
              )}
              onClick={() => handleSelect(convo)}
              role="button"
              tabIndex={0}
              aria-current={activeConversation === convo.id ? 'true' : undefined}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <UserAvatar src={convo.avatarUrl} name={convo.userName} size="medium" />
                {/* Online status indicator */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: '2px solid var(--bg-primary, #fff)',
                    backgroundColor: online ? '#22c55e' : '#9ca3af',
                  }}
                  title={online ? 'Online' : 'Offline'}
                  aria-label={online ? 'Online' : 'Offline'}
                />
              </div>
              <div className={cn(commonStyles.itemDetails, themeStyles.itemDetails)}>
                <div className={cn(commonStyles.itemRow, themeStyles.itemRow)}>
                  <span className={cn(commonStyles.userName, themeStyles.userName)}>{convo.userName}</span>
                  <span className={cn(commonStyles.timestamp, themeStyles.timestamp)}>{convo.timestamp}</span>
                </div>
                <div className={cn(commonStyles.itemRow, themeStyles.itemRow)}>
                  {typing.length > 0 ? (
                    <p className={cn(commonStyles.lastMessage, themeStyles.lastMessage)} style={{ color: '#4573df', fontStyle: 'italic' }}>
                      {typing[0].userName} is typing...
                    </p>
                  ) : (
                    <p className={cn(commonStyles.lastMessage, themeStyles.lastMessage)}>{convo.lastMessage}</p>
                  )}
                  {convo.unreadCount > 0 && (
                    <Badge variant="primary">{convo.unreadCount}</Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatInbox;
