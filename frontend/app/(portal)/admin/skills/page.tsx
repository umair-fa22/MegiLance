// @AI-HINT: Admin skill taxonomy management page for organizing platform skills hierarchy
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api/core';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Textarea from '@/app/components/Textarea/Textarea';
import Modal from '@/app/components/Modal/Modal';
import Badge from '@/app/components/Badge/Badge';
import Loader from '@/app/components/Loader/Loader';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { Search, Plus, Edit3, Trash2, StarOff, CheckCircle } from 'lucide-react'
import commonStyles from './Skills.common.module.css';
import lightStyles from './Skills.light.module.css';
import darkStyles from './Skills.dark.module.css';

interface Skill {
  id: number;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

// Categories are derived from distinct skill.category values
interface CategoryInfo {
  name: string;
  count: number;
}

export default function SkillsAdminPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [skillForm, setSkillForm] = useState({
    name: '',
    category: '',
    description: '',
    icon: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    setMounted(true);
    loadSkillsData();
  }, []);

  const loadSkillsData = async () => {
    setLoading(true);
    try {
      const data: Skill[] = await apiFetch('/skills/?active_only=false&limit=200');
      setSkills(data);

      // Derive categories from distinct category values
      const catMap = new Map<string, number>();
      data.forEach(s => {
        const cat = s.category || 'Uncategorized';
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      });
      const cats: CategoryInfo[] = Array.from(catMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setCategories(cats);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load skills:', error);
      }
      showToast('Failed to load skills data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingSkill(null);
    setSkillForm({ name: '', category: '', description: '', icon: '', is_active: true, sort_order: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillForm({
      name: skill.name,
      category: skill.category || '',
      description: skill.description || '',
      icon: skill.icon || '',
      is_active: skill.is_active,
      sort_order: skill.sort_order
    });
    setIsModalOpen(true);
  };

  const handleSaveSkill = async () => {
    if (!skillForm.name.trim()) return;

    try {
      const body = {
        name: skillForm.name.trim(),
        description: skillForm.description || null,
        category: skillForm.category || null,
        icon: skillForm.icon || null,
        is_active: skillForm.is_active,
        sort_order: skillForm.sort_order
      };

      if (editingSkill) {
        await apiFetch(`/skills/${editingSkill.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body)
        });
        showToast('Skill updated successfully');
      } else {
        await apiFetch('/skills/', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        showToast('Skill created successfully');
      }

      setIsModalOpen(false);
      setEditingSkill(null);
      loadSkillsData();
    } catch (error: any) {
      showToast(error.message || 'Failed to save skill', 'error');
    }
  };

  const handleDeleteSkill = async (id: number) => {
    try {
      await apiFetch(`/skills/${id}`, { method: 'DELETE' });
      showToast('Skill deactivated successfully');
      setDeleteTargetId(null);
      loadSkillsData();
    } catch (error) {
      showToast('Failed to delete skill', 'error');
    }
  };

  const handleToggleActive = async (skill: Skill) => {
    try {
      await apiFetch(`/skills/${skill.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !skill.is_active })
      });
      showToast(`Skill ${skill.is_active ? 'deactivated' : 'activated'}`);
      loadSkillsData();
    } catch (error) {
      showToast('Failed to update skill', 'error');
    }
  };

  const filteredSkills = skills.filter(skill => {
    if (selectedCategory !== 'all' && (skill.category || 'Uncategorized') !== selectedCategory) return false;
    if (showActiveOnly && !skill.is_active) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return skill.name.toLowerCase().includes(query) || (skill.description || '').toLowerCase().includes(query);
    }
    return true;
  });

  const inactiveCount = skills.filter(s => !s.is_active).length;
  const totalActive = skills.filter(s => s.is_active).length;

  const categoryOptions = [
    { value: 'all', label: `All Categories (${skills.length})` },
    ...categories.map(c => ({ value: c.name, label: `${c.name} (${c.count})` }))
  ];

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={cn(commonStyles.header, themeStyles.header)}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                Skill Taxonomy
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage platform skills, categories, and relationships
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <div className={cn(commonStyles.statsRow, themeStyles.statsRow)}>
                <Badge variant="info">{totalActive} active</Badge>
                {inactiveCount > 0 && <Badge variant="warning">{inactiveCount} inactive</Badge>}
                <Badge variant="default">{categories.length} categories</Badge>
              </div>
              <Button variant="primary" onClick={openCreateModal}>
                <Plus size={16} /> Add Skill
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Filters */}
        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.filterBar, themeStyles.filterBar)}>
            <div className={commonStyles.searchWrap}>
              <Search size={16} className={commonStyles.searchIcon} />
              <Input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categoryOptions}
            />
            <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
              <input
                type="checkbox"
                checked={!showActiveOnly}
                onChange={(e) => setShowActiveOnly(!e.target.checked)}
              />
              Show inactive
            </label>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loading}>
            <Loader size="lg" />
          </div>
        ) : filteredSkills.length === 0 ? (
          <EmptyState
            title="No skills found"
            description={searchQuery ? 'Try adjusting your search or filters.' : 'Create your first skill to get started.'}
            action={!searchQuery ? <Button variant="primary" size="sm" onClick={openCreateModal}>Add Skill</Button> : undefined}
          />
        ) : (
          <StaggerContainer className={commonStyles.skillsList}>
            {filteredSkills.map(skill => (
              <StaggerItem key={skill.id} className={cn(commonStyles.skillCard, themeStyles.skillCard)}>
                <div className={commonStyles.skillInfo}>
                  <div className={commonStyles.skillHeader}>
                    <h4 className={cn(commonStyles.skillName, themeStyles.skillName)}>
                      {skill.icon && <span className={commonStyles.skillIcon}>{skill.icon}</span>}
                      {skill.name}
                    </h4>
                    {skill.category && (
                      <Badge variant="default">{skill.category}</Badge>
                    )}
                    {!skill.is_active && (
                      <Badge variant="warning">Inactive</Badge>
                    )}
                  </div>
                  {skill.description && (
                    <p className={cn(commonStyles.skillDesc, themeStyles.skillDesc)}>
                      {skill.description}
                    </p>
                  )}
                  <div className={cn(commonStyles.skillMeta, themeStyles.skillMeta)}>
                    <span>Sort: {skill.sort_order}</span>
                    <span>Created: {new Date(skill.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={commonStyles.skillActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(skill)}
                    title={skill.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {skill.is_active ? <StarOff size={14} /> : <CheckCircle size={14} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(skill)}>
                    <Edit3 size={14} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTargetId(skill.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Create/Edit Skill Modal */}
        <Modal
          isOpen={isModalOpen}
          title={editingSkill ? 'Edit Skill' : 'New Skill'}
          onClose={() => { setIsModalOpen(false); setEditingSkill(null); }}
        >
          <div className={commonStyles.modalBody}>
            <div className={commonStyles.formGroup}>
              <label>Skill Name</label>
              <Input
                type="text"
                value={skillForm.name}
                onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. React.js"
              />
            </div>
            <div className={commonStyles.formGroup}>
              <label>Category</label>
              <Input
                type="text"
                value={skillForm.category}
                onChange={(e) => setSkillForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Development, Design, Marketing"
              />
            </div>
            <div className={commonStyles.formGroup}>
              <label>Description (optional)</label>
              <Textarea
                value={skillForm.description}
                onChange={(e) => setSkillForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the skill"
                rows={3}
              />
            </div>
            <div className={commonStyles.formRow}>
              <div className={commonStyles.formGroup}>
                <label>Icon (emoji)</label>
                <Input
                  type="text"
                  value={skillForm.icon}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="💻"
                />
              </div>
              <div className={commonStyles.formGroup}>
                <label>Sort Order</label>
                <Input
                  type="number"
                  value={String(skillForm.sort_order)}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className={commonStyles.checkboxGroup}>
              <label className={cn(commonStyles.checkbox, themeStyles.checkbox)}>
                <input
                  type="checkbox"
                  checked={skillForm.is_active}
                  onChange={(e) => setSkillForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                Active
              </label>
            </div>
          </div>
          <div className={commonStyles.modalFooter}>
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); setEditingSkill(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveSkill}>
              {editingSkill ? 'Save Changes' : 'Create Skill'}
            </Button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteTargetId !== null}
          title="Delete Skill"
          onClose={() => setDeleteTargetId(null)}
        >
          <p className={commonStyles.confirmText}>
            Are you sure you want to deactivate this skill? This is a soft delete — the skill will be marked as inactive.
          </p>
          <div className={commonStyles.modalFooter}>
            <Button variant="secondary" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => deleteTargetId && handleDeleteSkill(deleteTargetId)}>
              Deactivate
            </Button>
          </div>
        </Modal>

        {/* Toast */}
        {toast && (
          <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast, toast.type === 'error' && themeStyles.toastError)}>
            {toast.message}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
