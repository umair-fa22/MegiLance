// @AI-HINT: Admin Tags management page — CRUD for tags with search, filter, toast, modal
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Modal from '@/app/components/Modal/Modal';
import Loader from '@/app/components/Loader/Loader';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import Badge from '@/app/components/Badge/Badge';
import { tagsApi } from '@/lib/api';
import { Plus, Edit, Trash2, Hash } from 'lucide-react';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';

import commonStyles from './Tags.common.module.css';
import lightStyles from './Tags.light.module.css';
import darkStyles from './Tags.dark.module.css';

interface TagItem { id: string; name: string; type: string; usage_count: number; }

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'skill', label: 'Skills' },
  { value: 'priority', label: 'Priority' },
  { value: 'location', label: 'Location' },
  { value: 'budget', label: 'Budget' },
  { value: 'general', label: 'General' },
];

const TAG_TYPE_OPTIONS = TYPE_OPTIONS.filter(o => o.value !== 'all');

const TYPE_BADGE_MAP: Record<string, 'info' | 'default' | 'success' | 'warning'> = {
  skill: 'info', priority: 'default', location: 'success', budget: 'warning', general: 'info',
};

export default function AdminTagsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<TagItem | null>(null);
  const [editTarget, setEditTarget] = useState<TagItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('general');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { setMounted(true); }, []);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tagsApi.list({ type: typeFilter === 'all' ? undefined : typeFilter } as any);
      const tagsList = Array.isArray(response) ? response : (response as any).tags || [];
      setTags(tagsList.map((t: any) => ({ id: t.id?.toString(), name: t.name, type: t.type || 'general', usage_count: t.usage_count || 0 })));
    } catch (err) { console.error('Failed to fetch tags:', err); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { if (mounted) fetchTags(); }, [mounted, fetchTags]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await (tagsApi as any).create({ name: formName.trim(), type: formType });
      showToast('Tag created');
      setShowCreateModal(false);
      setFormName(''); setFormType('general');
      fetchTags();
    } catch { showToast('Failed to create tag', 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editTarget || !formName.trim()) return;
    setSaving(true);
    try {
      await (tagsApi as any).update(editTarget.id, { name: formName.trim(), type: formType });
      showToast('Tag updated');
      setEditTarget(null);
      setFormName(''); setFormType('general');
      fetchTags();
    } catch { showToast('Failed to update tag', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await (tagsApi as any).delete(deleteTarget.id);
      setTags(prev => prev.filter(t => t.id !== deleteTarget.id));
      showToast('Tag deleted');
    } catch { showToast('Failed to delete tag', 'error'); }
    finally { setDeleteTarget(null); }
  };

  const openEdit = (tag: TagItem) => {
    setFormName(tag.name);
    setFormType(tag.type);
    setEditTarget(tag);
  };

  if (!mounted) return null;
  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;
  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Tags Management</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Manage skills, categories, and tags</p>
            </div>
            <Button variant="primary" iconBefore={<Plus size={16} />} onClick={() => { setFormName(''); setFormType('general'); setShowCreateModal(true); }}>
              Add Tag
            </Button>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={commonStyles.filters}>
            <div className={commonStyles.filterItem}>
              <Input type="text" placeholder="Search tags..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className={commonStyles.filterItem}>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={TYPE_OPTIONS} />
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loadingWrap}><Loader size="lg" /></div>
        ) : filteredTags.length > 0 ? (
          <StaggerContainer className={commonStyles.tagsGrid}>
            {filteredTags.map(tag => (
              <StaggerItem key={tag.id} className={cn(commonStyles.tagCard, themeStyles.tagCard)}>
                <div className={commonStyles.tagInfo}>
                  <Hash size={16} />
                  <span className={cn(commonStyles.tagName, themeStyles.tagName)}>{tag.name}</span>
                  <Badge variant={TYPE_BADGE_MAP[tag.type] || 'info'}>{tag.type}</Badge>
                </div>
                <span className={cn(commonStyles.usageCount, themeStyles.usageCount)}>{tag.usage_count} uses</span>
                <div className={commonStyles.tagActions}>
                  <Button variant="ghost" size="sm" iconBefore={<Edit size={14} />} onClick={() => openEdit(tag)}>{" "}</Button>
                  <Button variant="ghost" size="sm" iconBefore={<Trash2 size={14} />} onClick={() => setDeleteTarget(tag)}>{" "}</Button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <EmptyState
            title="No tags found"
            description={search ? 'Try a different search term.' : 'Create your first tag to get started.'}
            action={<Button variant="primary" size="sm" onClick={() => { setFormName(''); setFormType('general'); setShowCreateModal(true); }}>Add Tag</Button>}
          />
        )}

        {/* Create Modal */}
        <Modal isOpen={showCreateModal} title="Create Tag" onClose={() => setShowCreateModal(false)}>
          <div className={commonStyles.formGroup}>
            <Input placeholder="Tag name" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>
          <div className={commonStyles.formGroup}>
            <Select value={formType} onChange={(e) => setFormType(e.target.value)} options={TAG_TYPE_OPTIONS} />
          </div>
          <div className={commonStyles.modalFooter}>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={saving} onClick={handleCreate} disabled={!formName.trim()}>Create</Button>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={editTarget !== null} title="Edit Tag" onClose={() => setEditTarget(null)}>
          <div className={commonStyles.formGroup}>
            <Input placeholder="Tag name" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>
          <div className={commonStyles.formGroup}>
            <Select value={formType} onChange={(e) => setFormType(e.target.value)} options={TAG_TYPE_OPTIONS} />
          </div>
          <div className={commonStyles.modalFooter}>
            <Button variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button variant="primary" size="sm" isLoading={saving} onClick={handleEdit} disabled={!formName.trim()}>Save</Button>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <Modal isOpen={deleteTarget !== null} title="Delete Tag" onClose={() => setDeleteTarget(null)}>
          <p className={commonStyles.confirmText}>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className={commonStyles.modalFooter}>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>

        {toast && (
          <div className={cn(commonStyles.toast, themeStyles.toast, toast.type === 'error' && commonStyles.toastError, toast.type === 'error' && themeStyles.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
