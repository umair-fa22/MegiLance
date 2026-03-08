// @AI-HINT: Portal Community page. Theme-aware, accessible, animated discussion hub with threads, categories, trending, and rich composer.
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PageTransition, ScrollReveal, StaggerContainer } from '@/components/Animations';
import Button from '@/app/components/Button/Button';
import {
  Search, MessageSquare, ThumbsUp, TrendingUp, Clock, Users,
  Hash, Flame, Star, Send, Plus, Filter, ChevronRight,
  Eye, BookmarkPlus, Pin, Award,
} from 'lucide-react';
import common from './Community.common.module.css';
import light from './Community.light.module.css';
import dark from './Community.dark.module.css';

interface Thread {
  id: number;
  title: string;
  author: string;
  authorAvatar?: string;
  authorLevel?: string;
  time: string;
  replies: number;
  views: number;
  likes: number;
  tags: string[];
  category: string;
  isPinned?: boolean;
  isHot?: boolean;
  preview: string;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  count: number;
}

const SORTS = ['Latest', 'Most Replies', 'Most Liked', 'Trending'] as const;

const CATEGORIES: Category[] = [
  { id: 'all', label: 'All Topics', icon: <MessageSquare size={16} />, count: 0 },
  { id: 'general', label: 'General', icon: <Hash size={16} />, count: 42 },
  { id: 'tips', label: 'Tips & Tricks', icon: <Star size={16} />, count: 28 },
  { id: 'showcase', label: 'Showcase', icon: <Award size={16} />, count: 15 },
  { id: 'help', label: 'Help & Support', icon: <Users size={16} />, count: 33 },
  { id: 'feedback', label: 'Feedback', icon: <ThumbsUp size={16} />, count: 19 },
];

const initialThreads: Thread[] = [
  {
    id: 1, title: 'How to structure complex Next.js dashboards?', author: 'Ava Chen',
    authorLevel: 'Expert', time: '1h ago', replies: 12, views: 234, likes: 18,
    tags: ['Next.js', 'Architecture'], category: 'tips', isPinned: true,
    preview: 'I\'ve been working on a large-scale dashboard and wanted to share some patterns that work well...',
  },
  {
    id: 2, title: 'Best practices for theme-aware CSS modules', author: 'Liam Parker',
    authorLevel: 'Pro', time: '4h ago', replies: 7, views: 156, likes: 11,
    tags: ['CSS', 'Theming'], category: 'tips',
    preview: 'After building multiple themed components, here are the patterns I found most reliable...',
  },
  {
    id: 3, title: 'Improving accessibility for live regions', author: 'Mia Johnson',
    authorLevel: 'Contributor', time: '1d ago', replies: 3, views: 89, likes: 6,
    tags: ['Accessibility', 'ARIA'], category: 'help',
    preview: 'I\'m struggling with aria-live regions in React. How do you handle dynamic content announcements?',
  },
  {
    id: 4, title: 'Smooth intersection animations tips', author: 'Noah Williams',
    authorLevel: 'Expert', time: '2d ago', replies: 15, views: 312, likes: 24,
    tags: ['Animation', 'UX'], category: 'tips', isHot: true,
    preview: 'Let me share some techniques for buttery-smooth scroll-triggered animations using IntersectionObserver...',
  },
  {
    id: 5, title: 'My first freelance project on MegiLance!', author: 'Sarah Kim',
    authorLevel: 'New', time: '3d ago', replies: 22, views: 445, likes: 38,
    tags: ['Success Story', 'Freelancing'], category: 'showcase', isHot: true,
    preview: 'Just completed my first project and wanted to share my experience with the community...',
  },
  {
    id: 6, title: 'Feature request: Dark mode for invoices', author: 'James Rivera',
    authorLevel: 'Pro', time: '5d ago', replies: 8, views: 102, likes: 14,
    tags: ['Feature Request', 'Dark Mode'], category: 'feedback',
    preview: 'It would be great if the invoice PDF export also respected the user\'s theme preference...',
  },
  {
    id: 7, title: 'Need help with contract milestones', author: 'Emily Zhang',
    authorLevel: 'Contributor', time: '6d ago', replies: 5, views: 67, likes: 3,
    tags: ['Contracts', 'Help'], category: 'help',
    preview: 'How do you usually break down a large project into milestones? Looking for advice from experienced freelancers.',
  },
];

const TRENDING_TAGS = ['React', 'TypeScript', 'AI Tools', 'Remote Work', 'Web3', 'Design Systems', 'FreelanceTips'];

