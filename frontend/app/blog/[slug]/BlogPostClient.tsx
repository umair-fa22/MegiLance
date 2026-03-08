// @AI-HINT: Premium blog detail — reading progress bar, hero image overlay, share buttons, author bio, tag badges, related posts.
'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import DOMPurify from 'dompurify';
import {
  ArrowLeft, Clock, Eye, User, Calendar, Share2,
  Twitter, Linkedin, Facebook, Link2, Check, Tag
} from 'lucide-react';

import { blogApi, BlogPost } from '@/lib/api/blog';
import { PageTransition, ScrollReveal } from '@/components/Animations';
import { AnimatedOrb, ParticlesSystem } from '@/app/components/3D';
import { cn } from '@/lib/utils';

import commonStyles from './BlogPost.common.module.css';
import lightStyles from './BlogPost.light.module.css';
import darkStyles from './BlogPost.dark.module.css';

const BlogPostClient: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const articleRef = useRef<HTMLElement>(null);

  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await blogApi.getBySlug(slug);
        setPost(data);
        // Fetch related posts (same tags)
        if (data?.tags?.length) {
          const all = await blogApi.getAll(true);
          const related = all
            .filter(p => p.slug !== slug && p.tags?.some(t => data.tags.includes(t)))
            .slice(0, 3);
          setRelatedPosts(related);
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug]);

  /* Reading progress */
  const handleScroll = useCallback(() => {
    if (!articleRef.current) return;
    const el = articleRef.current;
    const rect = el.getBoundingClientRect();
    const scrolled = Math.max(0, -rect.top);
    const total = el.offsetHeight - window.innerHeight;
    setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* Share helpers */
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };


  if (loading) {
    return (
      <main id="main-content" role="main" className={commonStyles.pageWrap}>
        <div className={commonStyles.loadingWrap}>
          <div className={commonStyles.spinner} />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main id="main-content" role="main" className={commonStyles.pageWrap}>
        <div className={commonStyles.notFound}>
          <h2 className={cn(commonStyles.notFoundTitle, themeStyles.title)}>Post not found</h2>
          <Link href="/blog" className={commonStyles.backLink}>
            <ArrowLeft size={16} /> Back to blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      {/* Reading progress bar */}
      <div className={commonStyles.progressBar} style={{ width: `${progress}%` }} aria-hidden="true" />

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <AnimatedOrb variant="purple" size={500} blur={90} opacity={0.08} className="absolute top-[-10%] right-[-10%]" />
        <AnimatedOrb variant="blue" size={400} blur={70} opacity={0.06} className="absolute bottom-[-10%] left-[-10%]" />
        <ParticlesSystem count={8} className="absolute inset-0" />
      </div>

      <main id="main-content" role="main" aria-labelledby="post-title">
        <div className={commonStyles.pageWrap}>

          {/* Back link */}
          <Link href="/blog" className={cn(commonStyles.backLink, themeStyles.backLink)}>
            <ArrowLeft size={16} /> All articles
          </Link>

          <article ref={articleRef} className={commonStyles.article}>

            {/* ── HERO IMAGE with overlay + title ── */}
            <ScrollReveal>
              <div className={commonStyles.heroImage}>
                <Image
                  src={post.image_url || '/images/blog/productivity.jpg'}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 860px"
                  className={commonStyles.heroImg}
                  priority
                />
                <div className={cn(commonStyles.heroOverlay, themeStyles.heroOverlay)} />

                {/* Overlay content */}
                <div className={commonStyles.heroContent}>
                  {post.tags?.length > 0 && (
                    <div className={commonStyles.tagRow}>
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={commonStyles.tagBadge}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <h1 id="post-title" className={commonStyles.heroTitle}>{post.title}</h1>
                </div>
              </div>
            </ScrollReveal>

            {/* ── META BAR ── */}
            <div className={cn(commonStyles.metaBar, themeStyles.metaBar)}>
              <div className={commonStyles.metaLeft}>
                <div className={cn(commonStyles.metaAvatar, themeStyles.metaAvatar)}>
                  <User size={16} />
                </div>
                <div>
                  <span className={cn(commonStyles.metaAuthor, themeStyles.title)}>{post.author}</span>
                  <div className={commonStyles.metaDetails}>
                    <span><Calendar size={13} /> {new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    {post.reading_time !== undefined && <span><Clock size={13} /> {post.reading_time} min read</span>}
                    {post.views !== undefined && <span><Eye size={13} /> {post.views.toLocaleString()} views</span>}
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <div className={commonStyles.shareRow}>
                <span className={cn(commonStyles.shareLabel, themeStyles.meta)}><Share2 size={14} /> Share</span>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(commonStyles.shareBtn, themeStyles.shareBtn)}
                  aria-label="Share on Twitter"
                >
                  <Twitter size={16} />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(commonStyles.shareBtn, themeStyles.shareBtn)}
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin size={16} />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(commonStyles.shareBtn, themeStyles.shareBtn)}
                  aria-label="Share on Facebook"
                >
                  <Facebook size={16} />
                </a>
                <button
                  onClick={handleCopyLink}
                  className={cn(commonStyles.shareBtn, themeStyles.shareBtn)}
                  aria-label="Copy link"
                >
                  {copied ? <Check size={16} /> : <Link2 size={16} />}
                </button>
              </div>
            </div>

            {/* ── ARTICLE CONTENT ── */}
            <ScrollReveal>
              <section
                aria-label="Post content"
                className={cn(commonStyles.content, themeStyles.content)}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }}
              />
            </ScrollReveal>

            {/* ── TAGS FOOTER ── */}
            {post.tags?.length > 0 && (
              <div className={cn(commonStyles.tagsFooter, themeStyles.tagsFooter)}>
                <Tag size={16} />
                {post.tags.map(tag => (
                  <span key={tag} className={cn(commonStyles.footerTag, themeStyles.footerTag)}>{tag}</span>
                ))}
              </div>
            )}

            {/* ── AUTHOR BIO ── */}
            <ScrollReveal>
              <div className={cn(commonStyles.authorBio, themeStyles.authorBio)}>
                <div className={cn(commonStyles.authorBioAvatar, themeStyles.metaAvatar)}>
                  <User size={28} />
                </div>
                <div>
                  <p className={cn(commonStyles.authorBioName, themeStyles.title)}>Written by {post.author}</p>
                  <p className={cn(commonStyles.authorBioDesc, themeStyles.meta)}>
                    Contributing writer at MegiLance, covering freelancing, cryptocurrency, and the future of remote work on Web3 platforms.
                  </p>
                </div>
              </div>
            </ScrollReveal>

          </article>

          {/* ── RELATED POSTS ── */}
          {relatedPosts.length > 0 && (
            <ScrollReveal>
              <section className={commonStyles.relatedSection}>
                <h2 className={cn(commonStyles.relatedTitle, themeStyles.title)}>Related Articles</h2>
                <div className={commonStyles.relatedGrid}>
                  {relatedPosts.map(rp => (
                    <Link key={rp.slug} href={`/blog/${rp.slug}`} className={cn(commonStyles.relatedCard, themeStyles.relatedCard)}>
                      <div className={commonStyles.relatedImageWrap}>
                        <Image src={rp.image_url || '/images/blog/productivity.jpg'} alt={rp.title} fill sizes="(max-width:768px) 100vw, 280px" className={commonStyles.relatedImg} />
                      </div>
                      <div className={commonStyles.relatedInfo}>
                        <h3 className={cn(commonStyles.relatedName, themeStyles.title)}>{rp.title}</h3>
                        <span className={cn(commonStyles.relatedMeta, themeStyles.meta)}>{rp.reading_time} min · {rp.author}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

        </div>
      </main>
    </PageTransition>
  );
};

export default BlogPostClient;
