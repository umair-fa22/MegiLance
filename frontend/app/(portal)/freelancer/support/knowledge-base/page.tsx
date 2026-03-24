// @AI-HINT: Knowledge base page - FAQs, help articles, search functionality
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { knowledgeBaseApi as _knowledgeBaseApi } from '@/lib/api';
const knowledgeBaseApi: any = _knowledgeBaseApi;
import commonStyles from './KnowledgeBase.common.module.css';
import lightStyles from './KnowledgeBase.light.module.css';
import darkStyles from './KnowledgeBase.dark.module.css';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  article_count: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  excerpt: string;
  content: string;
  views: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export default function KnowledgeBasePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [searchResults, setSearchResults] = useState<Article[] | null>(null);

  useEffect(() => {
    setMounted(true);
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setLoading(true);
      const [categoriesRes, popularRes] = await Promise.all([
        knowledgeBaseApi.getCategories().catch(() => []),
        knowledgeBaseApi.getPopular().catch(() => []),
      ]);

      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      setPopularArticles(Array.isArray(popularRes) ? popularRes : []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load knowledge base:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
    setSearchResults(null);
    try {
      const articlesRes = await knowledgeBaseApi.getArticles(categoryId);
      setArticles(articlesRes.articles || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load articles:', error);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await knowledgeBaseApi.searchArticles(searchQuery);
      setSearchResults(results.articles || []);
      setSelectedCategory(null);
      setSelectedArticle(null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Search failed:', error);
      }
      setSearchResults([]);
    }
  };

  const handleArticleSelect = async (article: Article) => {
    try {
      const fullArticle = await knowledgeBaseApi.getArticle(article.id);
      setSelectedArticle(fullArticle || article);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load article:', error);
      }
    }
  };

  const handleRateArticle = async (helpful: boolean) => {
    if (!selectedArticle) return;
    try {
      await knowledgeBaseApi.rateArticle(selectedArticle.id, helpful);
      // Update local state
      setSelectedArticle({
        ...selectedArticle,
        helpful_count: selectedArticle.helpful_count + (helpful ? 1 : 0)
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to rate article:', error);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedArticle(null);
    setSearchResults(null);
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading knowledge base...</div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      {/* Header */}
      <div className={cn(commonStyles.hero, themeStyles.hero)}>
        <h1 className={cn(commonStyles.heroTitle, themeStyles.heroTitle)}>Help Center</h1>
        <p className={cn(commonStyles.heroSubtitle, themeStyles.heroSubtitle)}>
          Find answers to your questions and learn how to get the most out of MegiLance
        </p>
        
        {/* Search */}
        <div className={cn(commonStyles.searchContainer, themeStyles.searchContainer)}>
          <input
            type="text"
            placeholder="Search for help articles..."
            aria-label="Search help articles"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
          <button
            className={cn(commonStyles.searchButton, themeStyles.searchButton)}
            onClick={handleSearch}
          >
            🔍 Search
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {(selectedCategory || searchResults) && (
        <div className={cn(commonStyles.breadcrumb, themeStyles.breadcrumb)}>
          <button onClick={handleBackToCategories} className={themeStyles.breadcrumbLink}>
            Help Center
          </button>
          {selectedCategory && (
            <>
              <span className={themeStyles.breadcrumbSeparator}>/</span>
              <button 
                onClick={handleBackToList} 
                className={cn(
                  themeStyles.breadcrumbLink,
                  selectedArticle && themeStyles.breadcrumbActive
                )}
              >
                {categories.find(c => c.id === selectedCategory)?.name}
              </button>
            </>
          )}
          {searchResults && (
            <>
              <span className={themeStyles.breadcrumbSeparator}>/</span>
              <span className={themeStyles.breadcrumbCurrent}>Search Results</span>
            </>
          )}
          {selectedArticle && (
            <>
              <span className={themeStyles.breadcrumbSeparator}>/</span>
              <span className={themeStyles.breadcrumbCurrent}>{selectedArticle.title}</span>
            </>
          )}
        </div>
      )}

      {/* Article View */}
      {selectedArticle ? (
        <div className={cn(commonStyles.articleView, themeStyles.articleView)}>
          <button 
            className={cn(commonStyles.backButton, themeStyles.backButton)}
            onClick={handleBackToList}
          >
            ← Back to articles
          </button>
          
          <article className={cn(commonStyles.article, themeStyles.article)}>
            <header className={commonStyles.articleHeader}>
              <h1 className={cn(commonStyles.articleTitle, themeStyles.articleTitle)}>
                {selectedArticle.title}
              </h1>
              <div className={cn(commonStyles.articleMeta, themeStyles.articleMeta)}>
                <span>Updated {new Date(selectedArticle.updated_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{selectedArticle.views.toLocaleString()} views</span>
              </div>
            </header>

            <div 
              className={cn(commonStyles.articleContent, themeStyles.articleContent)}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content.replace(/\n/g, '<br/>')) }}
            />

            <footer className={cn(commonStyles.articleFooter, themeStyles.articleFooter)}>
              <p>Was this article helpful?</p>
              <div className={commonStyles.feedbackButtons}>
                <button
                  className={cn(commonStyles.feedbackButton, themeStyles.feedbackButton)}
                  onClick={() => handleRateArticle(true)}
                >
                  👍 Yes
                </button>
                <button
                  className={cn(commonStyles.feedbackButton, themeStyles.feedbackButton)}
                  onClick={() => handleRateArticle(false)}
                >
                  👎 No
                </button>
              </div>
              <p className={cn(commonStyles.helpfulCount, themeStyles.helpfulCount)}>
                {selectedArticle.helpful_count} people found this helpful
              </p>
            </footer>
          </article>
        </div>
      ) : searchResults ? (
        /* Search Results */
        <div className={commonStyles.searchResults}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
            Search Results ({searchResults.length})
          </h2>
          {searchResults.length === 0 ? (
            <div className={cn(commonStyles.noResults, themeStyles.noResults)}>
              <p>No articles found for "{searchQuery}"</p>
              <button
                className={cn(commonStyles.clearButton, themeStyles.clearButton)}
                onClick={handleBackToCategories}
              >
                Browse all categories
              </button>
            </div>
          ) : (
            <div className={commonStyles.articlesList}>
              {searchResults.map((article) => (
                <button
                  key={article.id}
                  className={cn(commonStyles.articleCard, themeStyles.articleCard)}
                  onClick={() => handleArticleSelect(article)}
                >
                  <h3 className={cn(commonStyles.articleCardTitle, themeStyles.articleCardTitle)}>
                    {article.title}
                  </h3>
                  <p className={cn(commonStyles.articleCardExcerpt, themeStyles.articleCardExcerpt)}>
                    {article.excerpt}
                  </p>
                  <span className={cn(commonStyles.articleCardMeta, themeStyles.articleCardMeta)}>
                    {article.views.toLocaleString()} views
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : selectedCategory ? (
        /* Category Articles */
        <div className={commonStyles.categoryArticles}>
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
            {categories.find(c => c.id === selectedCategory)?.icon}{' '}
            {categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className={commonStyles.articlesList}>
            {articles.map((article) => (
              <button
                key={article.id}
                className={cn(commonStyles.articleCard, themeStyles.articleCard)}
                onClick={() => handleArticleSelect(article)}
              >
                <h3 className={cn(commonStyles.articleCardTitle, themeStyles.articleCardTitle)}>
                  {article.title}
                </h3>
                <p className={cn(commonStyles.articleCardExcerpt, themeStyles.articleCardExcerpt)}>
                  {article.excerpt}
                </p>
                <span className={cn(commonStyles.articleCardMeta, themeStyles.articleCardMeta)}>
                  {article.views.toLocaleString()} views
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Categories & Popular */
        <div className={commonStyles.mainContent}>
          {/* Categories */}
          <section className={commonStyles.categoriesSection}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              Browse by Category
            </h2>
            <div className={commonStyles.categoriesGrid}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={cn(commonStyles.categoryCard, themeStyles.categoryCard)}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <span className={commonStyles.categoryIcon}>{category.icon}</span>
                  <h3 className={cn(commonStyles.categoryName, themeStyles.categoryName)}>
                    {category.name}
                  </h3>
                  <p className={cn(commonStyles.categoryDescription, themeStyles.categoryDescription)}>
                    {category.description}
                  </p>
                  <span className={cn(commonStyles.articleCount, themeStyles.articleCount)}>
                    {category.article_count} articles
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Popular Articles */}
          <section className={commonStyles.popularSection}>
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
              📈 Popular Articles
            </h2>
            <div className={commonStyles.popularList}>
              {popularArticles.map((article, index) => (
                <button
                  key={article.id}
                  className={cn(commonStyles.popularItem, themeStyles.popularItem)}
                  onClick={() => handleArticleSelect(article)}
                >
                  <span className={cn(commonStyles.popularRank, themeStyles.popularRank)}>
                    {index + 1}
                  </span>
                  <div className={commonStyles.popularInfo}>
                    <h3 className={cn(commonStyles.popularTitle, themeStyles.popularTitle)}>
                      {article.title}
                    </h3>
                    <p className={cn(commonStyles.popularExcerpt, themeStyles.popularExcerpt)}>
                      {article.excerpt}
                    </p>
                  </div>
                  <span className={cn(commonStyles.popularViews, themeStyles.popularViews)}>
                    {article.views.toLocaleString()} views
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Contact Support */}
          <section className={cn(commonStyles.supportSection, themeStyles.supportSection)}>
            <div className={commonStyles.supportContent}>
              <h2>Can't find what you're looking for?</h2>
              <p>Our support team is here to help you 24/7</p>
              <div className={commonStyles.supportActions}>
                <a href="/support" className={cn(commonStyles.supportButton, themeStyles.supportButton)}>
                  💬 Contact Support
                </a>
                <a href="/support/tickets" className={cn(commonStyles.supportButtonSecondary, themeStyles.supportButtonSecondary)}>
                  📝 Submit a Ticket
                </a>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
