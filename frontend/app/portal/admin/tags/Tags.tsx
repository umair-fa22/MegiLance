// @AI-HINT: Tags Management component for admin - CRUD operations for tags system
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { tagsApi } from '@/lib/api';
import type { Tag, TagFormData } from '@/types/api';
import { Tag as TagIcon, Plus, Edit2, Trash2, TrendingUp, Hash } from 'lucide-react';
import Modal from '@/app/components/organisms/Modal/Modal';
import Button from '@/app/components/atoms/Button/Button';
import commonStyles from './Tags.common.module.css';
import lightStyles from './Tags.light.module.css';
import darkStyles from './Tags.dark.module.css';

const TagsManagement: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const [tags, setTags] = useState<Tag[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Form state
  const [name, setName] = useState('');
  const [tagType, setTagType] = useState<'skill' | 'priority' | 'location' | 'budget' | 'general'>('general');
  const [description, setDescription] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);

  useEffect(() => {
    loadTags();
    loadPopularTags();
  }, [filterType]);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (filterType !== 'all') {
        filters.type = filterType;
      }
      const response = await tagsApi.list(filters) as { tags: Tag[] };
      setTags(response.tags);
    } catch (err: any) {
      setError(err.message || 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularTags = async () => {
    try {
      const response = await tagsApi.getPopular() as { tags: Tag[] };
      setPopularTags(response.tags);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load popular tags:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      const formData: TagFormData = {
        name,
        type: tagType,
        description: description || undefined
      };

      if (editingTag) {
        await tagsApi.update(editingTag.id, formData);
      } else {
        await tagsApi.create(formData);
      }

      resetForm();
      setShowForm(false);
      loadTags();
      loadPopularTags();
    } catch (err: any) {
      setError(err.message || 'Failed to save tag');
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setTagType(tag.type);
    setDescription(tag.description || '');
    setShowForm(true);
  };

  const handleDelete = async (tagId: number) => {
    try {
      setError(null);
      await tagsApi.delete(tagId);
      loadTags();
      loadPopularTags();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tag');
    }
  };

  const resetForm = () => {
    setEditingTag(null);
    setName('');
    setTagType('general');
    setDescription('');
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      skill: '#3b82f6',
      priority: '#f59e0b',
      location: '#10b981',
      budget: '#8b5cf6',
      general: '#6b7280'
    };
    return colors[type] || colors.general;
  };

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Tags Management</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage tags for projects and freelancers
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className={cn(commonStyles.createBtn, themeStyles.createBtn)}
        >
          <Plus size={20} />
          Create Tag
        </button>
      </div>

      {error && (
        <div className={cn(commonStyles.error, themeStyles.error)}>
          {error}
        </div>
      )}

      {/* Popular Tags Widget */}
      <div className={cn(commonStyles.popularSection, themeStyles.popularSection)}>
        <div className={commonStyles.popularHeader}>
          <TrendingUp size={24} />
          <h2 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
            Popular Tags
          </h2>
        </div>
        <div className={commonStyles.popularTags}>
          {popularTags.map((tag) => (
            <div
              key={tag.id}
              className={cn(commonStyles.popularTag, themeStyles.popularTag)}
              style={{ borderColor: getTypeColor(tag.type) }}
            >
              <Hash size={16} style={{ color: getTypeColor(tag.type) }} />
              <span>{tag.name}</span>
              <span className={cn(commonStyles.usageCount, themeStyles.usageCount)}>
                {tag.usage_count || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className={cn(commonStyles.formCard, themeStyles.formCard)}>
          <h2 className={cn(commonStyles.formTitle, themeStyles.formTitle)}>
            {editingTag ? 'Edit Tag' : 'Create New Tag'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className={commonStyles.formRow}>
              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(commonStyles.input, themeStyles.input)}
                  required
                  placeholder="e.g., React, Urgent, Remote"
                />
              </div>

              <div className={commonStyles.formGroup}>
                <label className={cn(commonStyles.label, themeStyles.label)}>
                  Type *
                </label>
                <select
                  value={tagType}
                  onChange={(e) => setTagType(e.target.value as any)}
                  className={cn(commonStyles.select, themeStyles.select)}
                  required
                  aria-label="Select Tag Type"
                >
                  <option value="general">General</option>
                  <option value="skill">Skill</option>
                  <option value="priority">Priority</option>
                  <option value="location">Location</option>
                  <option value="budget">Budget</option>
                </select>
              </div>
            </div>

            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(commonStyles.textarea, themeStyles.textarea)}
                rows={3}
                placeholder="Add a description for this tag..."
              />
            </div>

            <div className={commonStyles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className={cn(commonStyles.cancelBtn, themeStyles.cancelBtn)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(commonStyles.submitBtn, themeStyles.submitBtn)}
              >
                {editingTag ? 'Update Tag' : 'Create Tag'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className={commonStyles.filterSection}>
        <label className={cn(commonStyles.filterLabel, themeStyles.label)}>
          Filter by Type:
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
        >
          <option value="all">All Tags</option>
          <option value="skill">Skills</option>
          <option value="priority">Priority</option>
          <option value="location">Location</option>
          <option value="budget">Budget</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Tags Grid */}
      {loading ? (
        <div className={cn(commonStyles.loading, themeStyles.loading)}>
          Loading tags...
        </div>
      ) : tags.length === 0 ? (
        <div className={cn(commonStyles.empty, themeStyles.empty)}>
          <TagIcon size={48} />
          <p>No tags found</p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className={cn(commonStyles.emptyBtn, themeStyles.emptyBtn)}
          >
            Create Your First Tag
          </button>
        </div>
      ) : (
        <div className={commonStyles.tagsGrid}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={cn(commonStyles.tagCard, themeStyles.tagCard)}
            >
              <div className={commonStyles.tagHeader}>
                <div className={commonStyles.tagInfo}>
                  <Hash size={20} style={{ color: getTypeColor(tag.type) }} />
                  <h3 className={cn(commonStyles.tagName, themeStyles.tagName)}>
                    {tag.name}
                  </h3>
                </div>
                <span
                  className={cn(commonStyles.typeBadge, themeStyles.typeBadge)}
                  style={{
                    backgroundColor: getTypeColor(tag.type) + '20',
                    color: getTypeColor(tag.type)
                  }}
                >
                  {tag.type}
                </span>
              </div>

              {tag.description && (
                <p className={cn(commonStyles.tagDescription, themeStyles.tagDescription)}>
                  {tag.description}
                </p>
              )}

              <div className={commonStyles.tagFooter}>
                <span className={cn(commonStyles.usageText, themeStyles.usageText)}>
                  Used {tag.usage_count || 0} times
                </span>
                <div className={commonStyles.tagActions}>
                  <button
                    onClick={() => handleEdit(tag)}
                    className={cn(commonStyles.actionBtn, themeStyles.actionBtn)}
                    data-action="edit"
                    aria-label="Edit tag"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => { setDeleteTagId(tag.id); setShowDeleteModal(true); }}
                    className={cn(commonStyles.actionBtn, themeStyles.actionBtn)}
                    data-action="delete"
                    aria-label="Delete tag"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTagId(null); }}
        title="Delete Tag"
        size="small"
      >
        <p>Are you sure you want to delete this tag?</p>
        <div className={commonStyles.modalActions}>
          <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteTagId(null); }}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (deleteTagId !== null) handleDelete(deleteTagId); setShowDeleteModal(false); setDeleteTagId(null); }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default TagsManagement;
