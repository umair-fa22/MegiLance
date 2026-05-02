// @AI-HINT: Enhanced AI chatbot with Framer Motion, magnetic hover, 3D effects, and world-class animations
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { MessageSquare, X, Send, Sparkles, Zap, HelpCircle, FileText, User } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import RobotModel from './RobotModel';
import commonStyles from './ChatbotAgent.common.module.css';
import lightStyles from './ChatbotAgent.light.module.css';
import darkStyles from './ChatbotAgent.dark.module.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  suggestedActions?: string[];
}

const SUGGESTED_ACTIONS = [
  { icon: HelpCircle, text: 'How do I get started?' },
  { icon: FileText, text: 'View my projects' },
  { icon: User, text: 'Find freelancers' },
  { icon: Zap, text: 'Quick tips' },
];

export default function ChatbotAgent() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  // 'online' = fully connected; 'degraded' = backend up but LLM unavailable; 'offline' = network down
  const [chatStatus, setChatStatus] = useState<'online' | 'degraded' | 'offline'>('online');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Magnetic mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-50, 50], [10, -10]), {
    damping: 20,
    stiffness: 200,
  });
  const rotateY = useSpring(useTransform(mouseX, [-50, 50], [-10, 10]), {
    damping: 20,
    stiffness: 200,
  });

  const handleButtonMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleButtonMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && !conversationId) {
      startConversation();
    }
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const startConversation = async () => {
    setIsLoading(true);
    setIsTyping(true);
    try {
      const res = await fetch('/api/chatbot/start', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start conversation');
      const data = await res.json();
      setConversationId(data.conversation_id);
      
      // Brief delay for natural feel (reduced from 800ms)
      await new Promise(resolve => setTimeout(resolve, 150));
      
      setMessages([{ 
        id: 1, 
        text: data.response, 
        sender: 'bot',
        timestamp: new Date(),
        sentiment: 'positive',
        suggestedActions: ['How do I get started?', 'Find freelancers', 'Post a project']
      }]);
    } catch (error: any) {
      // Distinguish: network error (offline) vs server error (backend up but LLM not configured)
      const isNetworkError = !error?.status && (error instanceof TypeError || error?.message?.includes('fetch'));
      const isDegraded = error?.status === 503 || error?.status === 500 || error?.status === 422;
      setIsOfflineMode(true);
      setConversationId('offline-' + Date.now());
      if (isNetworkError) {
        setChatStatus('offline');
        setMessages([{
          id: 1,
          text: "I can't reach the server right now. Check your connection — I can still answer basic questions in the meantime.",
          sender: 'bot',
          timestamp: new Date(),
          sentiment: 'neutral',
          suggestedActions: ['How do I get started?', 'Find freelancers', 'Post a project'],
        }]);
      } else if (isDegraded) {
        setChatStatus('degraded');
        setMessages([{
          id: 1,
          text: "Hi! I'm MegiBot. The AI assistant is temporarily limited — I'll answer what I can with built-in responses. How can I help?",
          sender: 'bot',
          timestamp: new Date(),
          sentiment: 'neutral',
          suggestedActions: ['How do I get started?', 'Find freelancers', 'Post a project'],
        }]);
      } else {
        setChatStatus('degraded');
        setMessages([{
          id: 1,
          text: "Hi! I'm MegiBot. The AI service is temporarily limited but I can still help with basic questions.",
          sender: 'bot',
          timestamp: new Date(),
          sentiment: 'neutral',
          suggestedActions: ['How do I get started?', 'Find freelancers', 'Post a project'],
        }]);
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSuggestedAction = useCallback((action: string) => {
    setInputValue(action);
    inputRef.current?.focus();
  }, []);

  // Offline mode response generator
  const getOfflineResponse = (userMessage: string): { text: string; sentiment: string; suggestedActions?: string[] } => {
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return { text: "Hello! How can I help you today?", sentiment: 'positive', suggestedActions: ['How do I get started?', 'Find freelancers', 'Post a project'] };
    }
    if (msg.includes('get started') || msg.includes('how to start') || msg.includes('begin')) {
      return { text: "To get started with MegiLance:\n1. Sign up for a free account\n2. Complete your profile\n3. Browse projects or post a job\n4. Connect with clients or freelancers!", sentiment: 'positive' };
    }
    if (msg.includes('find freelancer') || msg.includes('hire')) {
      return { text: "To find freelancers:\n1. Go to Talent Directory from the menu\n2. Use filters to narrow by skill, rating, or rate\n3. Review profiles and portfolios\n4. Send a message or invite to a project!", sentiment: 'positive' };
    }
    if (msg.includes('post') || msg.includes('project') || msg.includes('job')) {
      return { text: "To post a project:\n1. Sign in to your client dashboard\n2. Click 'Post a Job'\n3. Fill in project details and budget\n4. Review proposals from talented freelancers!", sentiment: 'positive' };
    }
    if (msg.includes('payment') || msg.includes('pay') || msg.includes('usdc')) {
      return { text: "MegiLance supports secure payments via USDC stablecoin on Polygon network. Enjoy low fees (< 1%) and instant settlements with blockchain-backed security!", sentiment: 'positive' };
    }
    if (msg.includes('fee') || msg.includes('price') || msg.includes('cost')) {
      return { text: "MegiLance charges only 5-10% platform fees, compared to 20-27% on traditional platforms. Check our Pricing page for detailed plans!", sentiment: 'positive' };
    }
    if (msg.includes('tips') || msg.includes('advice')) {
      return { text: "Quick tips for success:\n• Complete your profile 100%\n• Add a professional portfolio\n• Respond to messages within 24 hours\n• Ask clarifying questions before bidding\n• Deliver quality work on time!", sentiment: 'positive' };
    }
    
    const limitedMsg = chatStatus === 'offline'
      ? "I'm not connected to the server right now — I can only answer basic questions. Try again once your connection is restored."
      : "I don't have a specific answer for that in limited mode. Try asking about getting started, payments, or finding freelancers!";
    return { text: limitedMsg, sentiment: 'neutral', suggestedActions: ['How do I get started?', 'Find freelancers', 'Post a project'] };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '' || !conversationId) return;

    const userText = inputValue;
    const newUserMessage: Message = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    // Handle offline mode with local responses
    if (isOfflineMode) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
      const offlineData = getOfflineResponse(userText);
      const botResponse: Message = {
        id: Date.now() + 1,
        text: offlineData.text,
        sender: 'bot',
        timestamp: new Date(),
        sentiment: offlineData.sentiment as 'positive' | 'neutral' | 'negative',
        suggestedActions: offlineData.suggestedActions,
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
      setIsTyping(false);
      return;
    }

    try {
      const res = await fetch(`/api/chatbot/${conversationId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      
      const data = await res.json();
      
      // Brief delay for natural feel (reduced from 600-1400ms)
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
      
      const botResponse: Message = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        sentiment: data.sentiment || 'neutral',
        suggestedActions: data.suggested_actions,
      };
      setMessages(prev => [...prev, botResponse]);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (err: any) {
      // On any send failure, flip to offline mode and surface a helpful response
      const isNetworkErr = !err?.status && (err instanceof TypeError || err?.message?.includes('fetch'));
      if (!isOfflineMode) {
        setIsOfflineMode(true);
        setChatStatus(isNetworkErr ? 'offline' : 'degraded');
      }
      const offlineData = getOfflineResponse(userText);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: offlineData.text,
        sender: 'bot',
        timestamp: new Date(),
        sentiment: offlineData.sentiment as 'positive' | 'neutral' | 'negative',
        suggestedActions: offlineData.suggestedActions,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const getSentimentClass = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return themeStyles.sentimentBadge;
      case 'negative': return cn(commonStyles.sentimentBadge, themeStyles.sentimentBadgeNegative);
      default: return cn(commonStyles.sentimentBadge, themeStyles.sentimentBadgeNeutral);
    }
  };

  if (!mounted) {
    return (
      <div className={commonStyles.chatbotContainer}>
        <button
          className={cn(commonStyles.toggleButton, lightStyles.toggleButton)}
          aria-label="Loading chat"
          disabled
        >
          <RobotModel size={28} />
        </button>
      </div>
    );
  }

  return (
    <div className={commonStyles.chatbotContainer}>
      {isOpen && (
        <div 
          className={cn(commonStyles.chatbotAgent, themeStyles.chatbotAgent)}
          role="dialog"
          aria-modal="true"
          aria-label="MegiBot AI Chat"
        >
          {/* Enhanced Header */}
          <div className={cn(commonStyles.chatbotAgentHeader, themeStyles.chatbotAgentHeader)}>
            <div className={commonStyles.headerLeft}>
              <div className={cn(commonStyles.aiAvatar, themeStyles.aiAvatar)}>
                  <div style={{ marginLeft: '-1px', marginTop: '1px' }}>
                    <RobotModel size={24} />
                  </div>
                <div className={cn(commonStyles.aiAvatarPulse, themeStyles.aiAvatarPulse)} />
              </div>
              <div className={commonStyles.headerInfo}>
                <h3>MegiBot AI</h3>
                <span className={cn(commonStyles.headerStatus, themeStyles.headerStatus)}>
                  <span className={cn(
                    commonStyles.statusDot,
                    themeStyles.statusDot,
                    chatStatus === 'offline' && commonStyles.statusDotOffline,
                    chatStatus === 'degraded' && commonStyles.statusDotDegraded,
                  )} />
                  {isTyping
                    ? 'Typing…'
                    : chatStatus === 'offline'
                    ? 'No connection'
                    : chatStatus === 'degraded'
                    ? 'Limited mode'
                    : 'Online'}
                  {isOfflineMode && (
                    <button
                      className={commonStyles.retryBtn}
                      onClick={() => {
                        setIsOfflineMode(false);
                        setChatStatus('online');
                        setMessages([]);
                        setConversationId(null);
                        startConversation();
                      }}
                      title="Retry connection"
                      aria-label="Retry connection"
                    >↺</button>
                  )}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className={cn(commonStyles.closeButton, themeStyles.closeButton)}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Messages Area */}
          <div 
            className={cn(commonStyles.chatbotAgentMessages, themeStyles.chatbotAgentMessages)}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.length === 0 && !isTyping && (
              <div className={commonStyles.suggestedActions}>
                {SUGGESTED_ACTIONS.map((action, index) => (
                  <button
                    key={index}
                    className={cn(commonStyles.suggestedAction, themeStyles.suggestedAction)}
                    onClick={() => handleSuggestedAction(action.text)}
                  >
                    <action.icon size={14} />
                    {action.text}
                  </button>
                ))}
              </div>
            )}
            
            {messages.map(message => (
              <div 
                key={message.id} 
                className={cn(
                  commonStyles.message,
                  message.sender === 'bot' ? commonStyles.messageBot : commonStyles.messageUser,
                  message.sender === 'bot' ? themeStyles.messageBot : themeStyles.messageUser
                )}
              >
                <div className={cn(commonStyles.messageBubble, themeStyles.messageBubble)}>
                  <p>{message.text}</p>
                  {message.sender === 'bot' && message.sentiment && (
                    <span className={getSentimentClass(message.sentiment)}>
                      {message.sentiment === 'positive' ? '😊' : message.sentiment === 'negative' ? '😔' : '😐'}
                    </span>
                  )}
                </div>
                <span className={cn(commonStyles.messageTime, themeStyles.messageTime)}>
                  {formatTime(message.timestamp)}
                </span>
                
                {/* Suggested Actions after bot message */}
                {message.sender === 'bot' && message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className={commonStyles.suggestedActions}>
                    {message.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        className={cn(commonStyles.suggestedAction, themeStyles.suggestedAction)}
                        onClick={() => handleSuggestedAction(action)}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className={cn(commonStyles.message, commonStyles.messageBot)}>
                <div className={cn(commonStyles.typingIndicator, themeStyles.typingIndicator)}>
                  <div className={commonStyles.typingDots}>
                    <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                    <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                    <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Enhanced Input Form */}
          <form className={cn(commonStyles.chatbotAgentInputForm, themeStyles.chatbotAgentInputForm)} onSubmit={handleSendMessage}>
            <div className={cn(commonStyles.inputWrapper, themeStyles.inputWrapper)}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className={cn(commonStyles.chatbotAgentInput, themeStyles.chatbotAgentInput)}
                disabled={isLoading || !conversationId}
              />
              <button 
                type="submit" 
                className={cn(commonStyles.sendButton, themeStyles.sendButton)}
                disabled={isLoading || !inputValue.trim() || !conversationId}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Toggle Button with Framer Motion, 3D, and Notification Badge */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseMove={handleButtonMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleButtonMouseLeave}
        className={cn(commonStyles.toggleButton, themeStyles.toggleButton)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        {/* Floating particles effect on hover */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(commonStyles.particle, themeStyles.particle)}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 6) * 40,
                    y: Math.sin((i * Math.PI * 2) / 6) * 40,
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Icon with smooth transition */}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className={commonStyles.flexCenter}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0, scale: 0 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0 }}
              transition={{ duration: 0.3, type: 'spring' }}
              className={commonStyles.flexCenter}
            >
              <div style={{ pointerEvents: 'none', marginLeft: '-2px', marginTop: '2px' }}>
                <RobotModel size={34} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge */}
        {!isOpen && unreadCount > 0 && (
          <motion.span
            className={cn(commonStyles.notificationBadge, themeStyles.notificationBadge)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}

        {/* Ambient glow ring */}
        <motion.div
          className={cn(commonStyles.glowRing, themeStyles.glowRing)}
          animate={{
            scale: isHovered ? [1, 1.15, 1] : 1,
            opacity: isHovered ? [0.5, 0.8, 0.5] : 0.3,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.button>
    </div>
  );
};
