// @AI-HINT: Enterprise client reviews — rating analytics, sentiment, reply system, review templates, bulk management
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import Skeleton from '@/app/components/Animations/Skeleton/Skeleton';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import StarRating from '@/app/components/StarRating/StarRating';
import UserAvatar from '@/app/components/UserAvatar/UserAvatar';
import Textarea from '@/app/components/Textarea/Textarea';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import api from '@/lib/api';
import common from './Reviews.common.module.css';
import light from './Reviews.light.module.css';
import dark from './Reviews.dark.module.css';
import { Search, Star, MessageSquare, TrendingUp, ThumbsUp, ThumbsDown,
  BarChart3, Filter, Download, ChevronDown, ChevronUp, Send,
  Clock, Award, AlertCircle, CheckCircle, Flag, Bookmark, Edit,
  Copy, MoreHorizontal, ArrowUpRight, Eye, Reply, Smile, Meh, Frown,
  XCircle, AlertTriangle, FileText
} from 'lucide-react';

type TabKey = 'all' | 'analytics' | 'write';

interface Review {
  avatarUrl?: string;
  id: string;
  project: string;
  freelancer: string;
  created: string;
  rating: number;
  text: string;
  response?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  helpful?: number;
  flagged?: boolean;
  verified?: boolean;
  canEdit?: boolean;
  canAppeal?: boolean;
  detailedRatings?: { communication: number; quality: number; delivery: number; professionalism: number };
  appealed?: boolean;
  anonymous?: boolean;
}

const TEMPLATES = [
  { label: 'Excellent Work', text: 'Outstanding quality work! Delivered on time with excellent communication throughout the project. Would highly recommend and will definitely work together again.' },
  { label: 'Good Communication', text: 'Great communicator who kept me updated regularly. The deliverables met expectations and the collaboration was smooth and professional.' },
  { label: 'Fast Delivery', text: 'Impressively fast turnaround without sacrificing quality. Very responsive and proactive in addressing requirements. Excellent experience overall.' },
  { label: 'Technical Expert', text: 'Demonstrated deep technical expertise. Solved complex challenges efficiently and provided valuable suggestions that improved the final outcome.' },
];

const REPLY_TEMPLATES = [
  { label: 'Thank You', text: 'Thank you so much for the kind feedback! We truly appreciated working with you and look forward to our next collaboration.' },
  { label: 'Address Concerns', text: 'We appreciate your feedback. We\'d like to understand more about the concerns you mentioned. Please let us know how we can improve for future projects.' },
  { label: 'Request Modification', text: 'Thank you for the review. We believe this rating doesn\'t fully reflect the quality of our work. We\'d be happy to discuss this further.' },
  { label: 'Professional Response', text: 'We appreciate your detailed feedback. Your points are valuable and we\'ll use them to enhance the quality of our future deliverables.' },
];

