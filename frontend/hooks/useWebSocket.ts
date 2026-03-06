// @AI-HINT: WebSocket custom hook - manages Socket.IO connection and events
// Supports: messaging, typing indicators, user presence, notifications, read receipts
// Features: exponential backoff, heartbeat monitoring, event buffering, visibility reconnect
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket as SocketIOSocket } from 'socket.io-client';
import { getAuthToken } from '@/lib/api';

type Socket = SocketIOSocket;

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  /** Maximum reconnection attempts before giving up (default: 15) */
  maxReconnectAttempts?: number;
  /** Enable heartbeat monitoring (default: true) */
  enableHeartbeat?: boolean;
}

// Typed event payloads from backend
export interface WsNewMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  timestamp: string;
}

export interface WsTypingIndicator {
  conversation_id: number;
  user_id: number;
  user_name: string;
  is_typing: boolean;
}

export interface WsUserStatus {
  user_id: number;
  status: 'online' | 'offline';
}

export interface WsNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  created_at: string;
}

export interface WsReadReceipt {
  message_id: number;
  conversation_id: number;
  read_by: number;
  read_at: string;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { 
    url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000', 
    autoConnect = true,
    maxReconnectAttempts = 15,
    enableHeartbeat = true,
  } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventBufferRef = useRef<Array<{event: string; data: unknown}>>([]);

  // Flush buffered events when connection is restored
  const flushEventBuffer = useCallback(() => {
    if (socketRef.current?.connected && eventBufferRef.current.length > 0) {
      const buffer = [...eventBufferRef.current];
      eventBufferRef.current = [];
      for (const { event, data } of buffer) {
        socketRef.current.emit(event, data);
      }
    }
  }, []);

  useEffect(() => {
    if (!autoConnect) return;

    const token = getAuthToken();
    if (!token) {
      return;
    }

    // Create socket connection with exponential backoff
    const newSocket = io(url, {
      path: '/ws/socket.io',
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5, // Jitter for exponential backoff
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection handlers
    newSocket.on('connect', () => {
      setConnectionState('connected');
      setReconnectAttempt(0);
      flushEventBuffer();
    });

    newSocket.on('disconnect', (reason) => {
      setConnectionState('disconnected');
      // If server disconnected us, try to reconnect with fresh token
      if (reason === 'io server disconnect') {
        const freshToken = getAuthToken();
        if (freshToken) {
          newSocket.auth = { token: freshToken };
          newSocket.connect();
        }
      }
    });

    newSocket.on('connect_error', () => {
      setConnectionState('reconnecting');
      setReconnectAttempt(prev => prev + 1);
    });

    newSocket.io.on('reconnect_attempt', (attempt) => {
      setReconnectAttempt(attempt);
      setConnectionState('reconnecting');
      // Refresh token on reconnect attempts
      const freshToken = getAuthToken();
      if (freshToken) {
        newSocket.auth = { token: freshToken };
      }
    });

    newSocket.io.on('reconnect', () => {
      setConnectionState('connected');
      setReconnectAttempt(0);
      flushEventBuffer();
    });

    newSocket.io.on('reconnect_failed', () => {
      setConnectionState('disconnected');
    });

    // Heartbeat: detect stale connections
    if (enableHeartbeat) {
      heartbeatRef.current = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit('ping_heartbeat', { ts: Date.now() });
        }
      }, 30000); // Every 30 seconds
    }

    // Reconnect on page visibility change (e.g., tab becomes active again)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !newSocket.connected) {
        const freshToken = getAuthToken();
        if (freshToken) {
          newSocket.auth = { token: freshToken };
          newSocket.connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      newSocket.close();
      socketRef.current = null;
    };
  }, [url, autoConnect, maxReconnectAttempts, enableHeartbeat, flushEventBuffer]);

  const send = useCallback(<T = unknown>(event: string, data: T) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      // Buffer events while disconnected (up to 50)
      if (eventBufferRef.current.length < 50) {
        eventBufferRef.current.push({ event, data });
      }
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.off(event);
    }
  }, []);

  const joinRoom = useCallback((room: string) => {
    send('join_room', { room });
  }, [send]);

  const leaveRoom = useCallback((room: string) => {
    send('leave_room', { room });
  }, [send]);

  const sendMessage = useCallback((room: string, message: string, metadata?: Record<string, unknown>) => {
    send('message', {
      room,
      message,
      metadata,
    });
  }, [send]);

  const sendReadReceipt = useCallback((messageId: number, conversationId: number) => {
    send('read_receipt', { message_id: messageId, conversation_id: conversationId });
  }, [send]);

  const disconnect = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
    socketRef.current?.close();
    setConnectionState('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    setConnectionState('connecting');
    const freshToken = getAuthToken();
    if (socketRef.current && freshToken) {
      socketRef.current.auth = { token: freshToken };
      socketRef.current.connect();
    }
  }, []);

  const connected = connectionState === 'connected';

  return {
    socket,
    connected,
    connectionState,
    reconnectAttempt,
    send,
    on,
    off,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendReadReceipt,
    disconnect,
    reconnect,
    /** Number of events buffered while disconnected */
    bufferedEventCount: eventBufferRef.current.length,
  };
};
