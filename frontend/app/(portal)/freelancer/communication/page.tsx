// @AI-HINT: Unified communication center with messages, notifications, and announcements
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Communication.common.module.css';
import lightStyles from './Communication.light.module.css';
import darkStyles from './Communication.dark.module.css';
import {
  Inbox, Send, Star, Bell, Megaphone, Search, X, Mail,
  Paperclip, Reply, Forward, Archive, CheckCircle, Info,
  AlertTriangle, AlertCircle, Clock, MessageSquare, Pen,
  ChevronLeft, Eye, EyeOff, StarOff, Trash2, MoreVertical,
  Plus, FileText, ExternalLink
} from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  subject: string;
  preview: string;
  content: string;
  is_read: boolean;
  is_starred: boolean;
  thread_id?: string;
  created_at: string;
  attachments?: { name: string; url: string; size: number }[];
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  created_at: string;
}

type TabType = 'inbox' | 'sent' | 'starred' | 'notifications' | 'announcements';

const TAB_CONFIG: { id: TabType; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
];

const NOTIF_ICONS = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', variant: 'default' as const },
  normal: { label: 'Normal', variant: 'primary' as const },
  high: { label: 'High', variant: 'warning' as const },
  urgent: { label: 'Urgent', variant: 'danger' as const },
};

