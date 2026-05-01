// @AI-HINT: Enhanced AI Chatbot V2 with real-time status, offline mode, streaming support, and modern UI
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/app/hooks/useAIChat';
import AIStatusIndicator from '@/app/components/AI/AIStatusIndicator/AIStatusIndicator';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import {
  Send,
  Trash2,
  MoreVertical,
  Settings,
  RefreshCw,
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Zap,
  MessageSquare,
  Info,
  Mic,
  Volume2,
} from 'lucide-react';

import commonStyles from './ChatbotEnhanced.common.module.css';
import lightStyles from './ChatbotEnhanced.light.module.css';
import darkStyles from './ChatbotEnhanced.dark.module.css';

// ============================================================================
// Types
// ============================================================================

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  query: string;
}

// ============================================================================
// Constants
// ============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  { icon: <Zap size={14} />, label: 'Getting Started', query: 'How do I get started on MegiLance?' },
  { icon: <User size={14} />, label: 'Find Freelancers', query: 'How can I find qualified freelancers?' },
  { icon: <MessageSquare size={14} />, label: 'Post Project', query: 'How do I post a new project?' },
  { icon: <Info size={14} />, label: 'Payment Info', query: 'How does the payment system work?' },
];

// ============================================================================
// Component
// ============================================================================