const Reviews: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { reviews, loading, error } = useClientData();

  const rows: Review[] = useMemo(() => {
    if (!Array.isArray(reviews)) return [];
    return (reviews as any[]).map((r, idx) => {
      const createdDate = new Date(r.created_at ?? r.date ?? r.createdAt ?? r.created ?? '');
      const daysAgo = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const canEdit = daysAgo <= 7; // Can edit within 7 days
      const canAppeal = Number(r.rating) <= 2 && !r.appealed; // Can appeal 1-2 star reviews

      return {
        id: String(r.id ?? idx),
        project: r.project_title ?? r.projectTitle ?? r.project ?? 'Unknown Project',
        freelancer: r.reviewed_user_name ?? r.freelancerName ?? r.freelancer ?? 'Unknown',
        avatarUrl: r.avatarUrl ?? '',
        created: r.created_at ?? r.date ?? r.createdAt ?? r.created ?? '',
        rating: Number(r.rating) || 0,
        text: r.review_text ?? r.comment ?? r.text ?? '',
        response: r.response ?? r.reply ?? '',
        sentiment: Number(r.rating) >= 4 ? 'positive' : Number(r.rating) >= 3 ? 'neutral' : 'negative',
        helpful: r.helpful_count ?? r.helpful ?? 0,
        flagged: r.flagged ?? false,
        verified: r.verified ?? r.status === 'completed',
        canEdit,
        canAppeal,
        detailedRatings: r.detailedRatings || {
          communication: Number(r.rating),
          quality: Number(r.rating),
          delivery: Number(r.rating),
          professionalism: Number(r.rating),
        },
        appealed: r.appealed ?? false,
        anonymous: r.anonymous ?? false,
      };
    });
  }, [reviews]);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // Filters
  const [query, setQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Review form
  const [showEditor, setShowEditor] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState('');
  const [formContract, setFormContract] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [contracts, setContracts] = useState<any[]>([]);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Edit modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);

  // Appeal modal
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('');

  // Anonymous option
  const [formAnonymous, setFormAnonymous] = useState(false);

  // Selected (bulk)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Load eligible contracts
  useEffect(() => {
    if (activeTab !== 'write') return;
    (async () => {
      try {
        const [meRes, revRes, conRes] = await Promise.all([
          api.auth.me(),
          api.reviews.list({ page: 1, page_size: 100 }),
          api.contracts.list({ status: 'completed' }),
        ]);
        const revData = revRes as any;
        const conData = conRes as any;
        const existing = new Set(
          (revData?.data?.items ?? revData?.items ?? []).map((r: any) => String(r.contract_id))
        );
        const eligible = (conData?.data?.items ?? conData?.items ?? (Array.isArray(conData) ? conData : [])).filter(
          (c: any) => !existing.has(String(c.id))
        );
        setContracts(eligible);
      } catch { /* graceful fallback */ }
    })();
  }, [activeTab]);

  // Analytics
  const analytics = useMemo(() => {
    if (rows.length === 0) return null;
    const total = rows.length;
    const avg = rows.reduce((s, r) => s + r.rating, 0) / total;
    const dist = [0, 0, 0, 0, 0];
    let positive = 0, neutral = 0, negative = 0;
    let responded = 0;
    rows.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
      if (r.sentiment === 'positive') positive++;
      else if (r.sentiment === 'neutral') neutral++;
      else negative++;
      if (r.response) responded++;
    });
    const maxDist = Math.max(...dist, 1);
    return {
      total, avg, dist, maxDist, positive, neutral, negative,
      responded, responseRate: Math.round((responded / total) * 100)
    };
  }, [rows]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    let result = [...rows];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(r =>
        r.text.toLowerCase().includes(q) ||
        r.freelancer.toLowerCase().includes(q) ||
        r.project.toLowerCase().includes(q)
      );
    }
    if (ratingFilter !== 'All') {
      result = result.filter(r => r.rating === ratingFilter);
    }
    if (sentimentFilter !== 'all') {
      result = result.filter(r => r.sentiment === sentimentFilter);
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.created).getTime() - new Date(b.created).getTime();
      else if (sortBy === 'rating') cmp = a.rating - b.rating;
      else if (sortBy === 'freelancer') cmp = a.freelancer.localeCompare(b.freelancer);
      else if (sortBy === 'helpful') cmp = (a.helpful || 0) - (b.helpful || 0);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [rows, query, ratingFilter, sentimentFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = useCallback((key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  }, [sortBy]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map(r => r.id)));
  };

  const handleSubmit = async () => {
    if (!formContract || formRating === 0 || !formText.trim()) return;
    setSubmitting(true);
    setSubmitMessage('');
    try {
      const contract = contracts.find((c: any) => String(c.id) === formContract);
      const reviewedUserId = contract?.freelancer_id || contract?.other_party_id || contract?.reviewed_user_id || 0;

      await api.reviews.create({
        contract_id: Number(formContract),
        reviewed_user_id: Number(reviewedUserId),
        rating: formRating,
        review_text: formText.trim(),
        is_public: !formAnonymous,
      });
      setSubmitMessage('Review submitted successfully!');
      setFormRating(0);
      setFormText('');
      setFormContract('');
      setFormAnonymous(false);
    } catch {
      setSubmitMessage('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = async (reviewId: string) => {
    if (!editText.trim() || editRating === 0) return;
    setSubmitting(true);
    try {
      // Delete old review and create new one
      await api.reviews.delete(reviewId);
      await api.reviews.create({
        contract_id: 0, // Will be set from context in real implementation
        reviewed_user_id: 0, // Will be set from context
        rating: editRating,
        review_text: editText.trim(),
        is_public: true,
      });
      setEditingId(null);
      setEditText('');
      setEditRating(0);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update review:', err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppealReview = async (reviewId: string) => {
    if (!appealReason.trim()) return;
    setSubmitting(true);
    try {
      // Appeal functionality would go here
      // await api.reviews.appeal(reviewId, { reason: appealReason });
      setAppealingId(null);
      setAppealReason('');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to submit appeal:', err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const header = 'Date,Freelancer,Project,Rating,Review,Sentiment\n';
    const csvRows = filtered.map(r =>
      `${r.created},"${r.freelancer}","${r.project}",${r.rating},"${r.text.replace(/"/g, '""')}",${r.sentiment || ''}`
    ).join('\n');
    const blob = new Blob([header + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSentimentIcon = (s?: string) => {
    if (s === 'positive') return <Smile size={14} />;
    if (s === 'negative') return <Frown size={14} />;
    return <Meh size={14} />;
  };

  const getSentimentVariant = (s?: string): 'success' | 'warning' | 'danger' => {
    if (s === 'positive') return 'success';
    if (s === 'negative') return 'danger';
    return 'warning';
  };

  // Loading skeleton
  if (loading) {
    return (
      <PageTransition>
        <div className={cn(common.container, themed.container)}>
          <Skeleton width="280px" height="32px" />
          <div className={common.statsRow}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} width="100%" height="90px" radius="12px" />
            ))}
          </div>
          <Skeleton width="100%" height="400px" radius="12px" />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className={cn(common.container, themed.container)}>
          <div className={cn(common.errorBanner, themed.errorBanner)}>
            <AlertCircle size={20} />
            <span>Failed to load reviews.</span>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'all', label: 'All Reviews', icon: <MessageSquare size={16} />, count: rows.length },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
    { key: 'write', label: 'Write Review', icon: <Send size={16} /> },
  ];

  return (
    <PageTransition>
      <div className={cn(common.container, themed.container)}>
        {/* Header */}
        <div className={cn(common.header, themed.header)}>
          <div className={common.headerContent}>
            <h1 className={cn(common.title, themed.title)}>
              <Star size={28} /> Reviews & Feedback
            </h1>
            <p className={cn(common.subtitle, themed.subtitle)}>
              Manage reviews, track sentiment, and maintain your reputation
            </p>
          </div>
          <div className={common.headerActions}>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download size={16} /> Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => setActiveTab('write')}>
              <Send size={16} /> Write Review
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {analytics && (
          <ScrollReveal>
            <div className={common.statsRow}>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statIcon, common.iconPrimary)}><MessageSquare size={20} /></div>
                <div className={common.statInfo}>
                  <span className={cn(common.statLabel, themed.statLabel)}>Total Reviews</span>
                  <span className={cn(common.statValue, themed.statValue)}>{analytics.total}</span>
                </div>
              </div>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statIcon, common.iconStar)}><Star size={20} /></div>
                <div className={common.statInfo}>
                  <span className={cn(common.statLabel, themed.statLabel)}>Average Rating</span>
                  <span className={cn(common.statValue, themed.statValue)}>{analytics.avg.toFixed(1)}</span>
                </div>
              </div>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statIcon, common.iconPositive)}><ThumbsUp size={20} /></div>
                <div className={common.statInfo}>
                  <span className={cn(common.statLabel, themed.statLabel)}>Positive</span>
                  <span className={cn(common.statValue, themed.statValue)}>
                    {analytics.total > 0 ? Math.round((analytics.positive / analytics.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className={cn(common.statCard, themed.statCard)}>
                <div className={cn(common.statIcon, common.iconReply)}><Reply size={20} /></div>
                <div className={common.statInfo}>
                  <span className={cn(common.statLabel, themed.statLabel)}>Response Rate</span>
                  <span className={cn(common.statValue, themed.statValue)}>{analytics.responseRate}%</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Tab Navigation */}
        <div className={cn(common.tabBar, themed.tabBar)}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={cn(common.tabBtn, themed.tabBtn,
                activeTab === tab.key && cn(common.tabBtnActive, themed.tabBtnActive))}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
              {tab.count !== undefined && (
                <span className={cn(common.tabCount, themed.tabCount)}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ===== ALL REVIEWS TAB ===== */}
        {activeTab === 'all' && (
          <StaggerContainer staggerDelay={0.06}>
            {/* Toolbar */}
            <div className={common.toolbar}>
              <div className={common.searchRow}>
                <div className={common.searchWrap}>
                  <Search size={16} className={common.searchIcon} />
                  <Input
                    placeholder="Search reviews, freelancers, projects..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  />
                </div>
                <button
                  className={cn(common.filterToggle, themed.filterToggle,
                    showFilters && common.filterToggleActive)}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} /> Filters
                  {(ratingFilter !== 'All' || sentimentFilter !== 'all') && (
                    <span className={common.filterBadge}>!</span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className={cn(common.advancedFilters, themed.advancedFilters)}>
                  <div className={common.filterGroup}>
                    <label className={cn(common.filterLabel, themed.filterLabel)}>Rating</label>
                    <div className={common.ratingBtns}>
                      <button
                        className={cn(common.ratingBtn, themed.ratingBtn,
                          ratingFilter === 'All' && cn(common.ratingBtnActive, themed.ratingBtnActive))}
                        onClick={() => { setRatingFilter('All'); setPage(1); }}
                      >All</button>
                      {[5, 4, 3, 2, 1].map(n => (
                        <button
                          key={n}
                          className={cn(common.ratingBtn, themed.ratingBtn,
                            ratingFilter === n && cn(common.ratingBtnActive, themed.ratingBtnActive))}
                          onClick={() => { setRatingFilter(n); setPage(1); }}
                        >
                          {n} <Star size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={common.filterGroup}>
                    <label className={cn(common.filterLabel, themed.filterLabel)}>Sentiment</label>
                    <Select
                      value={sentimentFilter}
                      onChange={(e) => { setSentimentFilter(e.target.value); setPage(1); }}
                      options={[
                        { value: 'all', label: 'All Sentiment' },
                        { value: 'positive', label: '😊 Positive' },
                        { value: 'neutral', label: '😐 Neutral' },
                        { value: 'negative', label: '😞 Negative' },
                      ]}
                    />
                  </div>
                  <div className={common.filterGroup}>
                    <label className={cn(common.filterLabel, themed.filterLabel)}>Sort By</label>
                    <div className={common.sortGroup}>
                      <Select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                        options={[
                          { value: 'date', label: 'Date' },
                          { value: 'rating', label: 'Rating' },
                          { value: 'freelancer', label: 'Freelancer' },
                          { value: 'helpful', label: 'Most Helpful' },
                        ]}
                      />
                      <button
                        className={cn(common.sortDirBtn, themed.sortDirBtn)}
                        onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                      >
                        {sortDir === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk Actions */}
              {selected.size > 0 && (
                <div className={cn(common.bulkBar, themed.bulkBar)}>
                  <span>{selected.size} selected</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
                  <Button variant="outline" size="sm"><Flag size={14} /> Flag</Button>
                  <Button variant="outline" size="sm"><Download size={14} /> Export Selected</Button>
                </div>
              )}

              {/* Edit Modal */}
              {editingId && (
                <div className={common.modalOverlay}>
                  <div className={cn(common.modal, themed.modal)}>
                    <div className={common.modalHeader}>
                      <h2>Edit Review</h2>
                      <button onClick={() => { setEditingId(null); setEditText(''); setEditRating(0); }} className={common.closeBtn}>
                        <XCircle size={20} />
                      </button>
                    </div>
                    <div className={common.modalBody}>
                      <div className={common.formGroup}>
                        <label className={cn(common.filterLabel, themed.filterLabel)}>Rating</label>
                        <div className={common.ratingSelector}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              className={cn(common.ratingStar, themed.ratingStar,
                                n <= editRating && cn(common.ratingStarActive, themed.ratingStarActive))}
                              onClick={() => setEditRating(n)}
                            >
                              <Star size={24} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={common.formGroup}>
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="Edit your review..."
                          rows={4}
                        />
                        <span className={cn(common.charCount, themed.charCount)}>
                          {editText.length}/500
                        </span>
                      </div>
                    </div>
                    <div className={common.modalFooter}>
                      <Button variant="ghost" onClick={() => { setEditingId(null); setEditText(''); setEditRating(0); }}>Cancel</Button>
                      <Button variant="primary" isLoading={submitting} onClick={() => handleEditReview(editingId)}>Save Changes</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appeal Modal */}
              {appealingId && (
                <div className={common.modalOverlay}>
                  <div className={cn(common.modal, themed.modal)}>
                    <div className={common.modalHeader}>
                      <h2>Appeal Review</h2>
                      <button onClick={() => { setAppealingId(null); setAppealReason(''); }} className={common.closeBtn}>
                        <XCircle size={20} />
                      </button>
                    </div>
                    <div className={common.modalBody}>
                      <p className={common.modalDescription}>
                        Please explain why you believe this review should be reconsidered.
                      </p>
                      <div className={common.formGroup}>
                        <Textarea
                          value={appealReason}
                          onChange={(e) => setAppealReason(e.target.value)}
                          placeholder="Explain your appeal..."
                          rows={5}
                        />
                      </div>
                    </div>
                    <div className={common.modalFooter}>
                      <Button variant="ghost" onClick={() => { setAppealingId(null); setAppealReason(''); }}>Cancel</Button>
                      <Button variant="primary" isLoading={submitting} onClick={() => handleAppealReview(appealingId)}>Submit Appeal</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Result count */}
            <div className={common.resultBar}>
              <label className={cn(common.selectAll, themed.selectAll)}>
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && selected.size === paginated.length}
                  onChange={selectAll}
                />
                Select all
              </label>
              <span className={cn(common.resultCount, themed.resultCount)}>
                {filtered.length} review{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Reviews List */}
            <div className={common.reviewsList}>
              {paginated.map(review => (
                <div key={review.id} className={cn(common.reviewCard, themed.reviewCard,
                  selected.has(review.id) && common.reviewCardSelected)}>
                  <div className={common.reviewSelect}>
                    <input
                      type="checkbox"
                      checked={selected.has(review.id)}
                      onChange={() => toggleSelect(review.id)}
                    />
                  </div>
                  <div className={common.reviewMain}>
                    <div className={common.reviewHeader}>
                      <UserAvatar name={review.freelancer} src={review.avatarUrl} size={40} />
                      <div className={common.reviewMeta}>
                        <span className={cn(common.reviewFreelancer, themed.reviewFreelancer)}>
                          {review.anonymous ? 'Anonymous User' : review.freelancer}
                        </span>
                        <span className={cn(common.reviewProject, themed.reviewProject)}>
                          {review.project}
                        </span>
                      </div>
                      <div className={common.reviewRight}>
                        {review.verified && <span className={common.verifiedBadge}><CheckCircle size={14} /> Verified</span>}
                        <StarRating rating={review.rating} size="sm" />
                        <Badge variant={getSentimentVariant(review.sentiment)}>
                          {getSentimentIcon(review.sentiment)} {review.sentiment}
                        </Badge>
                      </div>
                    </div>

                    {/* Detailed Ratings */}
                    {review.detailedRatings && (
                      <div className={common.detailedRatings}>
                        <div className={common.ratingCategory}>
                          <span>Communication:</span>
                          <span className={common.ratingValue}>{review.detailedRatings.communication}/5</span>
                        </div>
                        <div className={common.ratingCategory}>
                          <span>Quality:</span>
                          <span className={common.ratingValue}>{review.detailedRatings.quality}/5</span>
                        </div>
                        <div className={common.ratingCategory}>
                          <span>Delivery:</span>
                          <span className={common.ratingValue}>{review.detailedRatings.delivery}/5</span>
                        </div>
                        <div className={common.ratingCategory}>
                          <span>Professionalism:</span>
                          <span className={common.ratingValue}>{review.detailedRatings.professionalism}/5</span>
                        </div>
                      </div>
                    )}

                    <p className={cn(common.reviewText, themed.reviewText)}>{review.text}</p>

                    {/* Response */}
                    {review.response && (
                      <div className={cn(common.responseBlock, themed.responseBlock)}>
                        <Reply size={14} />
                        <span className={cn(common.responseText, themed.responseText)}>
                          {review.response}
                        </span>
                      </div>
                    )}

                    {/* Reply Input */}
                    {replyingTo === review.id && (
                      <div className={common.replyForm}>
                        <div className={common.templateSection}>
                          <label className={cn(common.filterLabel, themed.filterLabel)}>Quick Reply Templates</label>
                          <div className={common.templateGrid}>
                            {REPLY_TEMPLATES.map((tmpl, i) => (
                              <button
                                key={i}
                                className={cn(common.templateBtn, themed.templateBtn)}
                                onClick={() => setReplyText(tmpl.text)}
                              >
                                <Copy size={12} /> {tmpl.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your response..."
                          rows={2}
                        />
                        <span className={cn(common.charCount, themed.charCount)}>
                          {replyText.length}/500
                        </span>
                        <div className={common.replyActions}>
                          <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Button>
                          <Button variant="primary" size="sm" disabled={!replyText.trim() || replyText.length > 500}>
                            <Send size={14} /> Send Reply
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className={common.reviewFooter}>
                      <span className={cn(common.reviewDate, themed.reviewDate)}>
                        <Clock size={13} />
                        {new Date(review.created).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                      <div className={common.reviewActions}>
                        {review.canEdit && !editingId && (
                          <button
                            className={cn(common.actionBtn, themed.actionBtn)}
                            onClick={() => { setEditingId(review.id); setEditText(review.text); setEditRating(review.rating); }}
                            title="Edit review"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {review.canAppeal && (
                          <button
                            className={cn(common.actionBtn, themed.actionBtn)}
                            onClick={() => setAppealingId(review.id)}
                            title="Appeal review"
                          >
                            <AlertTriangle size={14} />
                          </button>
                        )}
                        <button
                          className={cn(common.actionBtn, themed.actionBtn)}
                          onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                          title="Reply"
                        >
                          <Reply size={14} />
                        </button>
                        <button className={cn(common.actionBtn, themed.actionBtn)} title="Helpful">
                          <ThumbsUp size={14} />
                          {review.helpful ? <span>{review.helpful}</span> : null}
                        </button>
                        <button className={cn(common.actionBtn, themed.actionBtn)} title="Flag">
                          <Flag size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className={cn(common.emptyText, themed.emptyText)}>
                  {query || ratingFilter !== 'All' ? 'No matching reviews' : 'No reviews yet'}
                </p>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={common.pagination}>
                <span className={cn(common.pageInfo, themed.pageInfo)}>
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </span>
                <div className={common.pageNumbers}>
                  <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let n: number;
                    if (totalPages <= 7) n = i + 1;
                    else if (page <= 4) n = i + 1;
                    else if (page >= totalPages - 3) n = totalPages - 6 + i;
                    else n = page - 3 + i;
                    return (
                      <button
                        key={n}
                        className={cn(common.pageNum, themed.pageNum,
                          page === n && cn(common.pageNumActive, themed.pageNumActive))}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    );
                  })}
                  <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </StaggerContainer>
        )}

        {/* ===== ANALYTICS TAB ===== */}
        {activeTab === 'analytics' && analytics && (
          <StaggerContainer staggerDelay={0.08}>
            <div className={common.analyticsGrid}>
              {/* Rating Distribution */}
              <div className={cn(common.analyticsCard, themed.analyticsCard)}>
                <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>
                  <BarChart3 size={18} /> Rating Distribution
                </h3>
                <div className={common.distChart}>
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className={common.distRow}>
                      <span className={cn(common.distLabel, themed.distLabel)}>{star} <Star size={12} /></span>
                      <div className={cn(common.distBarWrap, themed.distBarWrap)}>
                        <div
                          className={cn(common.distBar, themed.distBar)}
                          style={{ width: `${(analytics.dist[star - 1] / analytics.maxDist) * 100}%` }}
                        />
                      </div>
                      <span className={cn(common.distCount, themed.distCount)}>{analytics.dist[star - 1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment Overview */}
              <div className={cn(common.analyticsCard, themed.analyticsCard)}>
                <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>
                  <Smile size={18} /> Sentiment Overview
                </h3>
                <div className={common.sentimentChart}>
                  <div className={common.sentimentItem}>
                    <div className={cn(common.sentimentCircle, common.sentimentPositive)}>
                      <Smile size={20} />
                    </div>
                    <span className={cn(common.sentimentLabel, themed.sentimentLabel)}>Positive</span>
                    <span className={cn(common.sentimentValue, themed.sentimentValue)}>
                      {analytics.positive} ({analytics.total > 0 ? Math.round((analytics.positive / analytics.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className={common.sentimentItem}>
                    <div className={cn(common.sentimentCircle, common.sentimentNeutral)}>
                      <Meh size={20} />
                    </div>
                    <span className={cn(common.sentimentLabel, themed.sentimentLabel)}>Neutral</span>
                    <span className={cn(common.sentimentValue, themed.sentimentValue)}>
                      {analytics.neutral} ({analytics.total > 0 ? Math.round((analytics.neutral / analytics.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className={common.sentimentItem}>
                    <div className={cn(common.sentimentCircle, common.sentimentNegative)}>
                      <Frown size={20} />
                    </div>
                    <span className={cn(common.sentimentLabel, themed.sentimentLabel)}>Negative</span>
                    <span className={cn(common.sentimentValue, themed.sentimentValue)}>
                      {analytics.negative} ({analytics.total > 0 ? Math.round((analytics.negative / analytics.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                {/* Sentiment bar */}
                <div className={common.sentimentBar}>
                  {analytics.positive > 0 && (
                    <div className={common.sentBarPositive} style={{ flex: analytics.positive }} />
                  )}
                  {analytics.neutral > 0 && (
                    <div className={common.sentBarNeutral} style={{ flex: analytics.neutral }} />
                  )}
                  {analytics.negative > 0 && (
                    <div className={common.sentBarNegative} style={{ flex: analytics.negative }} />
                  )}
                </div>
              </div>

              {/* Response Stats */}
              <div className={cn(common.analyticsCard, themed.analyticsCard, common.analyticsWide)}>
                <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>
                  <TrendingUp size={18} /> Key Metrics
                </h3>
                <div className={common.metricsGrid}>
                  <div className={cn(common.metricItem, themed.metricItem)}>
                    <span className={cn(common.metricValue, themed.metricValue)}>{analytics.avg.toFixed(2)}</span>
                    <span className={cn(common.metricLabel, themed.metricLabel)}>Average Rating</span>
                  </div>
                  <div className={cn(common.metricItem, themed.metricItem)}>
                    <span className={cn(common.metricValue, themed.metricValue)}>{analytics.responseRate}%</span>
                    <span className={cn(common.metricLabel, themed.metricLabel)}>Response Rate</span>
                  </div>
                  <div className={cn(common.metricItem, themed.metricItem)}>
                    <span className={cn(common.metricValue, themed.metricValue)}>{analytics.responded}</span>
                    <span className={cn(common.metricLabel, themed.metricLabel)}>Replies Given</span>
                  </div>
                  <div className={cn(common.metricItem, themed.metricItem)}>
                    <span className={cn(common.metricValue, themed.metricValue)}>
                      {rows.filter(r => r.rating === 5).length}
                    </span>
                    <span className={cn(common.metricLabel, themed.metricLabel)}>5-Star Reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </StaggerContainer>
        )}

        {/* ===== WRITE REVIEW TAB ===== */}
        {activeTab === 'write' && (
          <ScrollReveal>
            <div className={cn(common.editorPanel, themed.editorPanel)}>
              <h3 className={cn(common.sectionTitle, themed.sectionTitle)}>
                <Send size={18} /> Write a Review
              </h3>

              {/* Templates */}
              <div className={common.templateSection}>
                <label className={cn(common.filterLabel, themed.filterLabel)}>Quick Templates</label>
                <div className={common.templateGrid}>
                  {TEMPLATES.map((tmpl, i) => (
                    <button
                      key={i}
                      className={cn(common.templateBtn, themed.templateBtn)}
                      onClick={() => setFormText(tmpl.text)}
                    >
                      <Copy size={14} /> {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contract Select */}
              <div className={common.formGroup}>
                <Select
                  value={formContract}
                  onChange={(e) => setFormContract(e.target.value)}
                  options={[
                    { value: '', label: 'Select a completed contract...' },
                    ...contracts.map((c: any) => ({
                      value: String(c.id),
                      label: c.title || `Contract #${c.id}`,
                    })),
                  ]}
                />
              </div>

              {/* Rating */}
              <div className={common.formGroup}>
                <label className={cn(common.filterLabel, themed.filterLabel)}>Rating</label>
                <div className={common.ratingSelector}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      className={cn(common.ratingStar, themed.ratingStar,
                        n <= formRating && cn(common.ratingStarActive, themed.ratingStarActive))}
                      onClick={() => setFormRating(n)}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star size={24} />
                    </button>
                  ))}
                  {formRating > 0 && (
                    <span className={cn(common.ratingText, themed.ratingText)}>
                      {formRating === 5 ? 'Excellent' : formRating === 4 ? 'Great' :
                       formRating === 3 ? 'Good' : formRating === 2 ? 'Fair' : 'Poor'}
                    </span>
                  )}
                </div>
              </div>

              {/* Review Text */}
              <div className={common.formGroup}>
                <Textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Share your experience working with this freelancer..."
                  rows={5}
                />
                <span className={cn(common.charCount, themed.charCount)}>
                  {formText.length}/500
                </span>
              </div>

              {/* Anonymous Option */}
              <div className={common.formGroup}>
                <label className={cn(common.checkboxLabel, themed.checkboxLabel)}>
                  <input
                    type="checkbox"
                    checked={formAnonymous}
                    onChange={(e) => setFormAnonymous(e.target.checked)}
                  />
                  <span>Post as anonymous</span>
                </label>
              </div>

              {/* Submit */}
              {submitMessage && (
                <div className={cn(common.submitMessage, themed.submitMessage,
                  submitMessage.includes('success') ? common.submitSuccess : common.submitError)}>
                  {submitMessage.includes('success') ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {submitMessage}
                </div>
              )}
              <div className={common.formActions}>
                <Button
                  variant="primary"
                  size="md"
                  isLoading={submitting}
                  disabled={!formContract || formRating === 0 || !formText.trim() || formText.length > 500}
                  onClick={handleSubmit}
                >
                  <Send size={16} /> Submit Review
                </Button>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageTransition>
  );
};

export default Reviews;
