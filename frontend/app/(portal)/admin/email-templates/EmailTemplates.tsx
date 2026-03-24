// @AI-HINT: Admin Email Templates page - CRUD management for email templates with preview and duplication
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { emailTemplatesApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Loading from '@/app/components/Loading/Loading';
import { PageTransition, ScrollReveal } from '@/components/Animations';
import {
  Mail, Plus, Search, Eye, Copy, Trash2, Edit3,
  Clock, FileText, X, AlertCircle
} from 'lucide-react';
import commonStyles from './EmailTemplates.common.module.css';
import lightStyles from './EmailTemplates.light.module.css';
import darkStyles from './EmailTemplates.dark.module.css';

interface EmailTemplate {
  id: string;
  template_type: string;
  name: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  variables?: string[];
  is_active?: boolean;
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function EmailTemplatesPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await emailTemplatesApi.list(true);
      const data = Array.isArray(res) ? res : (res as Record<string, unknown>).templates as EmailTemplate[] ?? [];
      setTemplates(data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load email templates:', err);
      }
      setError('Unable to load email templates.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (t: EmailTemplate) => {
    setPreviewTemplate(t);
    try {
      const res = await emailTemplatesApi.preview(t.id);
      setPreviewHtml((res as Record<string, unknown>).html as string ?? t.html_body ?? '<p>No preview available</p>');
    } catch {
      setPreviewHtml(t.html_body ?? '<p>Preview failed — showing raw template.</p>');
    }
  };

  const handleDuplicate = async (t: EmailTemplate) => {
    try {
      await emailTemplatesApi.duplicate(t.id);
      await loadTemplates();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Duplicate failed:', err);
      }
    }
  };

  const handleDelete = async (t: EmailTemplate) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    try {
      await emailTemplatesApi.delete(t.id);
      setTemplates(prev => prev.filter(x => x.id !== t.id));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete failed:', err);
      }
    }
  };

  const templateTypes = useMemo(() => {
    const types = new Set(templates.map(t => t.template_type));
    return ['all', ...Array.from(types)];
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (filterType !== 'all' && t.template_type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.template_type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [templates, search, filterType]);

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div className={commonStyles.headerInfo}>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>
                <Mail size={24} /> Email Templates
              </h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage email templates for platform communications
              </p>
            </div>
            <div className={commonStyles.headerActions}>
              <Button variant="primary" size="md" iconBefore={<Plus size={16} />}>
                New Template
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {error && (
          <div className={commonStyles.errorBanner}>
            <AlertCircle size={18} />
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={loadTemplates}>Retry</Button>
          </div>
        )}

        {loading ? (
          <Loading text="Loading templates..." />
        ) : (
          <>
            <ScrollReveal>
              <div className={commonStyles.toolbar}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                  <input
                    className={cn(commonStyles.searchInput, themeStyles.searchInput)}
                    style={{ paddingLeft: '2.25rem' }}
                    placeholder="Search templates..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className={commonStyles.filterGroup}>
                  {templateTypes.map(type => (
                    <button
                      key={type}
                      className={cn(commonStyles.filterBtn, themeStyles.filterBtn, filterType === type && commonStyles.filterBtnActive, filterType === type && themeStyles.filterBtnActive)}
                      onClick={() => setFilterType(type)}
                    >
                      {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {filtered.length === 0 ? (
              <div className={commonStyles.emptyState}>
                <div className={commonStyles.emptyIcon}><Mail size={48} /></div>
                <h3 className={cn(commonStyles.emptyTitle, themeStyles.emptyTitle)}>No Templates Found</h3>
                <p className={cn(commonStyles.emptyDesc, themeStyles.emptyDesc)}>
                  {search ? 'Try adjusting your search.' : 'Create your first email template.'}
                </p>
              </div>
            ) : (
              <ScrollReveal>
                <div className={commonStyles.templatesGrid}>
                  {filtered.map(t => (
                    <div key={t.id} className={cn(commonStyles.templateCard, themeStyles.templateCard)}>
                      <div className={commonStyles.cardHeader}>
                        <h4 className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}>
                          <Mail size={16} /> {t.name}
                        </h4>
                        <span className={cn(commonStyles.cardType, themeStyles.cardType)}>
                          {t.template_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className={cn(commonStyles.cardSubject, themeStyles.cardSubject)}>
                        Subject: {t.subject}
                      </p>
                      <div className={cn(commonStyles.cardMeta, themeStyles.cardMeta)}>
                        <span className={commonStyles.metaItem}>
                          <Clock size={12} /> {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className={commonStyles.metaItem}>
                          <FileText size={12} /> {t.variables?.length ?? 0} variables
                        </span>
                        <Badge variant={t.is_active !== false ? 'success' : 'warning'}>
                          {t.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className={commonStyles.cardActions}>
                        <Button variant="secondary" size="sm" iconBefore={<Eye size={14} />} onClick={() => handlePreview(t)}>Preview</Button>
                        <Button variant="secondary" size="sm" iconBefore={<Edit3 size={14} />}>Edit</Button>
                        <Button variant="secondary" size="sm" iconBefore={<Copy size={14} />} onClick={() => handleDuplicate(t)}>Duplicate</Button>
                        {t.is_custom && (
                          <Button variant="danger" size="sm" iconBefore={<Trash2 size={14} />} onClick={() => handleDelete(t)}>Delete</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </>
        )}

        {/* Preview Modal */}
        {previewTemplate && (
          <div className={commonStyles.previewModal}>
            <div className={commonStyles.previewOverlay} onClick={() => setPreviewTemplate(null)} />
            <div className={cn(commonStyles.previewContent, themeStyles.previewContent)}>
              <div className={commonStyles.previewHeader}>
                <h3 className={cn(commonStyles.previewTitle, themeStyles.previewTitle)}>
                  {previewTemplate.name}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(null)}>
                  <X size={20} />
                </Button>
              </div>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Subject: {previewTemplate.subject}</p>
              <div
                className={cn(commonStyles.previewBody, themeStyles.previewBody)}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