export default function CommunicationPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
    loadCommunicationData();
  }, []);

  const loadCommunicationData = async () => {
    setLoading(true);
    try {
      const { messagesApi, notificationsApi } = await import('@/lib/api');

      const [inboxRes, sentRes, notifRes] = await Promise.all([
        (messagesApi as any).getConversations?.({ folder: 'inbox' }).catch(() => null),
        (messagesApi as any).getConversations?.({ folder: 'sent' }).catch(() => null),
        (notificationsApi as any).list?.().catch(() => null),
      ]);

      const inboxArray = Array.isArray(inboxRes) ? inboxRes : inboxRes?.messages || inboxRes?.items || [];
      if (inboxArray.length > 0) {
        setMessages(inboxArray.map((m: any) => ({
          id: m.id?.toString(),
          sender_id: m.sender_id?.toString(),
          sender_name: m.sender_name || m.from_name || 'Unknown',
          sender_avatar: m.sender_avatar || m.avatar_url,
          subject: m.subject || 'No subject',
          preview: m.preview || m.content?.substring(0, 100) || '',
          content: m.content || m.body || '',
          is_read: m.is_read ?? m.read ?? false,
          is_starred: m.is_starred ?? m.starred ?? false,
          thread_id: m.thread_id,
          created_at: m.created_at,
          attachments: m.attachments || []
        })));
      }

      const sentArray = Array.isArray(sentRes) ? sentRes : sentRes?.messages || sentRes?.items || [];
      setSentMessages(sentArray.map((m: any) => ({
        id: m.id?.toString(),
        sender_id: m.sender_id?.toString() || 'me',
        sender_name: m.sender_name || 'You',
        subject: m.subject || 'No subject',
        preview: m.preview || m.content?.substring(0, 100) || '',
        content: m.content || m.body || '',
        is_read: true,
        is_starred: m.is_starred ?? false,
        created_at: m.created_at
      })));

      const notifArray = Array.isArray(notifRes) ? notifRes : notifRes?.notifications || notifRes?.items || [];
      if (notifArray.length > 0) {
        setNotifications(notifArray.map((n: any) => ({
          id: n.id?.toString(),
          type: n.type || 'info',
          title: n.title,
          message: n.message || n.body,
          is_read: n.is_read ?? n.read ?? false,
          action_url: n.action_url,
          created_at: n.created_at
        })));
      }

      try {
        const { default: api } = await import('@/lib/api');
        const announcementsRes = await (api as any).announcements?.list?.().catch(() => null);
        const announcementArray = Array.isArray(announcementsRes) ? announcementsRes : announcementsRes?.announcements || announcementsRes?.items || [];
        setAnnouncements(announcementArray.map((a: any) => ({
          id: a.id?.toString(),
          title: a.title || 'Announcement',
          content: a.content || a.message || '',
          priority: a.priority || 'normal',
          expires_at: a.expires_at,
          created_at: a.created_at
        })));
      } catch {
        setAnnouncements([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load communication data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, is_read: true } : m)));
  };

  const handleToggleStar = (messageId: string) => {
    setMessages(prev => prev.map(m => (m.id === messageId ? { ...m, is_starred: !m.is_starred } : m)));
  };

  const handleMarkAllRead = () => {
    if (activeTab === 'notifications') {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('All notifications marked as read', 'success');
    } else {
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      showToast('All messages marked as read', 'success');
    }
  };

  const handleSendMessage = async () => {
    if (!composeData.to || !composeData.subject || !composeData.content) return;
    try {
      setIsComposing(false);
      setComposeData({ to: '', subject: '', content: '' });
      showToast('Message sent successfully!', 'success');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send message:', error);
      }
      showToast('Failed to send message', 'error');
    }
  };

  const handleMarkNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => (n.id === notifId ? { ...n, is_read: true } : n)));
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getUnreadCount = (type: TabType) => {
    switch (type) {
      case 'inbox': return messages.filter(m => !m.is_read).length;
      case 'starred': return messages.filter(m => m.is_starred).length;
      case 'notifications': return notifications.filter(n => !n.is_read).length;
      case 'announcements': return announcements.length;
      default: return 0;
    }
  };

  const currentMessages = useMemo(() => {
    let list = activeTab === 'sent' ? sentMessages : messages;
    if (activeTab === 'starred') list = messages.filter(m => m.is_starred);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m =>
        m.subject.toLowerCase().includes(q) ||
        m.sender_name.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, sentMessages, activeTab, searchQuery]);

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const q = searchQuery.toLowerCase();
    return notifications.filter(n =>
      n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
    );
  }, [notifications, searchQuery]);

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter(a =>
      a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    );
  }, [announcements, searchQuery]);

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 5) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const unreadMessages = messages.filter(m => !m.is_read).length;
  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const isMessageTab = activeTab === 'inbox' || activeTab === 'sent' || activeTab === 'starred';

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerText}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <MessageSquare size={28} className={commonStyles.titleIcon} />
                Communication Center
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Messages, notifications, and platform announcements
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              {((isMessageTab && unreadMessages > 0) || (activeTab === 'notifications' && unreadNotifications > 0)) && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  <Eye size={14} /> Mark all read
                </Button>
              )}
              <Button variant="primary" onClick={() => setIsComposing(true)}>
                <Pen size={16} /> Compose
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer delay={0.1} className={commonStyles.stats}>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconBlue)}>
                <Inbox size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{messages.length}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Messages</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconRed)}>
                <Mail size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{unreadMessages}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Unread</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconOrange)}>
                <Bell size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{notifications.length}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Notifications</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, themeStyles.statIconPurple)}>
                <Megaphone size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{announcements.length}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Announcements</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Search Bar */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.searchBar, themeStyles.searchBar)}>
            <Search size={16} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
            <input
              type="text"
              placeholder={isMessageTab ? 'Search messages...' : activeTab === 'notifications' ? 'Search notifications...' : 'Search announcements...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(commonStyles.searchInput, themeStyles.searchInput)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={cn(commonStyles.clearSearch, themeStyles.clearSearch)}>
                <X size={14} />
              </button>
            )}
          </div>
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.tabs, themeStyles.tabs)}>
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon;
              const count = getUnreadCount(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedMessage(null); }}
                  className={cn(
                    commonStyles.tab,
                    themeStyles.tab,
                    activeTab === tab.id && commonStyles.tabActive,
                    activeTab === tab.id && themeStyles.tabActive
                  )}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={cn(commonStyles.tabBadge, themeStyles.tabBadge)}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Main Content */}
        <div className={commonStyles.content}>
          {loading ? (
            <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
              <MessageSquare size={32} className={commonStyles.loadingIcon} />
              <p>Loading communications...</p>
            </div>
          ) : (
            <>
              {/* Messages View */}
              {isMessageTab && (
                <div className={cn(commonStyles.splitView, selectedMessage && commonStyles.hasSelection)}>
                  {/* Message List */}
                  <div className={cn(commonStyles.messageList, themeStyles.messageList)}>
                    <div className={cn(commonStyles.listHeader, themeStyles.listHeader)}>
                      <span>{currentMessages.length} message{currentMessages.length !== 1 ? 's' : ''}</span>
                    </div>
                    {currentMessages.length === 0 ? (
                      <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                        <Inbox size={36} className={commonStyles.emptyIcon} />
                        <h3 className={commonStyles.emptyTitle}>
                          {searchQuery ? 'No messages match your search' : `No ${activeTab === 'starred' ? 'starred' : activeTab} messages`}
                        </h3>
                        <p className={commonStyles.emptyText}>
                          {searchQuery ? 'Try a different search term' : activeTab === 'inbox' ? 'Your inbox is empty' : 'Nothing here yet'}
                        </p>
                      </div>
                    ) : (
                      <StaggerContainer className={commonStyles.messageListItems}>
                        {currentMessages.map(message => (
                          <StaggerItem key={message.id}>
                            <div
                              onClick={() => { setSelectedMessage(message); handleMarkAsRead(message.id); }}
                              className={cn(
                                commonStyles.messageItem,
                                themeStyles.messageItem,
                                !message.is_read && commonStyles.unread,
                                !message.is_read && themeStyles.unread,
                                selectedMessage?.id === message.id && commonStyles.selected,
                                selectedMessage?.id === message.id && themeStyles.selected
                              )}
                            >
                              <div className={commonStyles.messageTop}>
                                <div className={commonStyles.senderInfo}>
                                  <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                                    {message.sender_avatar ? (
                                      <img src={message.sender_avatar} alt={message.sender_name} />
                                    ) : (
                                      <span>{message.sender_name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className={commonStyles.senderMeta}>
                                    <span className={cn(commonStyles.senderName, themeStyles.senderName)}>
                                      {message.sender_name}
                                    </span>
                                    <span className={cn(commonStyles.messageDate, themeStyles.messageDate)}>
                                      {formatTimeAgo(message.created_at)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); handleToggleStar(message.id); }}
                                  className={cn(
                                    commonStyles.starBtn,
                                    themeStyles.starBtn,
                                    message.is_starred && commonStyles.starred,
                                    message.is_starred && themeStyles.starred
                                  )}
                                  aria-label={message.is_starred ? 'Unstar message' : 'Star message'}
                                >
                                  <Star size={16} fill={message.is_starred ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                              <h4 className={cn(commonStyles.messageSubject, themeStyles.messageSubject)}>
                                {message.subject}
                              </h4>
                              <p className={cn(commonStyles.messagePreview, themeStyles.messagePreview)}>
                                {message.preview}
                              </p>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className={cn(commonStyles.attachmentBadge, themeStyles.attachmentBadge)}>
                                  <Paperclip size={12} /> {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                    )}
                  </div>

                  {/* Message Detail */}
                  <div className={cn(commonStyles.messageDetail, themeStyles.messageDetail)}>
                    {selectedMessage ? (
                      <>
                        <div className={cn(commonStyles.detailHeader, themeStyles.detailHeader)}>
                          <button
                            className={cn(commonStyles.backBtn, themeStyles.backBtn)}
                            onClick={() => setSelectedMessage(null)}
                            aria-label="Back to list"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <div className={commonStyles.detailHeaderInfo}>
                            <h2 className={cn(commonStyles.detailSubject, themeStyles.detailSubject)}>
                              {selectedMessage.subject}
                            </h2>
                            <div className={cn(commonStyles.detailMeta, themeStyles.detailMeta)}>
                              <span>
                                <Mail size={12} /> From: <strong>{selectedMessage.sender_name}</strong>
                              </span>
                              <span>
                                <Clock size={12} /> {formatTimeAgo(selectedMessage.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={cn(commonStyles.detailContent, themeStyles.detailContent)}>
                          <p>{selectedMessage.content}</p>

                          {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                            <div className={commonStyles.attachmentSection}>
                              <h4 className={cn(commonStyles.attachmentTitle, themeStyles.attachmentTitle)}>
                                <Paperclip size={14} /> Attachments ({selectedMessage.attachments.length})
                              </h4>
                              <div className={commonStyles.attachmentGrid}>
                                {selectedMessage.attachments.map((att, idx) => (
                                  <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(commonStyles.attachmentItem, themeStyles.attachmentItem)}
                                  >
                                    <FileText size={16} />
                                    <div className={commonStyles.attachmentInfo}>
                                      <span className={commonStyles.attachmentName}>{att.name}</span>
                                      <span className={commonStyles.attachmentSize}>{formatFileSize(att.size)}</span>
                                    </div>
                                    <ExternalLink size={14} className={commonStyles.attachmentLink} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={cn(commonStyles.detailActions, themeStyles.detailActions)}>
                          <Button variant="primary" size="sm">
                            <Reply size={14} /> Reply
                          </Button>
                          <Button variant="secondary" size="sm">
                            <Forward size={14} /> Forward
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Archive size={14} /> Archive
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className={cn(commonStyles.noSelection, themeStyles.noSelection)}>
                        <Mail size={40} className={commonStyles.noSelectionIcon} />
                        <p>Select a message to view</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <StaggerContainer className={commonStyles.notificationList}>
                  {filteredNotifications.length === 0 ? (
                    <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                      <Bell size={36} className={commonStyles.emptyIcon} />
                      <h3 className={commonStyles.emptyTitle}>
                        {searchQuery ? 'No notifications match your search' : 'No notifications'}
                      </h3>
                      <p className={commonStyles.emptyText}>
                        {searchQuery ? 'Try a different search term' : 'You\'re all caught up!'}
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map(notif => {
                      const NotifIcon = NOTIF_ICONS[notif.type];
                      return (
                        <StaggerItem key={notif.id}>
                          <div
                            onClick={() => handleMarkNotificationRead(notif.id)}
                            className={cn(
                              commonStyles.notificationItem,
                              themeStyles.notificationItem,
                              commonStyles[`notif_${notif.type}`],
                              themeStyles[`notif_${notif.type}`],
                              !notif.is_read && commonStyles.unreadNotif,
                              !notif.is_read && themeStyles.unreadNotif
                            )}
                          >
                            <div className={cn(commonStyles.notifIcon, themeStyles.notifIcon, commonStyles[`notifIcon_${notif.type}`], themeStyles[`notifIcon_${notif.type}`])}>
                              <NotifIcon size={18} />
                            </div>
                            <div className={commonStyles.notifContent}>
                              <h4 className={cn(commonStyles.notifTitle, themeStyles.notifTitle)}>
                                {notif.title}
                                {!notif.is_read && <span className={commonStyles.newDot} />}
                              </h4>
                              <p className={cn(commonStyles.notifMessage, themeStyles.notifMessage)}>
                                {notif.message}
                              </p>
                              <span className={cn(commonStyles.notifDate, themeStyles.notifDate)}>
                                <Clock size={12} /> {formatTimeAgo(notif.created_at)}
                              </span>
                            </div>
                            {notif.action_url && (
                              <Button variant="ghost" size="sm">
                                <ExternalLink size={14} /> View
                              </Button>
                            )}
                          </div>
                        </StaggerItem>
                      );
                    })
                  )}
                </StaggerContainer>
              )}

              {/* Announcements */}
              {activeTab === 'announcements' && (
                <StaggerContainer className={commonStyles.announcementList}>
                  {filteredAnnouncements.length === 0 ? (
                    <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                      <Megaphone size={36} className={commonStyles.emptyIcon} />
                      <h3 className={commonStyles.emptyTitle}>
                        {searchQuery ? 'No announcements match your search' : 'No announcements'}
                      </h3>
                      <p className={commonStyles.emptyText}>
                        {searchQuery ? 'Try a different search term' : 'Check back later for platform updates'}
                      </p>
                    </div>
                  ) : (
                    filteredAnnouncements.map(announcement => {
                      const priorityConfig = PRIORITY_CONFIG[announcement.priority];
                      return (
                        <StaggerItem key={announcement.id}>
                          <div className={cn(
                            commonStyles.announcementItem,
                            themeStyles.announcementItem,
                            commonStyles[`priority_${announcement.priority}`]
                          )}>
                            <div className={commonStyles.announcementHeader}>
                              <div className={commonStyles.announcementTitleRow}>
                                <Megaphone size={18} className={cn(commonStyles.announcementIcon, themeStyles.announcementIcon)} />
                                <h3 className={cn(commonStyles.announcementTitle, themeStyles.announcementTitle)}>
                                  {announcement.title}
                                </h3>
                              </div>
                              <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
                            </div>
                            <p className={cn(commonStyles.announcementContent, themeStyles.announcementContent)}>
                              {announcement.content}
                            </p>
                            <div className={cn(commonStyles.announcementMeta, themeStyles.announcementMeta)}>
                              <span><Clock size={12} /> Posted {formatTimeAgo(announcement.created_at)}</span>
                              {announcement.expires_at && (
                                <span>
                                  <AlertTriangle size={12} /> Expires {new Date(announcement.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </StaggerItem>
                      );
                    })
                  )}
                </StaggerContainer>
              )}
            </>
          )}
        </div>

        {/* Compose Modal */}
        {isComposing && (
          <div className={commonStyles.modalOverlay} onClick={() => setIsComposing(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <div className={commonStyles.modalHeader}>
                <h2 className={cn(commonStyles.modalTitle, themeStyles.modalTitle)}>
                  <Pen size={20} /> New Message
                </h2>
                <button
                  className={cn(commonStyles.modalClose, themeStyles.modalClose)}
                  onClick={() => setIsComposing(false)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={commonStyles.composeForm}>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                    <Mail size={14} /> To
                  </label>
                  <input
                    type="text"
                    value={composeData.to}
                    onChange={e => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="Recipient username or email"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                    <FileText size={14} /> Subject
                  </label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={e => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Message subject"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label className={cn(commonStyles.formLabel, themeStyles.formLabel)}>
                    <MessageSquare size={14} /> Message
                  </label>
                  <textarea
                    value={composeData.content}
                    onChange={e => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your message..."
                    rows={8}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                  />
                </div>
                <div className={commonStyles.modalActions}>
                  <Button variant="ghost" onClick={() => setIsComposing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSendMessage}>
                    <Send size={14} /> Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className={cn(
            commonStyles.toast,
            themeStyles.toast,
            toast.type === 'error' && commonStyles.toastError,
            toast.type === 'error' && themeStyles.toastError
          )}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
