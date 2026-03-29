// @AI-HINT: Real-time chat component using WebSocket with read receipts and typing indicators
'use client';

import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SendHorizontal, Circle, Check, CheckCheck, Paperclip, Loader2 } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import Input from '@/app/components/atoms/Input/Input';

import commonStyles from './RealtimeChat.common.module.css';
import lightStyles from './RealtimeChat.light.module.css';
import darkStyles from './RealtimeChat.dark.module.css';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  timestamp: string;
  read_by?: string[];
  read_at?: string;
  metadata?: Record<string, any>;
}

interface RealtimeChatProps {
  roomId: string;
  conversationId: number;
  currentUserId: string;
  currentUserName: string;
  otherUserId?: number;
  otherUserName?: string;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  roomId,
  conversationId,
  currentUserId,
  currentUserName,
  otherUserId,
  otherUserName,
}) => {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { connected, on, off, joinRoom, leaveRoom, sendMessage, sendReadReceipt } = useWebSocket();
  const { typingUsers, isAnyoneTyping, getTypingText, sendTyping, stopTyping } = useTypingIndicator(conversationId);
  const { isOnline } = useOnlineStatus(otherUserId ? [otherUserId] : []);

  useEffect(() => {
    // Fetch message history
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const data = await (api as any).messages.getMessages?.(conversationId);
        if (data && Array.isArray(data)) {
          // data items: { id, sender_id, receiver_id, content, created_at, attachment_url, ... }
          const history = data.map((msg: any) => ({
            id: msg.id.toString(),
            sender_id: msg.sender_id.toString(),
            sender_name: msg.sender_id.toString() === currentUserId ? currentUserName : (otherUserName || 'User'),
            message: msg.content,
            timestamp: msg.created_at,
            read_at: msg.read_at,
            metadata: msg.attachments ? {
              attachment_url: msg.attachments.url,
              attachment_name: msg.attachments.name,
            } : undefined
          })).reverse(); // Usually APIs return newest first, we want oldest first for chat
          setMessages(history);
        }
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchHistory();
  }, [conversationId, currentUserId, currentUserName, otherUserName]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    header: cn(commonStyles.header, themeStyles.header),
    title: cn(commonStyles.title, themeStyles.title),
    status: cn(commonStyles.status, themeStyles.status),
    messagesContainer: cn(commonStyles.messagesContainer, themeStyles.messagesContainer),
    message: cn(commonStyles.message, themeStyles.message),
    messageOwn: cn(commonStyles.messageOwn, themeStyles.messageOwn),
    messageOther: cn(commonStyles.messageOther, themeStyles.messageOther),
    messageSender: cn(commonStyles.messageSender, themeStyles.messageSender),
    messageText: cn(commonStyles.messageText, themeStyles.messageText),
    messageTime: cn(commonStyles.messageTime, themeStyles.messageTime),
    typing: cn(commonStyles.typing, themeStyles.typing),
    inputContainer: cn(commonStyles.inputContainer, themeStyles.inputContainer),
  };

  useEffect(() => {
    if (connected) {
      joinRoom(roomId);

      const handleMessage = (data: any) => {
        const chatMsg: ChatMessage = {
          id: data.id || Date.now().toString(),
          sender_id: data.user_id || data.sender_id,
          sender_name: data.sender_name || 'User',
          message: data.message,
          timestamp: data.timestamp,
          metadata: {
            attachment_url: data.attachment_url,
            attachment_name: data.attachment_name,
          }
        };

        setMessages((prev) => [...prev, chatMsg]);
        // Send read receipt for messages from others
        if (chatMsg.sender_id !== currentUserId && chatMsg.id) {
          sendReadReceipt(parseInt(chatMsg.id), conversationId);
        }
      };

      const handleReadReceipt = (data: { message_id: string; read_by: string; read_at: string }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message_id
              ? {
                  ...msg,
                  read_by: [...(msg.read_by || []), data.read_by],
                  read_at: data.read_at,
                }
              : msg
          )
        );
      };

      on('new_message', handleMessage);
      on('read_receipt', handleReadReceipt);

      return () => {
        off('new_message', handleMessage);
        off('read_receipt', handleReadReceipt);
        leaveRoom(roomId);
      };
    }
  }, [connected, roomId, currentUserId, conversationId, joinRoom, leaveRoom, on, off, sendReadReceipt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage('');
    stopTyping(conversationId, parseInt(currentUserId));

    // Add locally immediately
    const optimisticMsg: ChatMessage = {
      id: Date.now().toString(),
      sender_id: currentUserId,
      sender_name: currentUserName,
      message: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // 1. Save to DB
      await (api as any).messages.sendMessage({
        conversation_id: conversationId,
        receiver_id: otherUserId,
        content: messageText,
      });

      // 2. Broadcast via WebSocket
      sendMessage(roomId, messageText, {
        sender_id: currentUserId,
        sender_name: currentUserName,
      });
    } catch (err) {
      console.error('Failed to send message to DB', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTyping(conversationId, parseInt(currentUserId), currentUserName);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await (api as any).uploads.upload('document', file);
      if (res && res.url) {
        const textMsg = `Sent an attachment: ${file.name}`;
        
        // Add locally
        const optimisticMsg: ChatMessage = {
          id: Date.now().toString(),
          sender_id: currentUserId,
          sender_name: currentUserName,
          message: textMsg,
          timestamp: new Date().toISOString(),
          metadata: {
            attachment_url: res.url,
            attachment_name: file.name,
          }
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
          // 1. Save to DB
          await (api as any).messages.sendMessage({
            conversation_id: conversationId,
            receiver_id: otherUserId,
            content: textMsg,
            message_type: 'attachment',
            attachments: { url: res.url, name: file.name }
          });

          // 2. Broadcast via WebSocket
          sendMessage(roomId, textMsg, {
            sender_id: currentUserId,
            sender_name: currentUserName,
            attachment_url: res.url,
            attachment_name: file.name,
          });
        } catch (err) {
          console.error('Failed to save attachment message', err);
        }
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getReadStatus = (msg: ChatMessage) => {
    if (msg.sender_id !== currentUserId) return null;
    if (msg.read_by && msg.read_by.length > 0) {
      return (
        <span title={`Read${msg.read_at ? ` at ${new Date(msg.read_at).toLocaleTimeString()}` : ''}`}>
          <CheckCheck size={14} style={{ color: '#4573df' }} />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check size={14} style={{ opacity: 0.5 }} />
      </span>
    );
  };

  const otherOnline = otherUserId ? isOnline(otherUserId) : false;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 className={styles.title}>{otherUserName || 'Chat'}</h2>
          {otherUserId && (
            <span style={{
              fontSize: 12,
              color: otherOnline ? '#22c55e' : '#9ca3af',
            }}>
              {otherOnline ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
        <div className={styles.status}>
          <Circle className={connected ? 'text-green-500' : 'text-gray-400'} size={10} fill={connected ? '#22c55e' : '#9ca3af'} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className={styles.messagesContainer}>
        {loadingHistory ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  styles.message,
                  msg.sender_id === currentUserId ? styles.messageOwn : styles.messageOther
                )}
              >
                {msg.sender_id !== currentUserId && (
                  <div className={styles.messageSender}>{msg.sender_name}</div>
                )}
                <div className={styles.messageText}>
                  {msg.message}
                  {msg.metadata?.attachment_url && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <a
                        href={msg.metadata.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'rgba(0,0,0,0.05)',
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          textDecoration: 'none',
                          color: 'inherit',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Paperclip size={16} />
                        {msg.metadata.attachment_name || 'Attachment'}
                      </a>
                    </div>
                  )}
                </div>
                <div className={styles.messageTime} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {getReadStatus(msg)}
                </div>
              </div>
            ))}
            {isAnyoneTyping && (
              <div className={styles.typing}>
                {getTypingText()}
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className={styles.inputContainer} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={!connected || isUploading}
          style={{ padding: '0.5rem' }}
          title="Attach file"
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
        </Button>
        <div style={{ flex: 1 }}>
          <Input
            name="message"
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            disabled={!connected || isUploading}
          />
        </div>
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!connected || !newMessage.trim() || isUploading}
        >
          <SendHorizontal size={18} />
        </Button>
      </div>
    </div>
  );
};

export default RealtimeChat;
