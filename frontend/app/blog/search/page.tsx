// @AI-HINT: Blog search page - fetches real posts from API
// Production-ready: No mock data, connects to /api/blog
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import BlogPostCard from '@/app/components/Public/BlogPostCard/BlogPostCard';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { Search, Loader2 } from 'lucide-react';

import commonStyles from './BlogSearch.common.module.css';
import lightStyles from './BlogSearch.light.module.css';
import darkStyles from './BlogSearch.dark.module.css';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  author: string;
  date: string;
}

// Fetch blog posts from API
async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch('/api/blog?limit=50');
    if (!res.ok) return [];
    const data = await res.json();
    return (data.posts || data || []).map((p: any) => ({
      slug: p.slug || String(p.id),
      title: p.title || 'Untitled',
      excerpt: p.excerpt || p.summary || '',
      imageUrl: p.image_url || p.imageUrl || '/images/blog/default.jpg',
      author: p.author || 'MegiLance Team',
      date: p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { 
        month: 'long', day: 'numeric', year: 'numeric' 
      }) : '',
    }));
  } catch {
    return [];
  }
}

export default function BlogSearchPage() {
  const { resolvedTheme } = useTheme();
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  
  const loadPosts = useCallback(async () => {
    setLoading(true);
    const data = await fetchBlogPosts();
    setAllPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  
  const posts = useMemo(() => 
    allPosts.filter(p => 
      !q || 
      p.title.toLowerCase().includes(q.toLowerCase()) || 
      p.excerpt.toLowerCase().includes(q.toLowerCase())
    ), 
  [q, allPosts]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.page)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Search Blog</h1>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className={commonStyles.searchContainer}>
              <Search className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} size={20} />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search posts..."
                className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                aria-label="Search blog posts"
              />
            </div>
          </ScrollReveal>

          <div className={commonStyles.grid}>
            {loading ? (
              <div className={commonStyles.fullWidthCenter}>
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : posts.length > 0 ? (
              posts.map((p, index) => (
                <ScrollReveal key={p.slug} delay={0.1 + index * 0.05}>
                  <BlogPostCard {...p} />
                </ScrollReveal>
              ))
            ) : null}
          </div>

          {!loading && posts.length === 0 && (
            <ScrollReveal>
              <p className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                {q ? `No posts found matching "${q}".` : 'No blog posts available yet.'}
              </p>
            </ScrollReveal>
          )}
        </div>
      </main>
    </PageTransition>
  );
}
