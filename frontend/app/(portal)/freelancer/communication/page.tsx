// @AI-HINT: Unified communication center with messages, notifications, and announcements
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '../../../components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';
import commonStyles from './Communication.common.module.css';
import lightStyles from './Communication.light.module.css';
import darkStyles from './Communication.dark.module.css';

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

  useEffect(() => {
    setMounted(true);
    loadCommunicationData();
  }, []);

  const loadCommunicationData = async () => {
    setLoading(true);
    try {
      // Fetch real communication data from API
      const { messagesApi, notificationsApi } = await import('@/lib/api');

      const [inboxRes, sentRes, notifRes] = await Promise.all([
        (messagesApi as any).getConversations?.({ folder: 'inbox' }).catch((e: unknown) => { console.error('Inbox load failed:', e); return null; }),
        (messagesApi as any).getConversations?.({ folder: 'sent' }).catch((e: unknown) => { console.error('Sent load failed:', e); return null; }),
        (notificationsApi as any).list?.().catch((e: unknown) => { console.error('Notifications load failed:', e); return null; }),
      ]);

      // Transform API data or use defaults
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

      // Fetch announcements from API
      try {
        const { default: api } = await import('@/lib/api');
        const announcementsRes = await (api as any).announcements?.list?.().catch((e: unknown) => { console.error('Announcements load failed:', e); return null; });
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
      console.error('Failed to load communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, is_read: true } : m))
    );
  };

  const handleToggleStar = async (messageId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, is_starred: !m.is_starred } : m))
    );
  };

  const handleSendMessage = async () => {
    if (!composeData.to || !composeData.subject || !composeData.content) return;

    try {
      // await communicationCenterApi.sendMessage(composeData);
      setIsComposing(false);
      setComposeData({ to: '', subject: '', content: '' });
      // Refresh sent messages
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, is_read: true } : n))
    );
  };

  const getUnreadCount = (type: TabType) => {
    switch (type) {
      case 'inbox':
        return messages.filter(m => !m.is_read).length;
      case 'starred':
        return messages.filter(m => m.is_starred).length;
      case 'notifications':
        return notifications.filter(n => !n.is_read).length;
      default:
        return 0;
    }
  };

  const filteredMessages = messages.filter(m => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        m.subject.toLowerCase().includes(query) ||
        m.sender_name.toLowerCase().includes(query) ||
        m.preview.toLowerCase().includes(query)
      );
    }
    if (activeTab === 'starred') return m.is_starred;
    return true;
  });

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={15} className="absolute inset-0" />
        <div className="absolute top-[60%] right-[15%] opacity-10"><FloatingCube /></div>
        <div className="absolute top-[20%] left-[10%] opacity-10"><FloatingSphere /></div>
      </div>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.header, themeStyles.header)}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                Communication Center
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage all your messages, notifications, and platform announcements
              </p>
            </div>
            <Button variant="primary" onClick={() => setIsComposing(true)}>
              Compose Message
            </Button>
          </div>
        </ScrollReveal>

        {/* Search Bar */}
        <ScrollReveal delay={0.1} className={cn(commonStyles.searchBar, themeStyles.searchBar)}>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
        </ScrollReveal>

        {/* Tabs */}
        <ScrollReveal delay={0.2} className={cn(commonStyles.tabs, themeStyles.tabs)}>
          {(['inbox', 'sent', 'starred', 'notifications', 'announcements'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                commonStyles.tab,
                themeStyles.tab,
                activeTab === tab && commonStyles.tabActive,
                activeTab === tab && themeStyles.tabActive
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {getUnreadCount(tab) > 0 && (
                <span className={cn(commonStyles.badge, themeStyles.badge)}>
                  {getUnreadCount(tab)}
                </span>
              )}
            </button>
          ))}
        </ScrollReveal>

        {/* Main Content */}
        <div className={cn(commonStyles.content, themeStyles.content)}>
          {loading ? (
            <div className={commonStyles.loading}>Loading...</div>
          ) : (
            <>
              {/* Messages List */}
              {(activeTab === 'inbox' || activeTab === 'sent' || activeTab === 'starred') && (
                <div className={commonStyles.splitView}>
                  <StaggerContainer className={cn(commonStyles.messageList, themeStyles.messageList)}>
                    {filteredMessages.length === 0 ? (
                      <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                        <p>No messages found</p>
                      </div>
                    ) : (
                      filteredMessages.map(message => (
                        <StaggerItem
                          key={message.id}
                          onClick={() => {
                            setSelectedMessage(message);
                            handleMarkAsRead(message.id);
                          }}
                          className={cn(
                            commonStyles.messageItem,
                            themeStyles.messageItem,
                            !message.is_read && commonStyles.unread,
                            !message.is_read && themeStyles.unread,
                            selectedMessage?.id === message.id && commonStyles.selected,
                            selectedMessage?.id === message.id && themeStyles.selected
                          )}
                        >
                          <div className={commonStyles.messageHeader}>
                            <div className={commonStyles.senderInfo}>
                              <div className={cn(commonStyles.avatar, themeStyles.avatar)}>
                                {message.sender_name.charAt(0)}
                              </div>
                              <div>
                                <span className={cn(commonStyles.senderName, themeStyles.senderName)}>
                                  {message.sender_name}
                                </span>
                                <span className={cn(commonStyles.messageDate, themeStyles.messageDate)}>
                                  {new Date(message.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStar(message.id);
                              }}
                              className={cn(
                                commonStyles.starBtn,
                                themeStyles.starBtn,
                                message.is_starred && commonStyles.starred,
                                message.is_starred && themeStyles.starred
                              )}
                            >
                              ★
                            </button>
                          </div>
                          <h4 className={cn(commonStyles.messageSubject, themeStyles.messageSubject)}>
                            {message.subject}
                          </h4>
                          <p className={cn(commonStyles.messagePreview, themeStyles.messagePreview)}>
                            {message.preview}
                          </p>
                        </StaggerItem>
                      ))
                    )}
                  </StaggerContainer>

                  {/* Message Detail */}
                  <ScrollReveal className={cn(commonStyles.messageDetail, themeStyles.messageDetail)}>
                    {selectedMessage ? (
                      <>
                        <div className={cn(commonStyles.detailHeader, themeStyles.detailHeader)}>
                          <h2>{selectedMessage.subject}</h2>
                          <div className={commonStyles.detailMeta}>
                            <span>From: {selectedMessage.sender_name}</span>
                            <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className={cn(commonStyles.detailContent, themeStyles.detailContent)}>
                          <p>{selectedMessage.content}</p>
                        </div>
                        <div className={commonStyles.detailActions}>
                          <Button variant="primary" size="sm">Reply</Button>
                          <Button variant="secondary" size="sm">Forward</Button>
                          <Button variant="ghost" size="sm">Archive</Button>
                        </div>
                      </>
                    ) : (
                      <div className={cn(commonStyles.noSelection, themeStyles.noSelection)}>
                        <p>Select a message to view</p>
                      </div>
                    )}
                  </ScrollReveal>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <StaggerContainer className={cn(commonStyles.notificationList, themeStyles.notificationList)}>
                  {notifications.length === 0 ? (
                    <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <StaggerItem
                        key={notif.id}
                        onClick={() => handleMarkNotificationRead(notif.id)}
                        className={cn(
                          commonStyles.notificationItem,
                          themeStyles.notificationItem,
                          commonStyles[`notif${notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}`],
                          themeStyles[`notif${notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}`],
                          !notif.is_read && commonStyles.unreadNotif,
                          !notif.is_read && themeStyles.unreadNotif
                        )}
                      >
                        <div className={cn(commonStyles.notifIcon, themeStyles.notifIcon)}>
                          {notif.type === 'success' && '✓'}
                          {notif.type === 'info' && 'ℹ'}
                          {notif.type === 'warning' && '⚠'}
                          {notif.type === 'error' && '✕'}
                        </div>
                        <div className={commonStyles.notifContent}>
                          <h4 className={cn(commonStyles.notifTitle, themeStyles.notifTitle)}>
                            {notif.title}
                          </h4>
                          <p className={cn(commonStyles.notifMessage, themeStyles.notifMessage)}>
                            {notif.message}
                          </p>
                          <span className={cn(commonStyles.notifDate, themeStyles.notifDate)}>
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                        {notif.action_url && (
                          <Button variant="link" size="sm">View</Button>
                        )}
                      </StaggerItem>
                    ))
                  )}
                </StaggerContainer>
              )}

              {/* Announcements */}
              {activeTab === 'announcements' && (
                <StaggerContainer className={cn(commonStyles.announcementList, themeStyles.announcementList)}>
                  {announcements.length === 0 ? (
                    <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                      <p>No announcements</p>
                    </div>
                  ) : (
                    announcements.map(announcement => (
                      <StaggerItem
                        key={announcement.id}
                        className={cn(
                          commonStyles.announcementItem,
                          themeStyles.announcementItem,
                          commonStyles[`priority${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`],
                          themeStyles[`priority${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`]
                        )}
                      >
                        <div className={commonStyles.announcementHeader}>
                          <h3 className={cn(commonStyles.announcementTitle, themeStyles.announcementTitle)}>
                            {announcement.title}
                          </h3>
                          <span className={cn(
                            commonStyles.priorityBadge,
                            themeStyles.priorityBadge,
                            commonStyles[`badge${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`],
                            themeStyles[`badge${announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}`]
                          )}>
                            {announcement.priority}
                          </span>
                        </div>
                        <p className={cn(commonStyles.announcementContent, themeStyles.announcementContent)}>
                          {announcement.content}
                        </p>
                        <div className={cn(commonStyles.announcementMeta, themeStyles.announcementMeta)}>
                          <span>Posted: {new Date(announcement.created_at).toLocaleDateString()}</span>
                          {announcement.expires_at && (
                            <span>Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </StaggerItem>
                    ))
                  )}
                </StaggerContainer>
              )}
            </>
          )}
        </div>

        {/* Compose Modal */}
        {isComposing && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2>New Message</h2>
                <button
                  onClick={() => setIsComposing(false)}
                  className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.composeForm}>
                <div className={commonStyles.formGroup}>
                  <label>To:</label>
                  <input
                    type="text"
                    value={composeData.to}
                    onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="Recipient username or email"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label>Subject:</label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Message subject"
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label>Message:</label>
                  <textarea
                    value={composeData.content}
                    onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your message..."
                    rows={8}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                  />
                </div>
                <div className={commonStyles.modalActions}>
                  <Button variant="secondary" onClick={() => setIsComposing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSendMessage}>
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
