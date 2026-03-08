// @AI-HINT: Proposal templates page for reusable proposal structures
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { FileText, BarChart3, Star, Eye, Pencil, Copy, Trash2, Plus } from 'lucide-react';
import { proposalTemplatesApi as _proposalTemplatesApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Modal from '@/app/components/Modal/Modal';
import Loader from '@/app/components/Loader/Loader';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './Templates.common.module.css';
import lightStyles from './Templates.light.module.css';
import darkStyles from './Templates.dark.module.css';

const proposalTemplatesApi: any = _proposalTemplatesApi;

interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  cover_letter: string;
  milestones: Milestone[];
  default_rate?: number;
  default_rate_type?: 'hourly' | 'fixed';
  tags: string[];
  use_count: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface Milestone {
  title: string;
  description: string;
  percentage: number;
}

export default function ProposalTemplatesPage() {
  const { resolvedTheme } = useTheme();
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ProposalTemplate> | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProposalTemplate | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await proposalTemplatesApi.getAll();
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate?.name || !editingTemplate.cover_letter) {
      showToast('Please fill in name and cover letter', 'error');
      return;
    }
    try {
      if (editingTemplate.id) {
        await proposalTemplatesApi.update(editingTemplate.id, editingTemplate);
      } else {
        await proposalTemplatesApi.create(editingTemplate);
      }
      setShowModal(false);
      setEditingTemplate(null);
      showToast('Template saved successfully');
      loadTemplates();
    } catch (err) {
      showToast('Failed to save template', 'error');
    }
  };

  const handleDelete = async (template: ProposalTemplate) => {
    try {
      await proposalTemplatesApi.delete(template.id);
      setDeleteTarget(null);
      showToast('Template deleted');
      loadTemplates();
    } catch (err) {
      showToast('Failed to delete template', 'error');
    }
  };

  const handleSetDefault = async (template: ProposalTemplate) => {
    try {
      await proposalTemplatesApi.update(template.id, { is_default: true });
      loadTemplates();
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  const handleDuplicate = async (template: ProposalTemplate) => {
    try {
      await proposalTemplatesApi.create({
        ...template,
        id: undefined,
        name: `${template.name} (Copy)`,
        is_default: false,
        use_count: 0
      });
      loadTemplates();
    } catch (err) {
      console.error('Failed to duplicate template:', err);
    }
  };

  const openNewTemplate = () => {
    setEditingTemplate({
      name: '',
      description: '',
      cover_letter: '',
      milestones: [],
      tags: [],
      is_default: false
    });
    setShowModal(true);
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setEditingTemplate({
      ...editingTemplate,
      tags: [...(editingTemplate?.tags || []), tagInput.trim()]
    });
    setTagInput('');
  };

  const removeTag = (index: number) => {
    const newTags = [...(editingTemplate?.tags || [])];
    newTags.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, tags: newTags });
  };

  const addMilestone = () => {
    setEditingTemplate({
      ...editingTemplate,
      milestones: [...(editingTemplate?.milestones || []), { title: '', description: '', percentage: 25 }]
    });
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const newMilestones = [...(editingTemplate?.milestones || [])];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setEditingTemplate({ ...editingTemplate, milestones: newMilestones });
  };

  const removeMilestone = (index: number) => {
    const newMilestones = [...(editingTemplate?.milestones || [])];
    newMilestones.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, milestones: newMilestones });
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Proposal Templates</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Create reusable templates to speed up your proposals
              </p>
            </div>
            <Button variant="primary" onClick={openNewTemplate}>
              + Create Template
            </Button>
          </header>
        </ScrollReveal>

        {/* Stats */}
        <StaggerContainer delay={0.1} className={commonStyles.statsRow}>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}><FileText size={20} /></span>
              <div className={commonStyles.statInfo}>
                <strong>{templates.length}</strong>
                <span>Templates</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}><BarChart3 size={20} /></span>
              <div className={commonStyles.statInfo}>
                <strong>{templates.reduce((sum, t) => sum + (t.use_count || 0), 0)}</strong>
                <span>Total Uses</span>
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statIcon}><Star size={20} /></span>
              <div className={commonStyles.statInfo}>
                <strong>{templates.find(t => t.is_default)?.name || 'None'}</strong>
                <span>Default Template</span>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <ScrollReveal delay={0.2}>
            <EmptyState
              title="No Templates Yet"
              description="Create your first proposal template to save time on future proposals."
              action={<Button variant="primary" size="sm" onClick={openNewTemplate}>Create Template</Button>}
            />
          </ScrollReveal>
        ) : (
          <StaggerContainer delay={0.2} className={commonStyles.templatesGrid}>
            {templates.map(template => (
              <StaggerItem key={template.id}>
                <div
                  className={cn(
                    commonStyles.templateCard,
                    themeStyles.templateCard,
                    template.is_default && commonStyles.defaultCard
                  )}
                >
                  {template.is_default && (
                    <div className={commonStyles.defaultBadge}><Star size={14} /> Default</div>
                  )}

                  <div className={commonStyles.cardHeader}>
                    <h3>{template.name}</h3>
                    <span className={commonStyles.useCount}>
                      Used {template.use_count || 0} times
                    </span>
                  </div>

                  {template.description && (
                    <p className={cn(commonStyles.cardDesc, themeStyles.cardDesc)}>
                      {template.description}
                    </p>
                  )}

                  <div className={commonStyles.coverPreview}>
                    <h4>Cover Letter Preview:</h4>
                    <p>{template.cover_letter.substring(0, 150)}...</p>
                  </div>

                  {template.milestones && template.milestones.length > 0 && (
                    <div className={commonStyles.milestonesPreview}>
                      <h4>Milestones: {template.milestones.length}</h4>
                      <div className={commonStyles.milestoneBar}>
                        {template.milestones.map((m, i) => (
                          <div
                            key={i}
                            className={commonStyles.milestoneSegment}
                            style={{ width: `${m.percentage}%` }}
                            title={`${m.title}: ${m.percentage}%`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {template.tags && template.tags.length > 0 && (
                    <div className={commonStyles.tagsList}>
                      {template.tags.map((tag, i) => (
                        <span key={i} className={cn(commonStyles.tag, themeStyles.tag)}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={commonStyles.cardActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconBefore={<Eye size={14} />}
                      onClick={() => setPreviewTemplate(template)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconBefore={<Pencil size={14} />}
                      onClick={() => { setEditingTemplate(template); setShowModal(true); }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconBefore={<Copy size={14} />}
                      onClick={() => handleDuplicate(template)}
                    >
                      Duplicate
                    </Button>
                    {!template.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconBefore={<Star size={14} />}
                        onClick={() => handleSetDefault(template)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      iconBefore={<Trash2 size={14} />}
                      onClick={() => setDeleteTarget(template)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      <Modal isOpen={deleteTarget !== null} title="Delete Template" onClose={() => setDeleteTarget(null)}>
        <p>Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.</p>
        <div className={cn(commonStyles.cardActions, commonStyles.actionRow)}>
          <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Delete</Button>
        </div>
      </Modal>

      {toast && (
        <div className={cn(commonStyles.toast, themeStyles.toast, toast.type === 'error' && themeStyles.toastError)}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
}
