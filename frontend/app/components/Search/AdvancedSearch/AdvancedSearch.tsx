// @AI-HINT: Advanced search v2.0 — faceted filters, saved searches, autocomplete, trending section, relevance hints
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { 
  Search, SlidersHorizontal, Star, MapPin, DollarSign,
  Clock, Bookmark, Save, X, ChevronDown, TrendingUp, Flame, Sparkles
} from 'lucide-react';
import Button from '@/app/components/Button/Button';
import Select from '@/app/components/Select/Select';

import commonStyles from './AdvancedSearch.common.module.css';
import lightStyles from './AdvancedSearch.light.module.css';
import darkStyles from './AdvancedSearch.dark.module.css';

interface SearchFilters {
  query: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  budgetType: 'fixed' | 'hourly' | 'all';
  experienceLevel: string;
  location: string;
  skills: string[];
  rating: string;
  verified: boolean;
  availability: string;
  sortBy: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  alertsEnabled: boolean;
  createdAt: string;
}

interface SearchSuggestion {
  type: 'project' | 'freelancer' | 'skill' | 'category';
  text: string;
  count?: number;
}

interface TrendingItem {
  id: string;
  title?: string;
  name?: string;
  proposal_count?: number;
  avg_rating?: number;
  completed_projects?: number;
}

const SUGGESTION_ICONS: Record<string, React.ReactNode> = {
  project: <Bookmark size={14} />,
  freelancer: <Star size={14} />,
  skill: <Sparkles size={14} />,
  category: <SlidersHorizontal size={14} />,
};

