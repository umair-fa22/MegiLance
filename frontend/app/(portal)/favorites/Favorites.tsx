// @AI-HINT: Favorites/Bookmarks component - save and manage favorite projects and profiles
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { favoritesApi } from '@/lib/api';
import type { Favorite } from '@/types/api';
import { Star, Briefcase, User, Trash2, ExternalLink, Search } from 'lucide-react';
import Modal from '@/app/components/organisms/Modal/Modal';
import Button from '@/app/components/atoms/Button/Button';
import Loader from '@/app/components/atoms/Loader/Loader';
import commonStyles from './Favorites.common.module.css';
import lightStyles from './Favorites.light.module.css';
import darkStyles from './Favorites.dark.module.css';

const Favorites: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Favorite | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadFavorites();
  }, [filterType]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const targetType = filterType !== 'all' ? (filterType as 'freelancer' | 'client' | 'project') : undefined;
      const response = await favoritesApi.list(targetType) as { favorites: Favorite[] };
      setFavorites(response.favorites);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load favorites';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favorite: Favorite) => {
    setDeleteTarget(null);

    try {
      setError(null);
      await favoritesApi.delete(favorite.id);
      showToast('Removed from favorites.');
      loadFavorites();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to remove favorite', 'error');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Briefcase size={20} />;
      case 'freelancer':
      case 'client':
        return <User size={20} />;
      default:
        return <Star size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getItemUrl = (favorite: Favorite) => {
    switch (favorite.target_type) {
      case 'project':
        return `/portal/projects/${favorite.target_id}`;
      case 'freelancer':
        return `/portal/freelancers/${favorite.target_id}`;
      case 'client':
        return `/portal/clients/${favorite.target_id}`;
      default:
        return '#';
    }
  };

  const filteredFavorites = useMemo(() => {
    if (!searchQuery) return favorites;
    const q = searchQuery.toLowerCase();
    return favorites.filter(f =>
      f.target_type.toLowerCase().includes(q) ||
      String(f.target_id).includes(q) ||
      (f as any).title?.toLowerCase().includes(q) ||
      (f as any).name?.toLowerCase().includes(q)
    );
  }, [favorites, searchQuery]);

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Favorites</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Your saved items and bookmarks
          </p>
        </div>
      </div>

      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          {error}
        </div>
      )}

      <div className={commonStyles.statsRow}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <Star size={24} className={cn(commonStyles.statIcon, themeStyles.statIcon)} />
          <div>
            <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
              {favorites.length}
            </div>
            <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
              Total Favorites
            </div>
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <Briefcase size={24} className={cn(commonStyles.statIcon, themeStyles.statIcon)} />
          <div>
            <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
              {favorites.filter(f => f.target_type === 'project').length}
            </div>
            <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
              Projects
            </div>
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <User size={24} className={cn(commonStyles.statIcon, themeStyles.statIcon)} />
          <div>
            <div className={cn(commonStyles.statValue, themeStyles.statValue)}>
              {favorites.filter(f => f.target_type === 'freelancer' || f.target_type === 'client').length}
            </div>
            <div className={cn(commonStyles.statLabel, themeStyles.statLabel)}>
              Profiles
            </div>
          </div>
        </div>
      </div>

      <div className={commonStyles.filterSection}>
        <div className={commonStyles.searchWrapper}>
          <Search size={16} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
            aria-label="Search favorites"
          />
        </div>
        <div className={commonStyles.filterRight}>
          <label className={cn(commonStyles.filterLabel, themeStyles.label)}>
            Filter:
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
            aria-label="Filter favorites by type"
          >
            <option value="all">All Favorites</option>
            <option value="project">Projects</option>
            <option value="freelancer">Freelancers</option>
            <option value="client">Clients</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader size="lg" />
      ) : filteredFavorites.length === 0 ? (
        <div className={cn(commonStyles.empty, themeStyles.empty)}>
          <Star size={48} />
          <p>No favorites yet</p>
          <p className={cn(commonStyles.emptyText, themeStyles.emptyText)}>
            Start saving projects and profiles you&apos;re interested in
          </p>
        </div>
      ) : (
        <div className={commonStyles.favoritesGrid} role="list">
          {filteredFavorites.map((favorite) => (
            <div
              key={favorite.id}
              className={cn(commonStyles.favoriteCard, themeStyles.favoriteCard)}
            >
              <div className={commonStyles.cardHeader}>
                <div className={cn(commonStyles.typeIcon, themeStyles.typeIcon)}>
                  {getIcon(favorite.target_type)}
                </div>
                <span
                  className={cn(commonStyles.typeBadge, themeStyles.typeBadge)}
                  data-type={favorite.target_type}
                >
                  {favorite.target_type}
                </span>
              </div>

              <div className={commonStyles.cardBody}>
                <h3 className={cn(commonStyles.itemTitle, themeStyles.itemTitle)}>
                  {favorite.target_type} #{favorite.target_id}
                </h3>

                <div className={cn(commonStyles.savedDate, themeStyles.savedDate)}>
                  Saved on {formatDate(favorite.created_at)}
                </div>
              </div>

              <div className={commonStyles.cardActions}>
                <a
                  href={getItemUrl(favorite)}
                  className={cn(commonStyles.viewBtn, themeStyles.viewBtn)}
                >
                  <ExternalLink size={16} />
                  View
                </a>
                <button
                  onClick={() => setDeleteTarget(favorite)}
                  className={cn(commonStyles.removeBtn, themeStyles.removeBtn)}
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={deleteTarget !== null} title="Remove Favorite" onClose={() => setDeleteTarget(null)}>
        <p>Remove <strong>{deleteTarget?.target_type} #{deleteTarget?.target_id}</strong> from your favorites?</p>
        <div className={commonStyles.actionRow}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (deleteTarget) handleRemove(deleteTarget); }}>Remove</Button>
        </div>
      </Modal>

      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast, toast.type === 'error' && themeStyles.toastError)}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Favorites;
