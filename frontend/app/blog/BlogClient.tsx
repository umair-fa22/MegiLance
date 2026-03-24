// @AI-HINT: Premium blog listing — hero with SVG illustration, category filters, featured post, newsletter CTA.
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { Search, TrendingUp, Sparkles, BookOpen, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';

import BlogPostCard from '@/app/components/Public/BlogPostCard/BlogPostCard';
import { cn } from '@/lib/utils';
import { blogApi, BlogPost } from '@/lib/api/blog';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { AnimatedOrb, ParticlesSystem, FloatingCube, FloatingSphere } from '@/app/components/3D';

import commonStyles from './Blog.common.module.css';
import lightStyles from './Blog.light.module.css';
import darkStyles from './Blog.dark.module.css';

/* ---------- inline SVG illustration ---------- */
const HeroIllustration = () => (
  <svg className={commonStyles.heroSvg} viewBox="0 0 520 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Screen / laptop body */}
    <rect x="100" y="60" width="320" height="210" rx="16" fill="url(#screenGrad)" opacity="0.15" />
    <rect x="115" y="75" width="290" height="180" rx="8" fill="url(#innerGrad)" opacity="0.1" />
    {/* Article lines */}
    <rect x="140" y="100" width="160" height="10" rx="5" fill="#4573df" opacity="0.5" />
    <rect x="140" y="120" width="240" height="6" rx="3" fill="currentColor" opacity="0.12" />
    <rect x="140" y="134" width="220" height="6" rx="3" fill="currentColor" opacity="0.1" />
    <rect x="140" y="148" width="200" height="6" rx="3" fill="currentColor" opacity="0.08" />
    {/* Image placeholder */}
    <rect x="140" y="170" width="100" height="70" rx="8" fill="#4573df" opacity="0.18" />
    <circle cx="175" cy="195" r="12" fill="#4573df" opacity="0.25" />
    <rect x="260" y="175" width="120" height="6" rx="3" fill="currentColor" opacity="0.1" />
    <rect x="260" y="190" width="100" height="6" rx="3" fill="currentColor" opacity="0.08" />
    <rect x="260" y="205" width="110" height="6" rx="3" fill="currentColor" opacity="0.08" />
    {/* Stand */}
    <rect x="220" y="270" width="80" height="8" rx="4" fill="currentColor" opacity="0.08" />
    <rect x="245" y="278" width="30" height="24" rx="4" fill="currentColor" opacity="0.06" />
    <rect x="200" y="302" width="120" height="6" rx="3" fill="currentColor" opacity="0.06" />
    {/* Floating shapes */}
    <circle cx="70" cy="120" r="24" fill="#4573df" opacity="0.12">
      <animate attributeName="cy" values="120;105;120" dur="4s" repeatCount="indefinite" />
    </circle>
    <circle cx="460" cy="180" r="16" fill="#ff9800" opacity="0.15">
      <animate attributeName="cy" values="180;165;180" dur="3.5s" repeatCount="indefinite" />
    </circle>
    <rect x="440" y="90" width="28" height="28" rx="6" fill="#27AE60" opacity="0.12" transform="rotate(15 454 104)">
      <animateTransform attributeName="transform" type="rotate" from="15 454 104" to="375 454 104" dur="20s" repeatCount="indefinite" />
    </rect>
    <polygon points="65,260 80,235 95,260" fill="#e81123" opacity="0.1">
      <animate attributeName="opacity" values="0.1;0.2;0.1" dur="5s" repeatCount="indefinite" />
    </polygon>
    <defs>
      <linearGradient id="screenGrad" x1="100" y1="60" x2="420" y2="270">
        <stop stopColor="#4573df" />
        <stop offset="1" stopColor="#6b93e8" />
      </linearGradient>
      <linearGradient id="innerGrad" x1="115" y1="75" x2="405" y2="255">
        <stop stopColor="#4573df" />
        <stop offset="1" stopColor="#ff9800" />
      </linearGradient>
    </defs>
  </svg>
);

const BlogPage: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await blogApi.getAll(true);
        setPosts(data);
      } catch (error) {
        console.error('[Blog] Failed to fetch posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  /* Derive unique tags */
  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => p.tags?.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  /* Filter posts */
  const filtered = useMemo(() => {
    let list = posts;
    if (activeTag !== 'all') list = list.filter(p => p.tags?.includes(activeTag));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q));
    }
    return list;
  }, [posts, activeTag, searchQuery]);

  const featuredPost = filtered[0];
  const gridPosts = filtered.slice(1);
  const trendingPosts = posts.filter(p => p.is_news_trend).slice(0, 4);

  return (
    <PageTransition>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.1} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.08} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={12} className="absolute inset-0" />
        <div className="absolute top-20 left-10 opacity-10 animate-float-slow">
          <FloatingCube size={40} />
        </div>
        <div className="absolute bottom-40 right-20 opacity-10 animate-float-medium">
          <FloatingSphere size={30} variant="gradient" />
        </div>
      </div>

      <main id="main-content" role="main" aria-labelledby="blog-title" className={commonStyles.pageWrap}>

        {/* ═══ HERO ═══ */}
        <ScrollReveal>
          <section className={cn(commonStyles.hero, themeStyles.hero)}>
            <div className={commonStyles.heroContent}>
              <span className={cn(commonStyles.heroBadge, themeStyles.heroBadge)}>
                <Sparkles size={14} /> MegiLance Blog
              </span>
              <h1 id="blog-title" className={cn(commonStyles.heroTitle, themeStyles.heroTitle)}>
                Insights on <span className={commonStyles.heroAccent}>Freelancing</span>, Crypto &amp; the Future of Work
              </h1>
              <p className={cn(commonStyles.heroSubtitle, themeStyles.heroSubtitle)}>
                Expert guides, industry news, and actionable tips to grow your freelance career and earn smarter with cryptocurrency.
              </p>

              {/* Search bar */}
              <div className={cn(commonStyles.searchBar, themeStyles.searchBar)}>
                <Search size={18} className={commonStyles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                  aria-label="Search blog articles"
                />
              </div>
            </div>
            <HeroIllustration />
          </section>
        </ScrollReveal>

        {/* ═══ CATEGORY FILTERS ═══ */}
        {allTags.length > 0 && (
          <ScrollReveal>
            <nav className={commonStyles.filterBar} aria-label="Filter by category">
              <button
                onClick={() => setActiveTag('all')}
                className={cn(commonStyles.filterChip, themeStyles.filterChip, activeTag === 'all' && commonStyles.filterActive, activeTag === 'all' && themeStyles.filterActive)}
              >
                <BookOpen size={14} /> All Posts
              </button>
              {allTags.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={cn(commonStyles.filterChip, themeStyles.filterChip, activeTag === tag && commonStyles.filterActive, activeTag === tag && themeStyles.filterActive)}
                >
                  {tag}
                </button>
              ))}
            </nav>
          </ScrollReveal>
        )}

        {loading ? (
          <div className={commonStyles.loadingWrap}>
            <div className={commonStyles.spinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={commonStyles.emptyWrap}>
            <BookOpen size={48} strokeWidth={1} className={commonStyles.emptyIcon} />
            <p className={cn(commonStyles.emptyTitle, themeStyles.heroTitle)}>No articles found</p>
            <p className={cn(commonStyles.emptySubtitle, themeStyles.heroSubtitle)}>Try a different category or search term.</p>
          </div>
        ) : (
          <>
            {/* ═══ FEATURED POST ═══ */}
            {featuredPost && (
              <ScrollReveal>
                <section className={commonStyles.featuredSection} aria-label="Featured article">
                  <BlogPostCard
                    slug={featuredPost.slug}
                    title={featuredPost.title}
                    excerpt={featuredPost.excerpt}
                    imageUrl={featuredPost.image_url || '/images/blog/productivity.jpg'}
                    author={featuredPost.author}
                    date={new Date(featuredPost.created_at).toLocaleDateString()}
                    views={featuredPost.views}
                    readingTime={featuredPost.reading_time}
                    tags={featuredPost.tags}
                    isFeatured
                  />
                </section>
              </ScrollReveal>
            )}

            {/* ═══ TRENDING ═══ */}
            {trendingPosts.length > 0 && activeTag === 'all' && !searchQuery && (
              <ScrollReveal>
                <section className={commonStyles.trendingSection}>
                  <div className={commonStyles.sectionHeader}>
                    <h2 className={cn(commonStyles.sectionTitle, themeStyles.heroTitle)}>
                      <TrendingUp size={22} /> Trending Now
                    </h2>
                    <Link href="/blog/search" className={cn(commonStyles.seeAll, themeStyles.seeAll)}>
                      See all <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className={commonStyles.trendingGrid}>
                    {trendingPosts.map((post, i) => (
                      <Link key={post.slug} href={`/blog/${post.slug}`} className={cn(commonStyles.trendingCard, themeStyles.trendingCard)}>
                        <span className={cn(commonStyles.trendingNum, themeStyles.trendingNum)}>{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <h3 className={cn(commonStyles.trendingTitle, themeStyles.heroTitle)}>{post.title}</h3>
                          <span className={cn(commonStyles.trendingMeta, themeStyles.heroSubtitle)}>{post.author} · {post.reading_time} min read</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )}

            {/* ═══ POSTS GRID ═══ */}
            <StaggerContainer className={commonStyles.grid} aria-label="Recent posts">
              {gridPosts.map(post => (
                <StaggerItem key={post.slug}>
                  <BlogPostCard
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    imageUrl={post.image_url || '/images/blog/productivity.jpg'}
                    author={post.author}
                    date={new Date(post.created_at).toLocaleDateString()}
                    views={post.views}
                    readingTime={post.reading_time}
                    tags={post.tags}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        )}

        {/* ═══ NEWSLETTER CTA ═══ */}
        <ScrollReveal>
          <section className={cn(commonStyles.newsletter, themeStyles.newsletter)}>
            <Mail size={36} className={commonStyles.newsletterIcon} />
            <h2 className={cn(commonStyles.newsletterTitle, themeStyles.heroTitle)}>Stay in the loop</h2>
            <p className={cn(commonStyles.newsletterDesc, themeStyles.heroSubtitle)}>
              Get the latest freelancing tips, crypto insights, and platform updates delivered to your inbox.
            </p>
            <form className={commonStyles.newsletterForm} onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="you@email.com"
                className={cn(commonStyles.newsletterInput, themeStyles.searchInput)}
                aria-label="Email address"
              />
              <button type="submit" className={commonStyles.newsletterBtn}>Subscribe</button>
            </form>
          </section>
        </ScrollReveal>
      </main>
    </PageTransition>
  );
};

export default BlogPage;