const Community: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Latest');
  const [category, setCategory] = useState('all');
  const [message, setMessage] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [likedThreads, setLikedThreads] = useState<Set<number>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

  const threads = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = initialThreads.filter(t => {
      const matchesQuery = !q || t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)) || t.author.toLowerCase().includes(q);
      const matchesCategory = category === 'all' || t.category === category;
      return matchesQuery && matchesCategory;
    });

    // Pinned first, then sort
    const pinned = filtered.filter(t => t.isPinned);
    const unpinned = filtered.filter(t => !t.isPinned);

    const sorted = [...unpinned].sort((a, b) => {
      switch (sort) {
        case 'Most Replies': return b.replies - a.replies;
        case 'Most Liked': return b.likes - a.likes;
        case 'Trending': return (b.views + b.likes * 3) - (a.views + a.likes * 3);
        default: return b.id - a.id;
      }
    });

    return [...pinned, ...sorted];
  }, [query, sort, category]);

  const toggleLike = useCallback((threadId: number) => {
    setLikedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((threadId: number) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
  }, []);

  const onPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !message.trim()) return;
    setMessage('');
    setNewTitle('');
    setShowComposer(false);
  };

  const getLevelBadgeClass = (level?: string) => {
    switch (level) {
      case 'Expert': return themed.levelExpert;
      case 'Pro': return themed.levelPro;
      case 'Contributor': return themed.levelContributor;
      default: return themed.levelNew;
    }
  };

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <ScrollReveal>
            <div className={common.header}>
              <div>
                <h1 className={common.title}>Community</h1>
                <p className={cn(common.subtitle, themed.subtitle)}>
                  Discuss, share knowledge, and collaborate with fellow freelancers.
                </p>
              </div>
              <div className={common.headerActions}>
                <div className={common.controls} role="search">
                  <label htmlFor="community-search" className={common.srOnly}>Search threads</label>
                  <div className={cn(common.searchWrap, themed.searchWrap)}>
                    <Search size={16} className={common.searchIcon} />
                    <input
                      id="community-search"
                      className={cn(common.input, themed.input)}
                      type="search"
                      placeholder="Search threads, tags, or people..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowComposer(!showComposer)}>
                  <Plus size={16} />
                  New Thread
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {/* Stats Banner */}
          <ScrollReveal>
            <div className={cn(common.statsBanner, themed.statsBanner)}>
              <div className={common.stat}>
                <MessageSquare size={18} />
                <div>
                  <span className={cn(common.statValue, themed.statValue)}>{initialThreads.length}</span>
                  <span className={cn(common.statLabel, themed.statLabel)}>Threads</span>
                </div>
              </div>
              <div className={common.stat}>
                <Users size={18} />
                <div>
                  <span className={cn(common.statValue, themed.statValue)}>156</span>
                  <span className={cn(common.statLabel, themed.statLabel)}>Members</span>
                </div>
              </div>
              <div className={common.stat}>
                <MessageSquare size={18} />
                <div>
                  <span className={cn(common.statValue, themed.statValue)}>
                    {initialThreads.reduce((acc, t) => acc + t.replies, 0)}
                  </span>
                  <span className={cn(common.statLabel, themed.statLabel)}>Replies</span>
                </div>
              </div>
              <div className={common.stat}>
                <TrendingUp size={18} />
                <div>
                  <span className={cn(common.statValue, themed.statValue)}>12</span>
                  <span className={cn(common.statLabel, themed.statLabel)}>Active Today</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className={common.layout}>
              {/* Sidebar */}
              <aside className={common.sidebar} aria-label="Community navigation">
                {/* Categories */}
                <div className={cn(common.sideCard, themed.sideCard)}>
                  <h3 className={cn(common.sideCardTitle, themed.sideCardTitle)}>Categories</h3>
                  <nav className={common.categoryList} aria-label="Thread categories">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={cn(
                          common.categoryBtn,
                          themed.categoryBtn,
                          category === cat.id && common.categoryActive,
                          category === cat.id && themed.categoryActive,
                        )}
                        aria-current={category === cat.id ? 'true' : undefined}
                      >
                        <span className={common.categoryIcon}>{cat.icon}</span>
                        <span className={common.categoryLabel}>{cat.label}</span>
                        {cat.count > 0 && (
                          <span className={cn(common.categoryCount, themed.categoryCount)}>{cat.count}</span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Trending Tags */}
                <div className={cn(common.sideCard, themed.sideCard)}>
                  <h3 className={cn(common.sideCardTitle, themed.sideCardTitle)}>
                    <Flame size={16} /> Trending Tags
                  </h3>
                  <div className={common.trendingTags}>
                    {TRENDING_TAGS.map(tag => (
                      <button
                        key={tag}
                        className={cn(common.trendTag, themed.trendTag)}
                        onClick={() => setQuery(tag)}
                        aria-label={`Filter by tag ${tag}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className={cn(common.sideCard, themed.sideCard)}>
                  <h3 className={cn(common.sideCardTitle, themed.sideCardTitle)}>
                    <Filter size={16} /> Sort By
                  </h3>
                  <div className={common.sortList}>
                    {SORTS.map(s => (
                      <button
                        key={s}
                        onClick={() => setSort(s)}
                        className={cn(
                          common.sortBtn,
                          themed.sortBtn,
                          sort === s && themed.sortBtnActive,
                        )}
                        aria-current={sort === s ? 'true' : undefined}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <section aria-label="Discussion threads" className={common.mainContent}>
                {/* Composer */}
                {showComposer && (
                  <div className={cn(common.composerCard, themed.composerCard)}>
                    <h3 className={cn(common.composerTitle, themed.composerTitle)}>Start a new discussion</h3>
                    <form className={common.composer} onSubmit={onPost}>
                      <label htmlFor="thread-title" className={common.srOnly}>Thread title</label>
                      <input
                        id="thread-title"
                        className={cn(common.composerInput, themed.composerInput)}
                        type="text"
                        placeholder="Thread title..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                      <label htmlFor="compose" className={common.srOnly}>Message</label>
                      <textarea
                        id="compose"
                        className={cn(common.textarea, themed.textarea)}
                        placeholder="Share your question or idea..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                      />
                      <div className={common.composerActions}>
                        <Button variant="primary" size="sm" type="submit" disabled={!newTitle.trim() || !message.trim()}>
                          <Send size={14} /> Post Thread
                        </Button>
                        <Button variant="ghost" size="sm" type="button" onClick={() => { setShowComposer(false); setNewTitle(''); setMessage(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Thread List */}
                {threads.length === 0 ? (
                  <div className={cn(common.emptyState, themed.emptyState)}>
                    <MessageSquare size={40} />
                    <h3>No threads found</h3>
                    <p>Try adjusting your search or filter, or start a new discussion!</p>
                  </div>
                ) : (
                  <StaggerContainer className={common.threadList}>
                    {threads.map((t) => (
                      <article
                        key={t.id}
                        tabIndex={0}
                        aria-labelledby={`thread-${t.id}-title`}
                        className={cn(
                          common.thread,
                          themed.thread,
                          t.isPinned && common.pinned,
                          t.isPinned && themed.pinned,
                        )}
                      >
                        {/* Thread badges */}
                        <div className={common.threadBadges}>
                          {t.isPinned && (
                            <span className={cn(common.badge, themed.badgePinned)} aria-label="Pinned thread">
                              <Pin size={12} /> Pinned
                            </span>
                          )}
                          {t.isHot && (
                            <span className={cn(common.badge, themed.badgeHot)} aria-label="Hot thread">
                              <Flame size={12} /> Hot
                            </span>
                          )}
                        </div>

                        {/* Header */}
                        <div className={common.threadHeader}>
                          <div className={cn(common.avatar, themed.avatar)}>
                            {t.author.charAt(0)}
                          </div>
                          <div className={common.threadAuthorInfo}>
                            <span className={cn(common.authorName, themed.authorName)}>{t.author}</span>
                            {t.authorLevel && (
                              <span className={cn(common.levelBadge, getLevelBadgeClass(t.authorLevel))}>
                                {t.authorLevel}
                              </span>
                            )}
                          </div>
                          <span className={cn(common.threadTime, themed.threadTime)}>
                            <Clock size={12} /> {t.time}
                          </span>
                        </div>

                        {/* Content */}
                        <h3 id={`thread-${t.id}-title`} className={cn(common.threadTitle, themed.threadTitle)}>
                          {t.title}
                        </h3>
                        <p className={cn(common.threadPreview, themed.threadPreview)}>
                          {t.preview}
                        </p>

                        {/* Tags */}
                        <div className={common.threadTags}>
                          {t.tags.map(tag => (
                            <span key={tag} className={cn(common.tag, themed.tag)}>{tag}</span>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className={common.threadFooter}>
                          <div className={common.threadStats}>
                            <button
                              className={cn(
                                common.threadAction,
                                themed.threadAction,
                                likedThreads.has(t.id) && themed.threadActionActive,
                              )}
                              onClick={() => toggleLike(t.id)}
                              aria-label={likedThreads.has(t.id) ? `Unlike thread, ${t.likes} likes` : `Like thread, ${t.likes} likes`}
                              aria-pressed={likedThreads.has(t.id)}
                            >
                              <ThumbsUp size={14} />
                              <span>{t.likes + (likedThreads.has(t.id) ? 1 : 0)}</span>
                            </button>
                            <span className={cn(common.threadStat, themed.threadStat)}>
                              <MessageSquare size={14} /> {t.replies} replies
                            </span>
                            <span className={cn(common.threadStat, themed.threadStat)}>
                              <Eye size={14} /> {t.views} views
                            </span>
                          </div>
                          <div className={common.threadActionsRight}>
                            <button
                              className={cn(common.threadAction, themed.threadAction, bookmarked.has(t.id) && themed.threadActionActive)}
                              onClick={() => toggleBookmark(t.id)}
                              aria-label={bookmarked.has(t.id) ? 'Remove bookmark' : 'Bookmark thread'}
                              aria-pressed={bookmarked.has(t.id)}
                            >
                              <BookmarkPlus size={14} />
                            </button>
                            <button className={cn(common.threadAction, themed.threadAction)} aria-label="View thread">
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </StaggerContainer>
                )}
              </section>
            </div>
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default Community;
