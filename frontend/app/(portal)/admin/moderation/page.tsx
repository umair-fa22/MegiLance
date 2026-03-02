// @AI-HINT: Admin Content Moderation page
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/Button/Button';
import Modal from '@/app/components/Modal/Modal';
import Badge from '@/app/components/Badge/Badge';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import Loader from '@/app/components/Loader/Loader';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import { ShieldAlert, Check, X, Eye, AlertTriangle, Flag, MessageSquare, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api/core';

import commonStyles from './Moderation.common.module.css';
import lightStyles from './Moderation.light.module.css';
import darkStyles from './Moderation.dark.module.css';

interface FlaggedItem {
  id: string;
  type: 'profile' | 'project' | 'message' | 'review';
  content: string;
  reporter: string;
  reason: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminModerationPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setMounted(true);
    loadFlaggedItems();
  }, []);

  const loadFlaggedItems = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<FlaggedItem[]>('/moderation/items');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // Endpoint may not exist yet — show empty state
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'profile': return <ShieldAlert size={18} />;
      case 'project': return <FileText size={18} />;
      case 'message': return <MessageSquare size={18} />;
      case 'review': return <Flag size={18} />;
      default: return <AlertTriangle size={18} />;
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/moderation/items/${id}/approve`, { method: 'POST' });
      setItems(items.map(item => item.id === id ? { ...item, status: 'approved' as const } : item));
      showToast('Item approved');
    } catch {
      setItems(items.map(item => item.id === id ? { ...item, status: 'approved' as const } : item));
      showToast('Item approved (offline)');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiFetch(`/moderation/items/${id}/reject`, { method: 'POST' });
      setItems(items.map(item => item.id === id ? { ...item, status: 'rejected' as const } : item));
      showToast('Item rejected');
    } catch {
      setItems(items.map(item => item.id === id ? { ...item, status: 'rejected' as const } : item));
      showToast('Item rejected (offline)');
    }
    setRejectTargetId(null);
  };

  if (!mounted) return null;

  const filteredItems = items.filter(item => filter === 'all' || item.status === filter);
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const approvedCount = items.filter(i => i.status === 'approved').length;
  const rejectedCount = items.filter(i => i.status === 'rejected').length;

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Content Moderation</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Review and moderate flagged content
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className={commonStyles.stats}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <AlertTriangle size={24} className={commonStyles.statIconWarning} />
              <div>
                <span className={commonStyles.statValue}>{pendingCount}</span>
                <span className={commonStyles.statLabel}>Pending Review</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <Check size={24} className={commonStyles.statIconSuccess} />
              <div>
                <span className={commonStyles.statValue}>{approvedCount}</span>
                <span className={commonStyles.statLabel}>Approved</span>
              </div>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <X size={24} className={commonStyles.statIconDanger} />
              <div>
                <span className={commonStyles.statValue}>{rejectedCount}</span>
                <span className={commonStyles.statLabel}>Rejected</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={commonStyles.filters}>
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={commonStyles.loadingWrap}><Loader size="lg" /></div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No flagged items"
            description={filter === 'all' ? 'No content has been flagged for moderation yet.' : `No ${filter} items found.`}
          />
        ) : (
          <StaggerContainer className={cn(commonStyles.itemsList, themeStyles.itemsList)}>
            {filteredItems.map(item => (
              <StaggerItem key={item.id} className={cn(commonStyles.item, themeStyles.item)}>
                <div className={commonStyles.itemHeader}>
                  <div className={commonStyles.itemType}>
                    {getTypeIcon(item.type)}
                    <span>{item.type}</span>
                  </div>
                  <Badge variant={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'default'}>
                    {item.status}
                  </Badge>
                </div>
                <p className={cn(commonStyles.itemContent, themeStyles.itemContent)}>{item.content}</p>
                <div className={commonStyles.itemMeta}>
                  <span>Reported by: {item.reporter}</span>
                  <span>Reason: {item.reason}</span>
                </div>
                {item.status === 'pending' && (
                  <div className={commonStyles.itemActions}>
                    <Button variant="ghost" size="sm" iconBefore={<Eye size={16} />}>View</Button>
                    <Button variant="success" size="sm" iconBefore={<Check size={16} />} onClick={() => handleApprove(item.id)}>Approve</Button>
                    <Button variant="danger" size="sm" iconBefore={<X size={16} />} onClick={() => setRejectTargetId(item.id)}>Reject</Button>
                  </div>
                )}
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Reject Confirmation Modal */}
        <Modal
          isOpen={rejectTargetId !== null}
          title="Reject Content"
          onClose={() => setRejectTargetId(null)}
        >
          <p className={commonStyles.confirmText}>
            Are you sure you want to reject this flagged content? This action may notify the content owner.
          </p>
          <div className={commonStyles.modalFooter}>
            <Button variant="secondary" onClick={() => setRejectTargetId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => rejectTargetId && handleReject(rejectTargetId)}>Reject</Button>
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