const ChatbotEnhanced: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    status,
    isTyping,
    sendMessage,
    clearMessages,
    retryConnection,
  } = useAIChat({
    enableOfflineMode: true,
    autoReconnect: true,
    pingInterval: 20000,
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) setRecognitionAvailable(true);
  }, []);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('speech error', e);
    }
  };

  const startRecognition = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (ev: any) => {
      const transcript = ev.results[0][0].transcript;
      // send via useAIChat
      sendMessage(transcript);
    };
    recog.onerror = (e: any) => console.warn('recog error', e);
    recog.onend = () => { recognitionRef.current = null; };
    recognitionRef.current = recog;
    recog.start();
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    if (mounted) {
      inputRef.current?.focus();
    }
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleQuickAction = async (query: string) => {
    setInput('');
    await sendMessage(query);
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!mounted) {
    return (
      <div className={cn(commonStyles.container, lightStyles.container)}>
        <div className={commonStyles.loadingState}>
          <img src="/assets/chatbot/chatbot-icon.png" alt="Loading" className={commonStyles.loadingIcon} />
          <span>Loading AI Chat...</span>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.chatContainer, themeStyles.chatContainer)}>
            {/* Header */}
            <header className={cn(commonStyles.header, themeStyles.header)}>
              <div className={commonStyles.headerLeft}>
                <div className={cn(commonStyles.aiAvatar, themeStyles.aiAvatar, isSpeaking && commonStyles.speaking)}>
                  <img src="/assets/chatbot/chatbot-icon.png" alt="MegiBot" className={commonStyles.avatarImage} />
                  <div className={cn(commonStyles.avatarPulse, themeStyles.avatarPulse)} />
                </div>
                <div className={commonStyles.headerInfo}>
                  <h2 className={cn(commonStyles.headerTitle, themeStyles.headerTitle)}>
                    MegiBot AI
                  </h2>
                  <AIStatusIndicator 
                    status={status} 
                    onRetry={retryConnection}
                    variant="badge"
                    showDetails
                  />
                </div>
              </div>
              
              <div className={commonStyles.headerActions}>
                <button
                  className={cn(commonStyles.iconButton, themeStyles.iconButton)}
                  onClick={clearMessages}
                  title="Clear chat"
                  aria-label="Clear chat history"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  className={cn(commonStyles.iconButton, themeStyles.iconButton)}
                  onClick={clearMessages}
                  title="Clear chat"
                  aria-label="Clear chat history"
                >
                  <Trash2 size={18} />
                </button>
                {recognitionAvailable && (
                  <button
                    className={cn(commonStyles.iconButton, themeStyles.iconButton)}
                    title="Start voice input"
                    onClick={() => startRecognition()}
                  >
                    <Mic size={18} />
                  </button>
                )}
                <button
                  className={cn(commonStyles.iconButton, themeStyles.iconButton)}
                  title="Speak latest response"
                  onClick={() => {
                    const last = [...messages].reverse().find(m => m.role === 'assistant');
                    if (last) speakText(last.content);
                  }}
                >
                  <Volume2 size={18} />
                </button>
                <button
                  className={cn(commonStyles.iconButton, themeStyles.iconButton)}
                  onClick={() => setShowActions(!showActions)}
                  title="More options"
                  aria-label="More options"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>

            {/* Quick Actions Bar */}
            <AnimatePresence>
              {messages.length <= 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(commonStyles.quickActionsBar, themeStyles.quickActionsBar)}
                >
                  <span className={commonStyles.quickActionsLabel}>Quick Actions:</span>
                  <div className={commonStyles.quickActions}>
                    {QUICK_ACTIONS.map((action, idx) => (
                      <button
                        key={idx}
                        className={cn(commonStyles.quickAction, themeStyles.quickAction)}
                        onClick={() => handleQuickAction(action.query)}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div
              className={commonStyles.messagesContainer}
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={cn(
                      commonStyles.messageWrapper,
                      msg.role === 'user' ? commonStyles.messageUser : commonStyles.messageBot
                    )}
                  >
                    {/* Avatar */}
                    {msg.role === 'assistant' && (
                      <div className={cn(commonStyles.messageAvatar, themeStyles.messageAvatar, isSpeaking && commonStyles.speaking)}>
                        <img src="/assets/chatbot/chatbot-icon.png" alt="AI" className={commonStyles.avatarImageSmall} />
                      </div>
                    )}

                    {/* Message Content */}
                    <div className={commonStyles.messageContent}>
                      <div
                        className={cn(
                          commonStyles.messageBubble,
                          msg.role === 'user'
                            ? themeStyles.messageBubbleUser
                            : themeStyles.messageBubbleBot,
                          msg.isError && commonStyles.messageError
                        )}
                      >
                        {/* Render content with line breaks */}
                        <div className={commonStyles.messageText}>
                          {msg.content.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                              {line}
                              {i < msg.content.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Sentiment indicator for bot messages */}
                        {msg.role === 'assistant' && msg.sentiment && (
                          <span className={cn(commonStyles.sentimentBadge, themeStyles.sentimentBadge)}>
                            {msg.sentiment === 'positive' ? '😊' : msg.sentiment === 'negative' ? '😔' : '😐'}
                          </span>
                        )}
                      </div>

                      {/* Message Meta */}
                      <div className={cn(commonStyles.messageMeta, themeStyles.messageMeta)}>
                        <span className={commonStyles.messageTime}>
                          {formatTime(msg.timestamp)}
                        </span>
                        
                        {msg.role === 'assistant' && !msg.isError && (
                          <div className={commonStyles.messageActions}>
                            <button
                              className={cn(commonStyles.messageAction, themeStyles.messageAction)}
                              onClick={() => handleCopy(msg.content, msg.id)}
                              title="Copy message"
                            >
                              {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            <button
                              className={cn(commonStyles.messageAction, themeStyles.messageAction)}
                              title="Helpful"
                            >
                              <ThumbsUp size={12} />
                            </button>
                            <button
                              className={cn(commonStyles.messageAction, themeStyles.messageAction)}
                              title="Not helpful"
                            >
                              <ThumbsDown size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Suggested Actions */}
                      {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                        <div className={commonStyles.suggestions}>
                          {msg.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              className={cn(commonStyles.suggestionChip, themeStyles.suggestionChip)}
                              onClick={() => handleQuickAction(suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* User Avatar */}
                    {msg.role === 'user' && (
                      <div className={cn(commonStyles.userAvatar, themeStyles.userAvatar)}>
                        <User size={16} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(commonStyles.messageWrapper, commonStyles.messageBot)}
                  >
                    <div className={cn(commonStyles.messageAvatar, themeStyles.messageAvatar, isSpeaking && commonStyles.speaking)}>
                      <img src="/assets/chatbot/chatbot-icon.png" alt="AI" className={commonStyles.avatarImageSmall} />
                    </div>
                    <div className={cn(commonStyles.typingIndicator, themeStyles.typingIndicator)}>
                      <div className={commonStyles.typingDots}>
                        <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                        <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                        <span className={cn(commonStyles.typingDot, themeStyles.typingDot)} />
                      </div>
                      <span className={commonStyles.typingText}>AI is thinking...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              className={cn(commonStyles.inputForm, themeStyles.inputForm)}
              onSubmit={handleSubmit}
            >
              <div className={cn(commonStyles.inputWrapper, themeStyles.inputWrapper)}>
                <input
                  ref={inputRef}
                  type="text"
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder={
                    status.mode === 'offline'
                      ? 'Offline mode - basic responses available...'
                      : 'Ask me anything about MegiLance...'
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                  aria-label="Type your message"
                />
                <button
                  type="submit"
                  className={cn(
                    commonStyles.sendButton,
                    themeStyles.sendButton,
                    (!input.trim() || isTyping) && commonStyles.sendButtonDisabled
                  )}
                  disabled={!input.trim() || isTyping}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>

              {/* Mode indicator */}
              {status.mode !== 'online' && (
                <div className={cn(commonStyles.modeIndicator, themeStyles.modeIndicator)}>
                  <Info size={12} />
                  <span>
                    {status.mode === 'offline'
                      ? 'Offline mode: Using local responses'
                      : 'Limited connectivity: Some features may be unavailable'}
                  </span>
                </div>
              )}
            </form>
          </div>
        </ScrollReveal>
      </div>
    </PageTransition>
  );
};

export default ChatbotEnhanced;
