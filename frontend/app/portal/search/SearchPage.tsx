// @AI-HINT: Advanced Search - global search with filters for projects, freelancers, and skills
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { searchApi } from '@/lib/api';
import type { SearchResult, AutocompleteResult, AutocompleteSuggestion } from '@/types/api';
import { Search, TrendingUp, Filter, Briefcase, User, Code, MapPin, DollarSign } from 'lucide-react';
import commonStyles from './SearchPage.common.module.css';
import lightStyles from './SearchPage.light.module.css';
import darkStyles from './SearchPage.dark.module.css';

const AdvancedSearch: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'projects' | 'freelancers'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [minBudget, setMinBudget] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  useEffect(() => {
    loadTrending();
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      loadAutocomplete();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadTrending = async () => {
    try {
      const response = await searchApi.getTrending('projects') as { trending_searches: any[] };
      setTrending(response.trending_searches || []);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load trending searches:', err);
      }
    }
  };

  const loadAutocomplete = async () => {
    try {
      const response = await searchApi.autocomplete(query) as AutocompleteResult;
      setSuggestions(response.suggestions);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load suggestions:', err);
      }
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setSuggestions([]);

      const filters: any = {};
      if (minBudget > 0) filters.min_budget = minBudget;
      if (maxBudget > 0) filters.max_budget = maxBudget;
      if (skills.length > 0) filters.skills = skills;
      if (location) filters.location = location;
      if (experienceLevel) filters.experience_level = experienceLevel;

      let response: any;
      if (searchType === 'projects') {
        response = await searchApi.projects(query, filters);
      } else if (searchType === 'freelancers') {
        response = await searchApi.freelancers(query, filters);
      } else {
        response = await searchApi.global(query);
      }

      setResults(response.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTrendingClick = (term: string) => {
    setQuery(term);
    setTimeout(() => handleSearch(), 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <h1 className={cn(commonStyles.title, themeStyles.title)}>Search</h1>
        <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
          Find projects, freelancers, and opportunities
        </p>
      </div>

      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          {error}
        </div>
      )}

      <div className={cn(commonStyles.searchCard, themeStyles.searchCard)}>
        <form onSubmit={handleSearch} className={commonStyles.searchForm}>
          <div className={commonStyles.searchInputGroup}>
            <Search size={20} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(commonStyles.searchInput, themeStyles.searchInput)}
              placeholder="Search projects, freelancers, skills..."
            />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className={cn(commonStyles.typeSelect, themeStyles.typeSelect)}
              aria-label="Filter search by type"
            >
              <option value="all">All</option>
              <option value="projects">Projects</option>
              <option value="freelancers">Freelancers</option>
            </select>
          </div>

          <div className={commonStyles.searchActions}>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(commonStyles.filterBtn, themeStyles.filterBtn)}
            >
              <Filter size={18} />
              Filters
            </button>
            <button
              type="submit"
              className={cn(commonStyles.searchBtn, themeStyles.searchBtn)}
            >
              Search
            </button>
          </div>
        </form>

        {suggestions.length > 0 && (
          <div className={cn(commonStyles.suggestions, themeStyles.suggestions)}>
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setQuery(suggestion.text);
                  setSuggestions([]);
                }}
                className={cn(commonStyles.suggestionItem, themeStyles.suggestionItem)}
              >
                <Search size={16} />
                <span>{suggestion.text}</span>
                {suggestion.type && (
                  <span className={cn(commonStyles.suggestionType, themeStyles.suggestionType)}>
                    {suggestion.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {showFilters && (
          <div className={cn(commonStyles.filtersPanel, themeStyles.filtersPanel)}>
            <div className={commonStyles.filtersGrid}>
              <div className={commonStyles.filterGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Min Budget</label>
                <input
                  type="number"
                  value={minBudget || ''}
                  onChange={(e) => setMinBudget(Number(e.target.value))}
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="0"
                />
              </div>
              <div className={commonStyles.filterGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Max Budget</label>
                <input
                  type="number"
                  value={maxBudget || ''}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="Unlimited"
                />
              </div>
              <div className={commonStyles.filterGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={cn(commonStyles.input, themeStyles.input)}
                  placeholder="Any location"
                />
              </div>
              <div className={commonStyles.filterGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>Experience</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className={cn(commonStyles.select, themeStyles.select)}
                >
                  <option value="">Any level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {trending.length > 0 && !query && (
        <div className={cn(commonStyles.trendingSection, themeStyles.trendingSection)}>
          <div className={commonStyles.trendingHeader}>
            <TrendingUp size={20} />
            <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>Trending Searches</h2>
          </div>
          <div className={commonStyles.trendingTags}>
            {trending.map((term, idx) => (
              <button
                key={idx}
                onClick={() => handleTrendingClick(term)}
                className={cn(commonStyles.trendingTag, themeStyles.trendingTag)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          Searching...
        </div>
      ) : results.length > 0 ? (
        <div className={commonStyles.results}>
          <div className={cn(commonStyles.resultsHeader, themeStyles.resultsHeader)}>
            Found {results.length} {results.length === 1 ? 'result' : 'results'}
          </div>
          <div className={commonStyles.resultsGrid}>
            {results.map((result, idx) => (
              <div
                key={idx}
                className={cn(commonStyles.resultCard, themeStyles.resultCard)}
              >
                <div className={commonStyles.resultHeader}>
                  <div className={cn(commonStyles.resultIcon, themeStyles.resultIcon)}>
                    {result.type === 'project' ? <Briefcase size={20} /> : <User size={20} />}
                  </div>
                  <span
                    className={cn(commonStyles.typeBadge, themeStyles.typeBadge)}
                    data-type={result.type}
                  >
                    {result.type}
                  </span>
                </div>

                <h3 className={cn(commonStyles.resultTitle, themeStyles.resultTitle)}>
                  {result.title || result.name}
                </h3>

                {result.description && (
                  <p className={cn(commonStyles.resultDescription, themeStyles.resultDescription)}>
                    {result.description.substring(0, 150)}
                    {result.description.length > 150 && '...'}
                  </p>
                )}

                <div className={commonStyles.resultMeta}>
                  {result.budget && (
                    <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                      <DollarSign size={14} />
                      {formatCurrency(result.budget)}
                    </span>
                  )}
                  {result.location && (
                    <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                      <MapPin size={14} />
                      {result.location}
                    </span>
                  )}
                  {result.skills && result.skills.length > 0 && (
                    <span className={cn(commonStyles.metaItem, themeStyles.metaItem)}>
                      <Code size={14} />
                      {result.skills.slice(0, 3).join(', ')}
                    </span>
                  )}
                </div>

                <a
                  href={result.url || '#'}
                  className={cn(commonStyles.viewBtn, themeStyles.viewBtn)}
                >
                  View Details
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : query && !loading ? (
        <div className={cn(commonStyles.empty, themeStyles.empty)}>
          <Search size={48} />
          <p>No results found for "{query}"</p>
          <p className={cn(commonStyles.emptyText, themeStyles.emptyText)}>
            Try different keywords or adjust your filters
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default AdvancedSearch;
