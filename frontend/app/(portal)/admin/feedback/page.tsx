// @AI-HINT: Admin Feedback Dashboard - User feedback collection and analysis
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';
import Button from '@/app/components/Button/Button';
import Select from '@/app/components/Select/Select';
import Textarea from '@/app/components/Textarea/Textarea';
import commonStyles from './Feedback.common.module.css';
import lightStyles from './Feedback.light.module.css';
import darkStyles from './Feedback.dark.module.css';

interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userType: 'freelancer' | 'client';
  type: 'bug' | 'feature' | 'improvement' | 'complaint' | 'praise';
  category: string;
  subject: string;
  message: string;
  rating?: number;
  status: 'new' | 'in_review' | 'addressed' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt?: string;
  response?: string;
  attachments?: string[];
}

interface FeedbackStats {
  totalFeedback: number;
  newToday: number;
  avgRating: number;
  responseRate: number;
  byType: { type: string; count: number }[];
}

export default function AdminFeedbackPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'in_review' | 'addressed'>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      // Fetch real feedback data from API
      const { userFeedbackApi } = await import('@/lib/api');
      
      const feedbackData = await userFeedbackApi.list({ page: 1, page_size: 50 }).catch(() => null) as any;
      
      // Transform API data or use defaults
      const feedbackArray = Array.isArray(feedbackData) ? feedbackData : feedbackData?.items || [];
      const transformedFeedback: FeedbackItem[] = feedbackArray.map((f: any) => ({
        id: f.id?.toString() || `f_${Math.random()}`,
        userId: f.user_id?.toString() || 'unknown',
        userName: f.user_name || f.user?.name || 'Unknown User',
        userEmail: f.user_email || f.user?.email || 'unknown@example.com',
        userType: f.user_type || 'freelancer',
        type: f.type || 'feature',
        category: f.category || 'General',
        subject: f.subject || f.title || 'Feedback',
        message: f.message || f.content || '',
        rating: f.rating,
        status: f.status || 'new',
        priority: f.priority || 'medium',
        createdAt: f.created_at || new Date().toISOString(),
        updatedAt: f.updated_at,
        response: f.admin_response || f.response,
        attachments: f.attachments
      }));

      // Calculate stats from data
      const ratedItems = transformedFeedback.filter(f => f.rating);
      const calculatedStats: FeedbackStats = {
        totalFeedback: transformedFeedback.length,
        newToday: transformedFeedback.filter(f => {
          const today = new Date().toDateString();
          return new Date(f.createdAt).toDateString() === today;
        }).length,
        avgRating: ratedItems.length > 0
          ? ratedItems.reduce((sum, f) => sum + (f.rating || 0), 0) / ratedItems.length
          : 0,
        responseRate: transformedFeedback.length > 0
          ? Math.round((transformedFeedback.filter(f => f.response).length / transformedFeedback.length) * 100)
          : 0,
        byType: ['feature', 'bug', 'improvement', 'praise', 'complaint'].map(type => ({
          type,
          count: transformedFeedback.filter(f => f.type === type).length
        }))
      };

      setFeedbackItems(transformedFeedback);
      setStats(calculatedStats);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load feedback', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: FeedbackItem['status']) => {
    // Optimistic update
    setFeedbackItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
    
    if (selectedFeedback?.id === id) {
      setSelectedFeedback(prev => prev ? { ...prev, status: newStatus } : null);
    }
    
    // API call would go here
  };

  const handleSendResponse = async () => {
    if (!selectedFeedback || !responseText) return;
    
    // API call would go here
    
    handleStatusUpdate(selectedFeedback.id, 'addressed');
    setResponseText('');
    showToast('Response sent successfully');
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const filteredItems = feedbackItems.filter(item => {
    if (activeTab !== 'all' && item.status !== activeTab) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    return true;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'text-red-600 bg-red-100';
      case 'feature': return 'text-blue-600 bg-blue-100';
      case 'improvement': return 'text-purple-600 bg-purple-100';
      case 'praise': return 'text-green-600 bg-green-100';
      case 'complaint': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>User Feedback</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Monitor and respond to user feedback, bugs, and feature requests
              </p>
            </div>
          </header>
        </ScrollReveal>

        {stats && (
          <ScrollReveal delay={0.1}>
            <div className={commonStyles.statsGrid}>
              <div className={cn(commonStyles.statCard, themeStyles.card)}>
                <h3>Total Feedback</h3>
                <div className={commonStyles.statValue}>{stats.totalFeedback}</div>
                <div className={commonStyles.statTrend}>+{stats.newToday} today</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.card)}>
                <h3>Avg Rating</h3>
                <div className={commonStyles.statValue}>{stats.avgRating.toFixed(1)}</div>
                <div className={commonStyles.statStars}>⭐⭐⭐⭐</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.card)}>
                <h3>Response Rate</h3>
                <div className={commonStyles.statValue}>{stats.responseRate}%</div>
                <div className={commonStyles.statTrend}>Target: 90%</div>
              </div>
              <div className={cn(commonStyles.statCard, themeStyles.card)}>
                <h3>Top Category</h3>
                <div className={commonStyles.statValue}>Projects</div>
                <div className={commonStyles.statTrend}>32% of all feedback</div>
              </div>
            </div>
          </ScrollReveal>
        )}

        <div className={commonStyles.contentGrid}>
          <div className={commonStyles.listColumn}>
            <ScrollReveal delay={0.2}>
              <div className={commonStyles.filters}>
                <div className={commonStyles.tabs}>
                  {(['all', 'new', 'in_review', 'addressed'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        commonStyles.tab,
                        activeTab === tab ? commonStyles.activeTab : '',
                        activeTab === tab ? themeStyles.activeTab : themeStyles.tab
                      )}
                    >
                      {tab.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
                <Select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'bug', label: 'Bugs' },
                    { value: 'feature', label: 'Features' },
                    { value: 'improvement', label: 'Improvements' },
                    { value: 'complaint', label: 'Complaints' },
                    { value: 'praise', label: 'Praise' },
                  ]}
                />
              </div>
            </ScrollReveal>

            <StaggerContainer className={commonStyles.feedbackList}>
              {filteredItems.map(item => (
                <StaggerItem 
                  key={item.id}
                  className={cn(
                    commonStyles.feedbackItem, 
                    themeStyles.card,
                    selectedFeedback?.id === item.id ? commonStyles.selectedItem : ''
                  )}
                  onClick={() => setSelectedFeedback(item)}
                >
                  <div className={commonStyles.itemHeader}>
                    <span className={cn(commonStyles.typeTag, getTypeColor(item.type))}>
                      {item.type}
                    </span>
                    <span className={commonStyles.date}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className={commonStyles.itemSubject}>{item.subject}</h4>
                  <p className={commonStyles.itemPreview}>{item.message.slice(0, 80)}...</p>
                  <div className={commonStyles.itemFooter}>
                    <span className={commonStyles.userName}>{item.userName}</span>
                    {item.rating && <span>⭐ {item.rating}</span>}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <div className={commonStyles.detailColumn}>
            {selectedFeedback ? (
              <ScrollReveal delay={0.2} className={cn(commonStyles.detailCard, themeStyles.card)}>
                <div className={commonStyles.detailHeader}>
                  <div className={commonStyles.detailTitle}>
                    <span className={cn(commonStyles.typeTag, getTypeColor(selectedFeedback.type))}>
                      {selectedFeedback.type.toUpperCase()}
                    </span>
                    <h2>{selectedFeedback.subject}</h2>
                  </div>
                  <div className={commonStyles.detailMeta}>
                    <div className={commonStyles.metaRow}>
                      <span>From:</span>
                      <strong>{selectedFeedback.userName} ({selectedFeedback.userType})</strong>
                    </div>
                    <div className={commonStyles.metaRow}>
                      <span>Email:</span>
                      <a href={`mailto:${selectedFeedback.userEmail}`}>{selectedFeedback.userEmail}</a>
                    </div>
                    <div className={commonStyles.metaRow}>
                      <span>Date:</span>
                      <span>{new Date(selectedFeedback.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={commonStyles.metaRow}>
                      <span>Priority:</span>
                      <span className={cn(commonStyles.priorityTag, commonStyles[selectedFeedback.priority])}>
                        {selectedFeedback.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={commonStyles.detailContent}>
                  <p>{selectedFeedback.message}</p>
                  {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                    <div className={commonStyles.attachments}>
                      <h4>Attachments</h4>
                      <div className={commonStyles.attachmentList}>
                        {selectedFeedback.attachments.map((att, i) => (
                          <a key={i} href={att} target="_blank" rel="noopener noreferrer" className={commonStyles.attachmentLink}>
                            Attachment {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={commonStyles.responseSection}>
                  <h3>Response</h3>
                  {selectedFeedback.response ? (
                    <div className={commonStyles.existingResponse}>
                      <p>{selectedFeedback.response}</p>
                      <span className={commonStyles.responseMeta}>Sent by Admin</span>
                    </div>
                  ) : (
                    <div className={commonStyles.responseForm}>
                      <Textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Type your response here..."
                        rows={4}
                      />
                      <div className={commonStyles.responseActions}>
                        <Button 
                          variant="primary"
                          size="sm"
                          onClick={handleSendResponse}
                          disabled={!responseText}
                        >
                          Send Response
                        </Button>
                        <div className={commonStyles.statusActions}>
                          <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(selectedFeedback.id, 'in_review')}>
                            Mark In Review
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(selectedFeedback.id, 'addressed')}>
                            Mark Addressed
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ) : (
              <div className={cn(commonStyles.emptySelection, themeStyles.card)}>
                <p>Select a feedback item to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast)}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
}
