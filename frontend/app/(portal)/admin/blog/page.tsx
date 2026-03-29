// @AI-HINT: Admin Blog & News management page with full CSS module theming
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { blogApi, BlogPost } from '@/lib/api/blog';
import Button from '@/app/components/atoms/Button/Button';
import { Badge } from '@/app/components/atoms/Badge';
import Modal from '@/app/components/organisms/Modal/Modal';
import Loading from '@/app/components/atoms/Loading/Loading';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { 
  FileText, Plus, Search, Eye, Pencil, Trash2, 
  TrendingUp, Clock, CheckCircle, AlertCircle, Newspaper 
} from 'lucide-react';

import commonStyles from './AdminBlog.common.module.css';
import lightStyles from './AdminBlog.light.module.css';
import darkStyles from './AdminBlog.dark.module.css';

export default function AdminBlogPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) fetchPosts();
  }, [mounted]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await blogApi.getAll();
      setPosts(data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch posts:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await blogApi.delete(id);
      setDeleteTargetId(null);
      fetchPosts();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete post:', error);
      }
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'published' && post.is_published) || 
        (filterStatus === 'draft' && !post.is_published);
      return matchesSearch && matchesStatus;
    });
  }, [posts, searchQuery, filterStatus]);

  const stats = useMemo(() => ({
    total: posts.length,
    published: posts.filter(p => p.is_published).length,
    drafts: posts.filter(p => !p.is_published).length,
    newsTrends: posts.filter(p => p.is_news_trend).length,
  }), [posts]);

  if (!mounted) return <Loading />;
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Blog & News Management</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Create and manage blog posts, news updates, and platform articles
              </p>
            </div>
            <Link href="/admin/blog/create">
              <Button variant="primary" iconBefore={<Plus size={18} />}>
                Create New Post
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        {/* Stats Cards */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsGrid}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconTotal)}>
                <FileText size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.total}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Posts</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconPublished)}>
                <CheckCircle size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.published}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Published</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconDraft)}>
                <Clock size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.drafts}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Drafts</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconTrending)}>
                <TrendingUp size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.newsTrends}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>News Trends</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Toolbar */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.toolbar, themeStyles.toolbar)}>
            <div className={commonStyles.searchWrapper}>
              <Search size={18} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
              <input
                type="text"
                placeholder="Search posts by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              />
            </div>
            <div className={commonStyles.filterTabs}>
              {(['all', 'published', 'draft'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    commonStyles.filterTab,
                    themeStyles.filterTab,
                    filterStatus === status && commonStyles.filterTabActive,
                    filterStatus === status && themeStyles.filterTabActive
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className={commonStyles.filterCount}>
                      {status === 'published' ? stats.published : stats.drafts}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Posts List */}
        {loading ? (
          <Loading />
        ) : filteredPosts.length === 0 ? (
          <ScrollReveal>
            <EmptyState
              icon={<FileText size={48} />}
              title="No posts found"
              description={searchQuery ? 'Try adjusting your search or filters' : 'Create your first blog post to get started'}
              action={
                !searchQuery ? (
                  <Link href="/admin/blog/create">
                    <Button variant="primary">Create Post</Button>
                  </Link>
                ) : undefined
              }
            />
          </ScrollReveal>
        ) : (
          <StaggerContainer className={commonStyles.postsList}>
            {filteredPosts.map((post) => (
              <StaggerItem key={post.id}>
                <div className={cn(commonStyles.postCard, themeStyles.postCard)}>
                  <div className={commonStyles.postMain}>
                    <div className={commonStyles.postInfo}>
                      <div className={commonStyles.postTitleRow}>
                        <h3 className={cn(commonStyles.postTitle, themeStyles.postTitle)}>{post.title}</h3>
                        <div className={commonStyles.postBadges}>
                          <Badge variant={post.is_published ? 'success' : 'warning'}>
                            {post.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          {post.is_news_trend && (
                            <Badge variant="info">
                              <Newspaper size={12} />
                              News Trend
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className={cn(commonStyles.postSlug, themeStyles.postSlug)}>/{post.slug}</p>
                    </div>
                    <div className={commonStyles.postMeta}>
                      <span className={cn(commonStyles.postAuthor, themeStyles.postAuthor)}>
                        By {post.author || 'Unknown'}
                      </span>
                      <span className={cn(commonStyles.postDate, themeStyles.postDate)}>
                        {new Date(post.created_at).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                  <div className={commonStyles.postActions}>
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm" title="Preview">
                        <Eye size={16} />
                      </Button>
                    </Link>
                    <Link href={`/admin/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm" title="Edit">
                        <Pencil size={16} />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDeleteTargetId(post.id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTargetId && (
          <Modal isOpen onClose={() => setDeleteTargetId(null)} title="Delete Post">
            <div className={commonStyles.deleteModalContent}>
              <AlertCircle size={48} className={commonStyles.deleteIcon} />
              <p className={commonStyles.confirmText}>
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
            </div>
            <div className={commonStyles.modalActions}>
              <Button variant="secondary" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteTargetId)}>Delete Post</Button>
            </div>
          </Modal>
        )}
      </div>
    </PageTransition>
  );
}