export default function AdvancedSearch() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [trendingProjects, setTrendingProjects] = useState<TrendingItem[]>([]);
  const [trendingFreelancers, setTrendingFreelancers] = useState<TrendingItem[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    budgetMin: searchParams.get('budgetMin') || '',
    budgetMax: searchParams.get('budgetMax') || '',
    budgetType: (searchParams.get('budgetType') as any) || 'all',
    experienceLevel: searchParams.get('experience') || 'all',
    location: searchParams.get('location') || '',
    skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
    rating: searchParams.get('rating') || 'all',
    verified: searchParams.get('verified') === 'true',
    availability: searchParams.get('availability') || 'all',
    sortBy: searchParams.get('sort') || 'relevance',
  });

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;
  const styles = {
    container: cn(commonStyles.container, themeStyles.container),
    searchBar: cn(commonStyles.searchBar, themeStyles.searchBar),
    searchInput: cn(commonStyles.searchInput, themeStyles.searchInput),
    searchButton: cn(commonStyles.searchButton, themeStyles.searchButton),
    filterToggle: cn(commonStyles.filterToggle, themeStyles.filterToggle),
    filtersPanel: cn(commonStyles.filtersPanel, themeStyles.filtersPanel),
    filterGroup: cn(commonStyles.filterGroup, themeStyles.filterGroup),
    filterLabel: cn(commonStyles.filterLabel, themeStyles.filterLabel),
    suggestionsDropdown: cn(commonStyles.suggestionsDropdown, themeStyles.suggestionsDropdown),
    suggestionItem: cn(commonStyles.suggestionItem, themeStyles.suggestionItem),
    savedSearches: cn(commonStyles.savedSearches, themeStyles.savedSearches),
    savedSearchItem: cn(commonStyles.savedSearchItem, themeStyles.savedSearchItem),
    recentSearches: cn(commonStyles.recentSearches, themeStyles.recentSearches),
    activeFilters: cn(commonStyles.activeFilters, themeStyles.activeFilters),
    filterBadge: cn(commonStyles.filterBadge, themeStyles.filterBadge),
    saveDialog: cn(commonStyles.saveDialog, themeStyles.saveDialog),
    searchInputWrapper: commonStyles.searchInputWrapper,
    searchIcon: cn(commonStyles.searchIcon, themeStyles.searchIcon),
    suggestionText: commonStyles.suggestionText,
    suggestionCount: commonStyles.suggestionCount,
    inlineIcon: commonStyles.inlineIcon,
    filterCountBadge: cn(commonStyles.filterCountBadge, themeStyles.filterCountBadge),
    chevronIcon: commonStyles.chevronIcon,
    chevronIconOpen: commonStyles.chevronIconOpen,
    recentLabel: commonStyles.recentLabel,
    recentButton: commonStyles.recentButton,
    filterGrid: commonStyles.filterGrid,
    inlineLabelIcon: commonStyles.inlineLabelIcon,
    budgetInputGroup: commonStyles.budgetInputGroup,
    filterInput: cn(commonStyles.filterInput, themeStyles.filterInput),
    filterInputFull: cn(commonStyles.filterInputFull, themeStyles.filterInputFull),
    checkboxLabel: commonStyles.checkboxLabel,
    checkbox: commonStyles.checkbox,
    filterActions: commonStyles.filterActions,
    savedSearchesTitle: commonStyles.savedSearchesTitle,
    savedSearchesList: commonStyles.savedSearchesList,
    dialogInner: cn(commonStyles.dialogInner, themeStyles.dialogInner),
    dialogTitle: commonStyles.dialogTitle,
    dialogInput: cn(commonStyles.dialogInput, themeStyles.dialogInput),
    dialogActions: commonStyles.dialogActions,
  };

  useEffect(() => {
    loadRecentSearches();
    loadSavedSearches();
    loadTrending();
  }, []);

  useEffect(() => {
    if (filters.query.length > 2) {
      fetchSuggestions(filters.query);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [filters.query]);

  const loadRecentSearches = () => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent).slice(0, 5));
      } catch {
        setRecentSearches([]);
      }
    }
  };

  const loadSavedSearches = async () => {
    try {
      const data: any = await (api.searches as any).getSaved?.() || [];
      setSavedSearches(data);
    } catch {
      // Failed to load saved searches
    }
  };

  const loadTrending = async () => {
    try {
      const [projects, freelancers]: any[] = await Promise.allSettled([
        (api.search as any).trending?.('projects', 5),
        (api.search as any).trending?.('freelancers', 5),
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : []));
      setTrendingProjects(Array.isArray(projects) ? projects : []);
      setTrendingFreelancers(Array.isArray(freelancers) ? freelancers : []);
    } catch {
      // Trending is non-critical
    }
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      const data: any = await (api.search as any).suggestions?.(query) || [];
      setSuggestions(data);
      setShowSuggestions(true);
    } catch {
      // Failed to fetch suggestions
    }
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    const recent = [filters.query, ...recentSearches.filter(s => s !== filters.query)].slice(0, 5);
    setRecentSearches(recent);
    localStorage.setItem('recentSearches', JSON.stringify(recent));

    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.budgetMin) params.set('budgetMin', filters.budgetMin);
    if (filters.budgetMax) params.set('budgetMax', filters.budgetMax);
    if (filters.budgetType !== 'all') params.set('budgetType', filters.budgetType);
    if (filters.experienceLevel !== 'all') params.set('experience', filters.experienceLevel);
    if (filters.location) params.set('location', filters.location);
    if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
    if (filters.rating !== 'all') params.set('rating', filters.rating);
    if (filters.verified) params.set('verified', 'true');
    if (filters.availability !== 'all') params.set('availability', filters.availability);
    if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);

    router.push(`/search/results?${params.toString()}`);
    setShowSuggestions(false);
    setLoading(false);
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;

    try {
      await (api.searches as any).save?.({
        name: searchName,
        filters,
        alertsEnabled: false,
      });

      await loadSavedSearches();
      setShowSaveDialog(false);
      setSearchName('');
    } catch {
      // Failed to save search
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    handleSearch();
  };

  const deleteSavedSearch = async (id: string) => {
    try {
      await (api.searches as any).delete?.(id);
      await loadSavedSearches();
    } catch {
      // Failed to delete search
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'all',
      budgetMin: '',
      budgetMax: '',
      budgetType: 'all',
      experienceLevel: 'all',
      location: '',
      skills: [],
      rating: 'all',
      verified: false,
      availability: 'all',
      sortBy: 'relevance',
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'query' || key === 'sortBy') return false;
    if (key === 'skills') return (value as string[]).length > 0;
    if (typeof value === 'boolean') return value;
    return value && value !== 'all' && value !== '';
  }).length;

  const hasTrending = trendingProjects.length > 0 || trendingFreelancers.length > 0;

  return (
    <div className={styles.container}>
      <form onSubmit={handleSearch} className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search projects, freelancers, or skills..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            className={styles.searchInput}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestionsDropdown}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className={styles.suggestionItem}
                  onClick={() => {
                    setFilters({ ...filters, query: suggestion.text });
                    setShowSuggestions(false);
                  }}
                >
                  <span className={commonStyles.suggestionIcon}>
                    {SUGGESTION_ICONS[suggestion.type] || <Search size={14} />}
                  </span>
                  <span className={styles.suggestionText}>{suggestion.text}</span>
                  {suggestion.count != null && (
                    <span className={styles.suggestionCount}>({suggestion.count})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="primary" type="submit" isLoading={loading}>
          <Search size={16} className={styles.inlineIcon} />
          Search
        </Button>

        <button
          type="button"
          className={styles.filterToggle}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} className={styles.inlineIcon} />
          Filters
          {activeFilterCount > 0 && (
            <span className={styles.filterCountBadge}>
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={16} className={cn(styles.chevronIcon, showFilters && styles.chevronIconOpen)} />
        </button>
      </form>

      {recentSearches.length > 0 && (
        <div className={styles.recentSearches}>
          <span className={styles.recentLabel}>Recent:</span>
          {recentSearches.map((search, index) => (
            <button
              key={index}
              className={styles.recentButton}
              onClick={() => {
                setFilters({ ...filters, query: search });
                handleSearch();
              }}
            >
              {search}
            </button>
          ))}
        </div>
      )}

      {/* Trending Section */}
      {hasTrending && !filters.query && (
        <div className={cn(commonStyles.trendingSection, themeStyles.trendingSection)}>
          <h3 className={cn(commonStyles.trendingSectionTitle, themeStyles.trendingSectionTitle)}>
            <Flame size={16} /> Trending Now
          </h3>
          <div className={commonStyles.trendingGrid}>
            {trendingProjects.length > 0 && (
              <div className={commonStyles.trendingColumn}>
                <h4 className={cn(commonStyles.trendingColumnTitle, themeStyles.trendingColumnTitle)}>
                  <TrendingUp size={14} /> Hot Projects
                </h4>
                {trendingProjects.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    className={cn(commonStyles.trendingItem, themeStyles.trendingItem)}
                    onClick={() => {
                      setFilters({ ...filters, query: item.title || '' });
                      handleSearch();
                    }}
                  >
                    <span className={commonStyles.trendingItemTitle}>{item.title}</span>
                    {item.proposal_count != null && (
                      <span className={cn(commonStyles.trendingBadge, themeStyles.trendingBadge)}>
                        {item.proposal_count} bids
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {trendingFreelancers.length > 0 && (
              <div className={commonStyles.trendingColumn}>
                <h4 className={cn(commonStyles.trendingColumnTitle, themeStyles.trendingColumnTitle)}>
                  <Star size={14} /> Top Freelancers
                </h4>
                {trendingFreelancers.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    className={cn(commonStyles.trendingItem, themeStyles.trendingItem)}
                    onClick={() => {
                      setFilters({ ...filters, query: item.name || '' });
                      handleSearch();
                    }}
                  >
                    <span className={commonStyles.trendingItemTitle}>{item.name}</span>
                    {item.avg_rating != null && (
                      <span className={cn(commonStyles.trendingBadge, themeStyles.trendingBadge)}>
                        <Star size={10} /> {item.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Category</label>
              <Select
                id="category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'web-dev', label: 'Web Development' },
                  { value: 'mobile-dev', label: 'Mobile Development' },
                  { value: 'design', label: 'Design' },
                  { value: 'writing', label: 'Writing' },
                  { value: 'marketing', label: 'Marketing' },
                  { value: 'data', label: 'Data & Analytics' },
                  { value: 'devops', label: 'DevOps & Cloud' },
                  { value: 'ai-ml', label: 'AI & Machine Learning' },
                ]}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Budget Type</label>
              <Select
                id="budgetType"
                value={filters.budgetType}
                onChange={(e) => setFilters({ ...filters, budgetType: e.target.value as any })}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'fixed', label: 'Fixed Price' },
                  { value: 'hourly', label: 'Hourly Rate' },
                ]}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Experience Level</label>
              <Select
                id="experience"
                value={filters.experienceLevel}
                onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
                options={[
                  { value: 'all', label: 'All Levels' },
                  { value: 'entry', label: 'Entry Level' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'expert', label: 'Expert' },
                ]}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <DollarSign size={14} className={styles.inlineLabelIcon} />
                Budget Range
              </label>
              <div className={styles.budgetInputGroup}>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.budgetMin}
                  onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                  className={styles.filterInput}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                  className={styles.filterInput}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <MapPin size={14} className={styles.inlineLabelIcon} />
                Location
              </label>
              <input
                type="text"
                placeholder="City, country, or remote"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className={styles.filterInputFull}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Star size={14} className={styles.inlineLabelIcon} />
                Minimum Rating
              </label>
              <Select
                id="rating"
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                options={[
                  { value: 'all', label: 'All Ratings' },
                  { value: '3.5', label: '3.5+ Stars' },
                  { value: '4', label: '4+ Stars' },
                  { value: '4.5', label: '4.5+ Stars' },
                ]}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <Clock size={14} className={styles.inlineLabelIcon} />
                Availability
              </label>
              <Select
                id="availability"
                value={filters.availability}
                onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'immediate', label: 'Available Now' },
                  { value: 'within-week', label: 'Within a Week' },
                  { value: 'within-month', label: 'Within a Month' },
                ]}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                  className={styles.checkbox}
                />
                <span className={styles.filterLabel}>Verified Only</span>
              </label>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Sort By</label>
              <Select
                id="sortBy"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                options={[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'trending', label: 'Trending' },
                  { value: 'date', label: 'Newest First' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'rating', label: 'Highest Rated' },
                ]}
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <Button variant="outline" onClick={clearFilters}>
              <X size={14} className={styles.inlineIcon} />
              Clear Filters
            </Button>
            <Button variant="secondary" onClick={() => setShowSaveDialog(true)}>
              <Save size={14} className={styles.inlineIcon} />
              Save Search
            </Button>
          </div>
        </div>
      )}

      {savedSearches.length > 0 && (
        <div className={styles.savedSearches}>
          <h3 className={styles.savedSearchesTitle}>
            <Bookmark size={14} className={styles.inlineLabelIcon} />
            Saved Searches
          </h3>
          <div className={styles.savedSearchesList}>
            {savedSearches.map(search => (
              <div key={search.id} className={styles.savedSearchItem}>
                <button onClick={() => loadSavedSearch(search)}>
                  {search.name}
                </button>
                <button onClick={() => deleteSavedSearch(search.id)} aria-label="Delete saved search">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className={styles.saveDialog}>
          <div className={styles.dialogInner}>
            <h3 className={styles.dialogTitle}>Save Search</h3>
            <input
              type="text"
              placeholder="Search name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className={styles.dialogInput}
            />
            <div className={styles.dialogActions}>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveSearch}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
