// @AI-HINT: Freelancer notes and tags management page
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/Button';
import { apiFetch } from '@/lib/api/core';
import commonStyles from './Notes.common.module.css';
import lightStyles from './Notes.light.module.css';
import darkStyles from './Notes.dark.module.css';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

interface Note {
  id: string;
  project_id: string;
  project_title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
  usage_count: number;
}

const colorOptions = [
  { value: '#fef3c7', label: 'Yellow' },
  { value: '#dbeafe', label: 'Blue' },
  { value: '#d1fae5', label: 'Green' },
  { value: '#fee2e2', label: 'Red' },
  { value: '#f3e8ff', label: 'Purple' },
  { value: '#ffedd5', label: 'Orange' },
  { value: '#f4f4f5', label: 'Gray' },
  { value: '#ffffff', label: 'White' }
];

export default function NotesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [editForm, setEditForm] = useState({
    content: '',
    color: '#fef3c7',
    tags: [] as string[],
    is_private: false
  });

  useEffect(() => {
    setMounted(true);
    // Fetch notes from backend API
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await apiFetch<any>('/notes-tags/notes?limit=50');
      const transformedNotes: Note[] = (Array.isArray(data) ? data : []).map((n: any) => ({
        id: n.id || String(n.id),
        project_id: n.entity_id || n.project_id || '',
        project_title: n.entity_type === 'project' ? `Project ${n.entity_id}` : 'General Note',
        content: n.content || '',
        color: n.color || '#fef3c7',
        is_pinned: n.is_pinned || false,
        is_private: n.is_private !== false,
        created_at: n.created_at || new Date().toISOString(),
        updated_at: n.updated_at || n.created_at || new Date().toISOString(),
        tags: n.tags || [],
      }));
      setNotes(transformedNotes);
      
      // Fetch tags
      try {
        const tagsData = await apiFetch<any>('/notes-tags/tags');
        setTags(Array.isArray(tagsData) ? tagsData : []);
      } catch {
        // Tags fetch failure is non-critical
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Notes] Failed to fetch notes:', error);
      }
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    setIsCreating(true);
    setEditForm({ content: '', color: '#fef3c7', tags: [], is_private: false });
  };

  const handleSaveNote = async () => {
    if (!editForm.content.trim()) return;

    try {
      if (isCreating) {
        await apiFetch('/notes-tags/notes', {
          method: 'POST',
          body: JSON.stringify({
            entity_type: 'general',
            entity_id: 'general',
            content: editForm.content,
            is_private: editForm.is_private,
            color: editForm.color,
          }),
        });
        await fetchNotes();
      } else if (isEditing) {
        await apiFetch(`/notes-tags/notes/${isEditing}`, {
          method: 'PUT',
          body: JSON.stringify({
            content: editForm.content,
            color: editForm.color,
          }),
        });
        await fetchNotes();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Notes] Failed to save note:', error);
      }
    }

    setIsCreating(false);
    setIsEditing(null);
    setEditForm({ content: '', color: '#fef3c7', tags: [], is_private: false });
  };

  const handleEditNote = (note: Note) => {
    setIsEditing(note.id);
    setEditForm({
      content: note.content,
      color: note.color,
      tags: note.tags,
      is_private: note.is_private
    });
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await apiFetch(`/notes-tags/notes/${noteId}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Notes] Failed to delete note:', error);
      }
    }
  };

  const handleTogglePin = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    try {
      await apiFetch(`/notes-tags/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_pinned: !note.is_pinned }),
      });
      setNotes(prev =>
        prev.map(n => (n.id === noteId ? { ...n, is_pinned: !n.is_pinned } : n))
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Notes] Failed to toggle pin:', error);
      }
    }
  };

  const handleTagToggle = (tagName: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const TAG_COLORS = ['#4573df', '#27AE60', '#e81123', '#F2C94C', '#ff9800', '#9B59B6', '#1ABC9C', '#E67E22'];
    const tagColor = TAG_COLORS[newTagName.length % TAG_COLORS.length];
    
    try {
      const newTag = await apiFetch<any>('/notes-tags/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: newTagName.toLowerCase().replace(/\s+/g, '-'),
          color: tagColor,
        }),
      });
      setTags(prev => [...prev, {
        id: newTag.id,
        name: newTag.name,
        color: newTag.color,
        usage_count: newTag.entity_count || 0,
      }]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Notes] Failed to create tag:', error);
      }
    }
    setNewTagName('');
  };

  const handleDeleteTag = async (tagId: string) => {
    const tagToDelete = tags.find(t => t.id === tagId);
    
    try {
      await apiFetch(`/notes-tags/tags/${tagId}`, { method: 'DELETE' });
      setTags(prev => prev.filter(t => t.id !== tagId));
      if (tagToDelete) {
        setNotes(prev =>
          prev.map(n => ({
            ...n,
            tags: n.tags.filter(t => t !== tagToDelete.name)
          }))
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Notes] Failed to delete tag:', error);
      }
    }
  };

  const filteredNotes = notes.filter(note => {
    if (showPinnedOnly && !note.is_pinned) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!note.content.toLowerCase().includes(query) && !note.project_title.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedTags.length > 0) {
      if (!selectedTags.some(tag => note.tags.includes(tag))) {
        return false;
      }
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.header, themeStyles.header)}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                Notes & Tags
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Organize your projects with notes and custom tags
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="secondary" onClick={() => setShowTagManager(true)}>
                Manage Tags
              </Button>
              <Button variant="primary" onClick={handleCreateNote}>
                New Note
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.filterBar, themeStyles.filterBar)}>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(commonStyles.searchInput, themeStyles.searchInput)}
            />
            <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
              <input
                type="checkbox"
                checked={showPinnedOnly}
                onChange={(e) => setShowPinnedOnly(e.target.checked)}
              />
              Pinned only
            </label>
          </div>
        </ScrollReveal>

        {/* Tags Filter */}
        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.tagsFilter, themeStyles.tagsFilter)}>
            <span className={cn(commonStyles.filterLabel, themeStyles.filterLabel)}>Filter by tags:</span>
            <div className={commonStyles.tagsList}>
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTags(prev =>
                    prev.includes(tag.name)
                      ? prev.filter(t => t !== tag.name)
                      : [...prev, tag.name]
                  )}
                  className={cn(
                    commonStyles.tagButton,
                    themeStyles.tagButton,
                    selectedTags.includes(tag.name) && commonStyles.tagSelected,
                    selectedTags.includes(tag.name) && themeStyles.tagSelected
                  )}
                  style={{ '--tag-color': tag.color } as React.CSSProperties}
                >
                  {tag.name}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className={cn(commonStyles.clearTags, themeStyles.clearTags)}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loading}>Loading notes...</div>
        ) : (
          <div className={commonStyles.notesContainer}>
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className={commonStyles.notesSection}>
                <ScrollReveal>
                  <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                    📌 Pinned
                  </h3>
                </ScrollReveal>
                <StaggerContainer className={commonStyles.notesGrid}>
                  {pinnedNotes.map(note => (
                    <StaggerItem key={note.id}>
                      <NoteCard
                        note={note}
                        onEdit={() => handleEditNote(note)}
                        onDelete={() => handleDeleteNote(note.id)}
                        onTogglePin={() => handleTogglePin(note.id)}
                        themeStyles={themeStyles}
                      />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            )}

            {/* Other Notes */}
            {unpinnedNotes.length > 0 && (
              <div className={commonStyles.notesSection}>
                {pinnedNotes.length > 0 && (
                  <ScrollReveal>
                    <h3 className={cn(commonStyles.sectionTitle, themeStyles.sectionTitle)}>
                      Other Notes
                    </h3>
                  </ScrollReveal>
                )}
                <StaggerContainer className={commonStyles.notesGrid}>
                  {unpinnedNotes.map(note => (
                    <StaggerItem key={note.id}>
                      <NoteCard
                        note={note}
                        onEdit={() => handleEditNote(note)}
                        onDelete={() => handleDeleteNote(note.id)}
                        onTogglePin={() => handleTogglePin(note.id)}
                        themeStyles={themeStyles}
                      />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            )}

            {filteredNotes.length === 0 && (
              <ScrollReveal>
                <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
                  <p>No notes found</p>
                  <Button variant="primary" onClick={handleCreateNote}>
                    Create Your First Note
                  </Button>
                </div>
              </ScrollReveal>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(isCreating || isEditing) && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2>{isCreating ? 'New Note' : 'Edit Note'}</h2>
                <button
                  onClick={() => { setIsCreating(false); setIsEditing(null); }}
                  className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <div className={commonStyles.formGroup}>
                  <label>Note Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your note..."
                    rows={5}
                    className={cn(commonStyles.textarea, themeStyles.textarea)}
                  />
                </div>
                <div className={commonStyles.formGroup}>
                  <label>Color</label>
                  <div className={commonStyles.colorPicker}>
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setEditForm(prev => ({ ...prev, color: color.value }))}
                        className={cn(
                          commonStyles.colorOption,
                          editForm.color === color.value && commonStyles.colorSelected
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className={commonStyles.formGroup}>
                  <label>Tags</label>
                  <div className={commonStyles.tagPicker}>
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.name)}
                        className={cn(
                          commonStyles.tagOption,
                          themeStyles.tagOption,
                          editForm.tags.includes(tag.name) && commonStyles.tagOptionSelected,
                          editForm.tags.includes(tag.name) && themeStyles.tagOptionSelected
                        )}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
                <label className={cn(commonStyles.privateCheck, themeStyles.privateCheck)}>
                  <input
                    type="checkbox"
                    checked={editForm.is_private}
                    onChange={(e) => setEditForm(prev => ({ ...prev, is_private: e.target.checked }))}
                  />
                  Private note (only visible to you)
                </label>
              </div>
              <div className={commonStyles.modalFooter}>
                <Button variant="secondary" onClick={() => { setIsCreating(false); setIsEditing(null); }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveNote}>
                  {isCreating ? 'Create Note' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tag Manager Modal */}
        {showTagManager && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              <div className={cn(commonStyles.modalHeader, themeStyles.modalHeader)}>
                <h2>Manage Tags</h2>
                <button
                  onClick={() => setShowTagManager(false)}
                  className={cn(commonStyles.closeBtn, themeStyles.closeBtn)}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.modalBody}>
                <div className={commonStyles.createTagRow}>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="New tag name..."
                    className={cn(commonStyles.input, themeStyles.input)}
                  />
                  <Button variant="primary" size="sm" onClick={handleCreateTag}>
                    Add Tag
                  </Button>
                </div>
                <div className={commonStyles.tagManagerList}>
                  {tags.map(tag => (
                    <div key={tag.id} className={cn(commonStyles.tagManagerItem, themeStyles.tagManagerItem)}>
                      <div className={commonStyles.tagInfo}>
                        <span
                          className={commonStyles.tagColor}
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className={cn(commonStyles.tagName, themeStyles.tagName)}>
                          {tag.name}
                        </span>
                        <span className={cn(commonStyles.tagCount, themeStyles.tagCount)}>
                          ({tag.usage_count} uses)
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className={cn(commonStyles.deleteTagBtn, themeStyles.deleteTagBtn)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

interface NoteCardProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  themeStyles: Record<string, string>;
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, themeStyles }: NoteCardProps) {
  return (
    <div
      className={cn(commonStyles.noteCard, themeStyles.noteCard)}
      style={{ backgroundColor: note.color }}
    >
      <div className={commonStyles.noteHeader}>
        <span className={cn(commonStyles.projectTitle, themeStyles.projectTitle)}>
          {note.project_title}
        </span>
        <div className={commonStyles.noteActions}>
          <button
            onClick={onTogglePin}
            className={cn(commonStyles.actionBtn, note.is_pinned && commonStyles.pinned)}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
          <button onClick={onEdit} className={commonStyles.actionBtn} title="Edit">
            ✏️
          </button>
          <button onClick={onDelete} className={commonStyles.actionBtn} title="Delete">
            🗑️
          </button>
        </div>
      </div>
      <p className={cn(commonStyles.noteContent, themeStyles.noteContent)}>
        {note.content}
      </p>
      {note.tags.length > 0 && (
        <div className={commonStyles.noteTags}>
          {note.tags.map(tag => (
            <span key={tag} className={cn(commonStyles.noteTag, themeStyles.noteTag)}>
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className={cn(commonStyles.noteMeta, themeStyles.noteMeta)}>
        <span>{new Date(note.updated_at).toLocaleDateString()}</span>
        {note.is_private && <span className={commonStyles.privateBadge}>🔒 Private</span>}
      </div>
    </div>
  );
}
