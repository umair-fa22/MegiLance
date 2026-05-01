// @AI-HINT: Advanced AI Chat Hook with real-time connection management, automatic reconnection, and intelligent fallbacks
import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  suggestions?: string[];
  metadata?: Record<string, any>;
  isError?: boolean;
  isStreaming?: boolean;
}

export interface AIConnectionStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastPing: Date | null;
  latency: number | null;
  mode: 'online' | 'offline' | 'degraded';
  backendAvailable: boolean;
  aiServiceAvailable: boolean;
  error: string | null;
}

export interface UseAIChatOptions {
  apiBaseUrl?: string;
  aiServiceUrl?: string;
  enableOfflineMode?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  pingInterval?: number;
  maxRetries?: number;
  onStatusChange?: (status: AIConnectionStatus) => void;
  onError?: (error: Error) => void;
}

export interface UseAIChatReturn {
  messages: ChatMessage[];
  status: AIConnectionStatus;
  conversationId: string | null;
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryConnection: () => Promise<void>;
  getAICapabilities: () => Promise<any>;
}

// ============================================================================
// Offline Response Generator
// ============================================================================

const generateOfflineResponse = (message: string): { content: string; suggestions?: string[] } => {
  const msg = message.toLowerCase();

  // Greeting patterns
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(msg)) {
    return {
      content: "Hello! 👋 I'm MegiBot, your AI assistant. I'm currently in offline mode with limited features, but I can still help with basic questions about MegiLance. How can I assist you?",
      suggestions: ['How do I get started?', 'Find freelancers', 'Post a project', 'Payment info']
    };
  }

  // Getting started
  if (/start|begin|new\s*here|how\s*do\s*i|get\s*started/.test(msg)) {
    return {
      content: `**Getting Started with MegiLance** 🚀

**For Clients:**
1. Sign up and complete your profile
2. Post a project with clear requirements
3. Review proposals from qualified freelancers
4. Hire and manage through milestones

**For Freelancers:**
1. Create a compelling profile
2. Showcase your portfolio
3. Submit personalized proposals
4. Deliver quality work on time

Our AI matching helps connect the right talent with the right projects!`,
      suggestions: ['How to post a project?', 'How to submit proposals?', 'Payment methods?']
    };
  }

  // Project posting
  if (/post|project|job|create\s*project/.test(msg)) {
    return {
      content: `**How to Post a Project** 📋

1. Go to your Client Dashboard
2. Click **"Post a Project"**
3. Fill in the details:
   - Clear, descriptive title
   - Detailed requirements
   - Required skills
   - Budget range
   - Timeline
4. Review and publish!

💡 **Tips for better proposals:**
- Be specific about deliverables
- Set realistic budgets
- Mention preferred communication style`,
      suggestions: ['Pricing advice', 'Find freelancers', 'Payment protection']
    };
  }

  // Finding freelancers
  if (/find|hire|freelancer|talent|search/.test(msg)) {
    return {
      content: `**Finding the Right Freelancer** 🔍

1. Browse the **Talent Directory**
2. Use filters:
   - Skills & expertise
   - Experience level
   - Hourly rate
   - Ratings & reviews
3. Review portfolios and past work
4. Send a message or invite to project

Our **AI Matching** system analyzes:
✨ Skill compatibility
✨ Past performance
✨ Availability
✨ Success rate`,
      suggestions: ['How AI matching works', 'Review freelancer profiles', 'Interview tips']
    };
  }

  // Payment questions
  if (/payment|pay|escrow|money|withdraw|usdc|fee/.test(msg)) {
    return {
      content: `**Payment & Escrow** 💰

**How Escrow Works:**
1. Client deposits funds securely
2. Freelancer completes the work
3. Client approves delivery
4. Funds released to freelancer

**Payment Methods:**
• Credit/Debit Cards
• PayPal
• Bank Transfer
• USDC (crypto)

**Fees:**
• Freelancers: 5-10% service fee
• Clients: No additional fees
• Withdrawals: Free over $100`,
      suggestions: ['Withdrawal times', 'Dispute resolution', 'Refund policy']
    };
  }

  // Proposals
  if (/proposal|bid|apply|submit/.test(msg)) {
    return {
      content: `**Submitting Winning Proposals** 📝

**Do:**
✅ Personalize each proposal
✅ Address specific requirements
✅ Showcase relevant experience
✅ Provide realistic timeline
✅ Be professional but personable

**Don't:**
❌ Send generic templates
❌ Underprice yourself
❌ Ignore project details
❌ Over-promise deliverables

**Pro Tip:** Use our AI proposal generator for personalized suggestions!`,
      suggestions: ['Pricing your services', 'Portfolio tips', 'Communication best practices']
    };
  }

  // Help with platform
  if (/help|support|issue|problem|bug/.test(msg)) {
    return {
      content: `**Need Help?** 🤝

I can assist with:
• Account & profile setup
• Project management
• Payment questions
• Platform navigation

For technical issues or account problems, please:
1. Check our Help Center at /help
2. Contact support at support@megilance.com
3. Use the feedback form in Settings

Is there something specific I can help you with?`,
      suggestions: ['Contact support', 'Help center', 'Report a bug']
    };
  }

  // Thank you / goodbye
  if (/thank|thanks|bye|goodbye/.test(msg)) {
    return {
      content: "You're welcome! 😊 Feel free to ask if you have more questions. Have a great day!",
    };
  }

  // Default response
  return {
    content: `I'm here to help! Here are some things I can assist with:

🎯 **Projects** - Posting, managing, and completing projects
👥 **Talent** - Finding and hiring freelancers
💰 **Payments** - Escrow, fees, and withdrawals
🔧 **Platform** - Navigation and features

What would you like to know more about?`,
    suggestions: ['Getting started', 'Find freelancers', 'Post a project', 'Payment info']
  };
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAIChat(options: UseAIChatOptions = {}): UseAIChatReturn {
  const {
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api',
    aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || '',
    enableOfflineMode = true,
    autoReconnect = true,
    reconnectInterval = 30000,
    pingInterval = 15000,
    maxRetries = 3,
    onStatusChange,
    onError,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<AIConnectionStatus>({
    isOnline: false,
    isConnecting: true,
    lastPing: null,
    latency: null,
    mode: 'offline',
    backendAvailable: false,
    aiServiceAvailable: false,
    error: null,
  });

  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Update status and notify
  const updateStatus = useCallback((updates: Partial<AIConnectionStatus>) => {
    setStatus((prev) => {
      const newStatus = { ...prev, ...updates };
      
      // Determine mode based on availability
      if (newStatus.backendAvailable && newStatus.aiServiceAvailable) {
        newStatus.mode = 'online';
        newStatus.isOnline = true;
      } else if (newStatus.backendAvailable || newStatus.aiServiceAvailable) {
        newStatus.mode = 'degraded';
        newStatus.isOnline = true;
      } else {
        newStatus.mode = enableOfflineMode ? 'offline' : 'offline';
        newStatus.isOnline = enableOfflineMode;
      }

      onStatusChange?.(newStatus);
      return newStatus;
    });
  }, [enableOfflineMode, onStatusChange]);

  // Ping backend
  const pingBackend = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${apiBaseUrl}/health/ready`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        updateStatus({
          backendAvailable: true,
          lastPing: new Date(),
          latency,
          error: null,
        });
        retryCountRef.current = 0;
        return true;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Backend ping failed:', error);
      }
    }
    
    updateStatus({ backendAvailable: false });
    return false;
  }, [apiBaseUrl, updateStatus]);

  // Ping AI service (skipped if no URL configured — chatbot uses backend directly)
  const pingAIService = useCallback(async (): Promise<boolean> => {
    if (!aiServiceUrl) {
      updateStatus({ aiServiceAvailable: false });
      return false;
    }
    try {
      const response = await fetch(`${aiServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        await response.json();
        updateStatus({
          aiServiceAvailable: true,
          error: null,
        });
        return true;
      }
    } catch {
      // External AI service is optional; fail silently to avoid log spam
    }

    updateStatus({ aiServiceAvailable: false });
    return false;
  }, [aiServiceUrl, updateStatus]);

  // Combined health check
  const checkConnection = useCallback(async () => {
    updateStatus({ isConnecting: true });
    
    const [backendOk, aiOk] = await Promise.all([
      pingBackend(),
      pingAIService(),
    ]);

    updateStatus({ isConnecting: false });
    return backendOk || aiOk;
  }, [pingBackend, pingAIService, updateStatus]);

  // Retry connection
  const retryConnection = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      updateStatus({
        error: 'Max retry attempts reached. Using offline mode.',
        isConnecting: false,
      });
      return;
    }

    retryCountRef.current++;
    await checkConnection();
  }, [checkConnection, maxRetries, updateStatus]);

  // Start conversation
  const startConversation = useCallback(async () => {
    if (!status.backendAvailable) {
      // Generate offline conversation ID
      setConversationId(`offline-${Date.now()}`);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/chatbot/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation_id);
        
        if (data.response) {
          setMessages([{
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            sentiment: 'positive',
            suggestions: data.suggested_topics,
          }]);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to start conversation:', error);
      }
      setConversationId(`offline-${Date.now()}`);
    }
  }, [apiBaseUrl, status.backendAvailable]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Try AI service first for better responses
      if (status.aiServiceAvailable) {
        const response = await fetch(`${aiServiceUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.concat(userMessage).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            max_length: 500,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Simulate typing delay for natural feel
          await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

          const botMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            metadata: { method: data.method, model: data.model },
          };

          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
          return;
        }
      }

      // Try backend chatbot
      if (status.backendAvailable && conversationId && !conversationId.startsWith('offline')) {
        const response = await fetch(`${apiBaseUrl}/chatbot/${conversationId}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content }),
        });

        if (response.ok) {
          const data = await response.json();
          
          await new Promise((r) => setTimeout(r, 500 + Math.random() * 800));

          const botMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            sentiment: data.sentiment,
            suggestions: data.suggestions,
          };

          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
          return;
        }
      }

      // Fallback to offline mode
      if (enableOfflineMode) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
        
        const offlineResponse = generateOfflineResponse(content);
        
        const botMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: offlineResponse.content,
          timestamp: new Date(),
          suggestions: offlineResponse.suggestions,
          metadata: { mode: 'offline' },
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send message:', error);
      }
      onError?.(error instanceof Error ? error : new Error('Message failed'));
      
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment, or check your connection.",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [
    apiBaseUrl,
    aiServiceUrl,
    conversationId,
    enableOfflineMode,
    messages,
    onError,
    status.aiServiceAvailable,
    status.backendAvailable,
  ]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    startConversation();
  }, [startConversation]);

  // Get AI capabilities
  const getAICapabilities = useCallback(async () => {
    try {
      if (status.aiServiceAvailable) {
        const response = await fetch(`${aiServiceUrl}/`);
        if (response.ok) {
          return await response.json();
        }
      }
      return { status: 'offline', endpoints: [] };
    } catch {
      return { status: 'error', endpoints: [] };
    }
  }, [aiServiceUrl, status.aiServiceAvailable]);

  // Initialize on mount
  useEffect(() => {
    checkConnection().then(() => {
      startConversation();
    });

    // Set up periodic ping
    pingIntervalRef.current = setInterval(() => {
      checkConnection();
    }, pingInterval);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-reconnect when connection lost
  useEffect(() => {
    if (!status.isOnline && autoReconnect && !status.isConnecting) {
      reconnectTimeoutRef.current = setTimeout(() => {
        retryConnection();
      }, reconnectInterval);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [status.isOnline, status.isConnecting, autoReconnect, reconnectInterval, retryConnection]);

  return {
    messages,
    status,
    conversationId,
    isTyping,
    sendMessage,
    clearMessages,
    retryConnection,
    getAICapabilities,
  };
}


