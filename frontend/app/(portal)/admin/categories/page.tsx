// @AI-HINT: Admin Categories management page with CRUD modal, stats, and tree view
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Loading from '@/app/components/Loading/Loading';
import Modal from '@/app/components/Modal/Modal';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { categoriesApi } from '@/lib/api';
import { 
  Layers, Plus, Edit, Trash2, ChevronRight, ChevronDown,
  FolderOpen, Folder, Search, LayoutGrid, Hash, AlertCircle
} from 'lucide-react';

import commonStyles from './Categories.common.module.css';
import lightStyles from './Categories.light.module.css';
import darkStyles from './Categories.dark.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  project_count: number;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) fetchCategories();
  }, [mounted]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesApi.getTree();
      const catList = Array.isArray(response) ? response : (response as any).categories || [];
      setCategories(catList);
      // Auto-expand top-level
      setExpandedIds(new Set(catList.map((c: Category) => c.id)));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const countAll = (cats: Category[]): { total: number; withChildren: number; totalProjects: number } => {
      let total = 0, withChildren = 0, totalProjects = 0;
      for (const cat of cats) {
        total++;
        totalProjects += cat.project_count || 0;
        if (cat.children && cat.children.length > 0) {
          withChildren++;
          const sub = countAll(cat.children);
          total += sub.total;
          withChildren += sub.withChildren;
          totalProjects += sub.totalProjects;
        }
      }
      return { total, withChildren, totalProjects };
    };
    return countAll(categories);
  }, [categories]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const slug = formSlug || formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, { name: formName, slug, description: formDescription });
      } else {
        await categoriesApi.create({ name: formName, slug, description: formDescription });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await categoriesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const filterCategories = (cats: Category[], query: string): Category[] => {
    if (!query) return cats;
    return cats.reduce<Category[]>((acc, cat) => {
      const matches = cat.name.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = cat.children ? filterCategories(cat.children, query) : [];
      if (matches || filteredChildren.length > 0) {
        acc.push({ ...cat, children: filteredChildren.length > 0 ? filteredChildren : cat.children });
      }
      return acc;
    }, []);
  };

  const displayCategories = filterCategories(categories, searchQuery);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id} className={commonStyles.categoryItem}>
        <div 
          className={cn(commonStyles.categoryRow, themeStyles.categoryRow)}
          style={{ paddingLeft: `${depth * 28 + 16}px` }}
        >
          <div className={commonStyles.categoryInfo}>
            {hasChildren ? (
              <button 
                className={cn(commonStyles.expandBtn, themeStyles.expandBtn)}
                onClick={() => toggleExpand(category.id)}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span className={commonStyles.expandPlaceholder} />
            )}
            <span className={cn(commonStyles.folderIcon, themeStyles.folderIcon)}>
              {hasChildren && isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
            </span>
            <span className={cn(commonStyles.categoryName, themeStyles.categoryName)}>
              {category.name}
            </span>
            <span className={cn(commonStyles.projectCount, themeStyles.projectCount)}>
              {category.project_count} project{category.project_count !== 1 ? 's' : ''}
            </span>
            {hasChildren && (
              <span className={cn(commonStyles.childCount, themeStyles.childCount)}>
                {category.children!.length} sub
              </span>
            )}
          </div>
          <div className={commonStyles.categoryActions}>
            <Button variant="ghost" size="sm" onClick={() => openEditModal(category)} title="Edit">
              <Edit size={15} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(category)} title="Delete">
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className={commonStyles.childrenContainer}>
            {category.children!.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!mounted) return <Loading />;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Categories</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage project categories and subcategories
              </p>
            </div>
            <Button variant="primary" iconBefore={<Plus size={18} />} onClick={openCreateModal}>
              Add Category
            </Button>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.1}>
          <div className={commonStyles.statsRow}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconCategories)}>
                <Layers size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.total}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Categories</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconParent)}>
                <LayoutGrid size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{categories.length}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Top-Level</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <div className={cn(commonStyles.statIcon, commonStyles.statIconProjects)}>
                <Hash size={20} />
              </div>
              <div className={commonStyles.statContent}>
                <span className={cn(commonStyles.statValue, themeStyles.statValue)}>{stats.totalProjects}</span>
                <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Projects</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Search */}
        <ScrollReveal delay={0.15}>
          <div className={cn(commonStyles.searchWrapper, themeStyles.searchWrapper)}>
            <Search size={18} className={cn(commonStyles.searchIcon, themeStyles.searchIcon)} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(commonStyles.searchInput, themeStyles.searchInput)}
            />
          </div>
        </ScrollReveal>

        {/* Category Tree */}
        {loading ? (
          <Loading />
        ) : displayCategories.length === 0 ? (
          <EmptyState
            icon={<Layers size={48} />}
            title={searchQuery ? 'No matching categories' : 'No categories yet'}
            description={searchQuery ? 'Try a different search term' : 'Create your first category to organize projects'}
            action={!searchQuery ? <Button variant="primary" onClick={openCreateModal}>Add Category</Button> : undefined}
          />
        ) : (
          <ScrollReveal delay={0.2}>
            <div className={cn(commonStyles.categoriesList, themeStyles.categoriesList)}>
              {displayCategories.map(cat => renderCategory(cat))}
            </div>
          </ScrollReveal>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <Modal
            isOpen
            onClose={() => setShowModal(false)}
            title={editingCategory ? 'Edit Category' : 'Create Category'}
          >
            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>Category Name</label>
              <Input
                value={formName}
                onChange={e => {
                  setFormName(e.target.value);
                  if (!editingCategory) {
                    setFormSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }
                }}
                placeholder="e.g., Web Development"
              />
            </div>
            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>Slug</label>
              <Input
                value={formSlug}
                onChange={e => setFormSlug(e.target.value)}
                placeholder="e.g., web-development"
              />
            </div>
            <div className={commonStyles.formGroup}>
              <label className={cn(commonStyles.label, themeStyles.label)}>Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                className={cn(commonStyles.textarea, themeStyles.textarea)}
              />
            </div>
            <div className={commonStyles.modalActions}>
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} isLoading={saving} disabled={!formName.trim()}>
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation */}
        {deleteTarget && (
          <Modal isOpen onClose={() => setDeleteTarget(null)} title="Delete Category">
            <div className={commonStyles.deleteContent}>
              <AlertCircle size={48} className={commonStyles.deleteIcon} />
              <p className={commonStyles.confirmText}>
                Delete &quot;{deleteTarget.name}&quot;? 
                {deleteTarget.children && deleteTarget.children.length > 0 && 
                  ` This will also remove ${deleteTarget.children.length} subcategories.`}
              </p>
            </div>
            <div className={commonStyles.modalActions}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </div>
          </Modal>
        )}
      </div>
    </PageTransition>
  );
}
