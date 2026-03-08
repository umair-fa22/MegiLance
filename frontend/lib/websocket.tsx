// @AI-HINT: Real-time WebSocket infrastructure for notifications, chat, and live updates
'use client';

import { useEffect, useRef, useState, useCallback, createContext, useContext, ReactNode } from 'react';

// ============================================================================
// WebSocket Message Types
// ============================================================================

export interface WSMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  id: string;
}

export interface WSNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface WSChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
  createdAt: string;
  readBy: string[];
}

export interface WSProjectUpdate {
  projectId: string;
  type: 'status_change' | 'new_proposal' | 'milestone_complete' | 'payment_received';
  data: Record<string, unknown>;
}

export interface WSTypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface WSPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

// ============================================================================
// WebSocket Connection State
// ============================================================================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface WSConnectionConfig {
  url: string;
  token?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

// ============================================================================
// WebSocket Manager Class
// ============================================================================

class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WSConnectionConfig = {
    url: '',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
    debug: false,
  };
  
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageQueue: WSMessage[] = [];
  
  private listeners: Map<string, Set<(payload: unknown) => void>> = new Map();
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private connectionState: ConnectionState = 'disconnected';

  connect(config: WSConnectionConfig): void {
    this.config = { ...this.config, ...config };
    this.attemptConnection();
  }

  private attemptConnection(): void {
    if (typeof window === 'undefined') return;
    
    this.updateState('connecting');
    
    try {
      const url = new URL(this.config.url);
      if (this.config.token) {
        url.searchParams.set('token', this.config.token);
      }
      
      this.ws = new WebSocket(url.toString());
      this.setupEventHandlers();
    } catch (error) {
      this.log('error', 'Failed to create WebSocket:', error);
      this.updateState('error');
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('info', 'WebSocket connected');
      this.updateState('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onclose = (event) => {
      this.log('info', 'WebSocket closed:', event.code, event.reason);
      this.updateState('disconnected');
      this.stopHeartbeat();
      
      if (this.config.autoReconnect && event.code !== 1000) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.log('error', 'WebSocket error:', error);
      this.updateState('error');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.log('debug', 'Received message:', message.type);
        this.handleMessage(message);
      } catch (error) {
        this.log('error', 'Failed to parse message:', error);
      }
    };
  }

  private handleMessage(message: WSMessage): void {
    // Handle heartbeat pong
    if (message.type === 'pong') {
      return;
    }

    // Notify listeners for this message type
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(message.payload);
        } catch (error) {
          this.log('error', 'Listener error:', error);
        }
      });
    }

    // Also notify wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((listener) => {
        try {
          listener(message);
        } catch (error) {
          this.log('error', 'Wildcard listener error:', error);
        }
      });
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {});
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      this.log('error', 'Max reconnect attempts reached');
      this.updateState('error');
      return;
    }

    this.reconnectAttempts++;
    this.updateState('reconnecting');
    
    const delay = this.config.reconnectInterval! * Math.pow(1.5, this.reconnectAttempts - 1);
    this.log('info', `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.attemptConnection();
    }, delay);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendRaw(message);
      }
    }
  }

  private sendRaw(message: WSMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.log('error', 'Failed to send message:', error);
      return false;
    }
  }

  private updateState(state: ConnectionState): void {
    this.connectionState = state;
    this.stateListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        this.log('error', 'State listener error:', error);
      }
    });
  }

  private log(level: 'debug' | 'info' | 'error', ...args: unknown[]): void {
    if (!this.config.debug && level === 'debug') return;
    
    const prefix = '[WebSocket]';
    switch (level) {
      case 'error':
        console.error(prefix, ...args);
        break;
      case 'info':
        console.info(prefix, ...args);
        break;
      default:
        console.log(prefix, ...args);
    }
  }

  // Public API

  send<T>(type: string, payload: T): boolean {
    const message: WSMessage<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: this.generateId(),
    };

    if (this.connectionState === 'connected') {
      return this.sendRaw(message);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message as WSMessage);
      return false;
    }
  }

  on<T>(type: string, callback: (payload: T) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    const listeners = this.listeners.get(type)!;
    listeners.add(callback as (payload: unknown) => void);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback as (payload: unknown) => void);
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  getState(): ConnectionState {
    return this.connectionState;
  }

  disconnect(): void {
    this.config.autoReconnect = false;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateState('disconnected');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const wsManager = new WebSocketManager();

// ============================================================================
// React Context
// ============================================================================

interface WebSocketContextValue {
  state: ConnectionState;
  send: <T>(type: string, payload: T) => boolean;
  on: <T>(type: string, callback: (payload: T) => void) => () => void;
  connect: (token?: string) => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
  autoConnect?: boolean;
}

export function WebSocketProvider({
  children,
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
  autoConnect = false,
}: WebSocketProviderProps) {
  const [state, setState] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    const unsubscribe = wsManager.onStateChange(setState);
    return unsubscribe;
  }, []);

  const connect = useCallback((token?: string) => {
    wsManager.connect({
      url,
      token,
      debug: process.env.NODE_ENV === 'development',
    });
  }, [url]);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
  }, []);

  const send = useCallback(<T,>(type: string, payload: T) => {
    return wsManager.send(type, payload);
  }, []);

  const on = useCallback(<T,>(type: string, callback: (payload: T) => void) => {
    return wsManager.on(type, callback);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  const value: WebSocketContextValue = {
    state,
    send,
    on,
    connect,
    disconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ============================================================================
// React Hooks
// ============================================================================

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

/**
 * Hook to subscribe to a specific message type
 */
export function useWSSubscription<T>(
  type: string,
  callback: (payload: T) => void,
  deps: React.DependencyList = []
): void {
  const { on } = useWebSocket();

  useEffect(() => {
    const unsubscribe = on<T>(type, callback);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, on, ...deps]);
}

/**
 * Hook for real-time notifications via WebSocket.
 * Prefer useNotifications from '@/hooks/useNotifications' for full API-backed operations.
 * This hook supplements WebSocket-pushed notifications with API persistence.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<WSNotification[]>([]);
  const { on, state } = useWebSocket();

  useEffect(() => {
    if (state !== 'connected') return;

    const unsubscribe = on<WSNotification>('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    });

    return unsubscribe;
  }, [on, state]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      const { notificationsApi } = await import('@/lib/api');
      await notificationsApi.markAsRead(id);
    } catch { /* best-effort persistence */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const { notificationsApi } = await import('@/lib/api');
      await notificationsApi.markAllAsRead();
    } catch { /* best-effort persistence */ }
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  };
}

/**
 * Hook for real-time chat messages
 */
export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<WSChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const { on, send, state } = useWebSocket();
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (state !== 'connected') return;

    const unsubMessage = on<WSChatMessage>('chat_message', (message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    const unsubTyping = on<WSTypingIndicator>('typing', (indicator) => {
      if (indicator.conversationId !== conversationId) return;

      if (indicator.isTyping) {
        setTypingUsers((prev) => new Map(prev).set(indicator.userId, indicator.userName));
        
        // Clear existing timeout
        const existingTimeout = typingTimeouts.current.get(indicator.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set new timeout to remove typing indicator
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(indicator.userId);
            return next;
          });
        }, 3000);

        typingTimeouts.current.set(indicator.userId, timeout);
      } else {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(indicator.userId);
          return next;
        });
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, [conversationId, on, state]);

  const sendMessage = useCallback(
    (content: string, attachments?: WSChatMessage['attachments']) => {
      send('chat_message', {
        conversationId,
        content,
        attachments,
      });
    },
    [conversationId, send]
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      send('typing', {
        conversationId,
        isTyping,
      });
    },
    [conversationId, send]
  );

  return {
    messages,
    typingUsers: Array.from(typingUsers.values()),
    sendMessage,
    sendTypingIndicator,
  };
}

/**
 * Hook for user presence/online status
 */
export function usePresence() {
  const [presenceMap, setPresenceMap] = useState<Map<string, WSPresence>>(new Map());
  const { on, send, state } = useWebSocket();

  useEffect(() => {
    if (state !== 'connected') return;

    // Update own presence
    send('presence', { status: 'online' });

    const unsubscribe = on<WSPresence>('presence', (presence) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        if (presence.status === 'offline') {
          next.delete(presence.userId);
        } else {
          next.set(presence.userId, presence);
        }
        return next;
      });
    });

    // Set away on visibility change
    const handleVisibilityChange = () => {
      send('presence', {
        status: document.hidden ? 'away' : 'online',
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      send('presence', { status: 'offline' });
    };
  }, [on, send, state]);

  const getPresence = useCallback(
    (userId: string): WSPresence['status'] => {
      return presenceMap.get(userId)?.status || 'offline';
    },
    [presenceMap]
  );

  const isOnline = useCallback(
    (userId: string): boolean => {
      return getPresence(userId) === 'online';
    },
    [getPresence]
  );

  return {
    presenceMap,
    getPresence,
    isOnline,
  };
}

export default wsManager;
