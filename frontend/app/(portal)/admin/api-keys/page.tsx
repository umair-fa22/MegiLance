// @AI-HINT: Admin API Keys management - Create, view, revoke API keys
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { apiKeysApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Modal from '@/app/components/Modal/Modal';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import commonStyles from './ApiKeys.common.module.css';
import lightStyles from './ApiKeys.light.module.css';
import darkStyles from './ApiKeys.dark.module.css';

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  permissions: string[];
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
  status: 'active' | 'expired' | 'revoked';
}

export default function ApiKeysPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ key: string; secret: string } | null>(null);
  
  // Create form
  const [newKey, setNewKey] = useState({
    name: '',
    permissions: [] as string[],
    expires_in_days: 90,
  });

  // Revoke confirmation + toast
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const availablePermissions = [
    { id: 'read:projects', label: 'Read Projects', description: 'View project data' },
    { id: 'write:projects', label: 'Write Projects', description: 'Create/update projects' },
    { id: 'read:users', label: 'Read Users', description: 'View user profiles' },
    { id: 'write:users', label: 'Write Users', description: 'Update user data' },
    { id: 'read:payments', label: 'Read Payments', description: 'View payment history' },
    { id: 'write:payments', label: 'Write Payments', description: 'Process payments' },
    { id: 'read:analytics', label: 'Read Analytics', description: 'View analytics data' },
    { id: 'admin', label: 'Full Admin', description: 'Full administrative access' },
  ];

  useEffect(() => {
    setMounted(true);
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysApi.list().catch(() => null) as any;
      
      const keysData: ApiKey[] = response?.keys || (Array.isArray(response) ? response : []);
      setApiKeys(keysData);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load API keys:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKey.name.trim()) return;
    
    try {
      const response = await apiKeysApi.create({
        name: newKey.name,
        scopes: newKey.permissions,
      } as any) as any;

      if (!response?.key) {
        showToast('Failed to create API key: no key returned', 'error');
        return;
      }
      // Show the new key (only shown once)
      setNewKeyData({
        key: response.key,
        secret: response.secret || '',
      });
      
      loadApiKeys();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create API key:', error);
      }
      showToast('Failed to create API key', 'error');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await apiKeysApi.revoke(keyId);
      setRevokeTargetId(null);
      showToast('API key revoked');
      loadApiKeys();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to revoke API key:', error);
      }
      showToast('Failed to revoke API key', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const togglePermission = (permId: string) => {
    setNewKey(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewKeyData(null);
    setNewKey({ name: '', permissions: [], expires_in_days: 90 });
  };

  if (!mounted) return null;

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={cn(commonStyles.loading, themeStyles.loading)}>Loading API keys...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        {/* Header */}
        <ScrollReveal>
          <div className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>API Keys</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage API keys for external integrations
              </p>
            </div>
            <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
              + Create New Key
            </Button>
          </div>
        </ScrollReveal>

        {/* Warning Banner */}
        <ScrollReveal delay={0.1}>
          <div className={cn(commonStyles.warning, themeStyles.warning)}>
            <span className={commonStyles.warningIcon}>⚠️</span>
            <div>
              <strong>Keep your API keys secure</strong>
              <p>Never share your API keys publicly or commit them to version control. 
                 Use environment variables instead.</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.2}>
          <div className={commonStyles.stats}>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statValue}>{apiKeys.length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Total Keys</span>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statValue}>{apiKeys.filter(k => k.status === 'active').length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Active</span>
            </div>
            <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
              <span className={commonStyles.statValue}>{apiKeys.filter(k => k.status === 'expired').length}</span>
              <span className={cn(commonStyles.statLabel, themeStyles.statLabel)}>Expired</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Keys List */}
        <div className={commonStyles.keysList}>
          {apiKeys.length === 0 ? (
            <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
              <span className={commonStyles.emptyIcon}>🔑</span>
              <p>No API keys created yet</p>
              <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
                Create your first API key
              </Button>
            </div>
          ) : (
            <StaggerContainer>
              {apiKeys.map((key) => (
                <StaggerItem key={key.id}>
                  <div className={cn(commonStyles.keyCard, themeStyles.keyCard)}>
                    <div className={commonStyles.keyHeader}>
                      <div className={commonStyles.keyInfo}>
                        <h3 className={cn(commonStyles.keyName, themeStyles.keyName)}>{key.name}</h3>
                        <code className={cn(commonStyles.keyPreview, themeStyles.keyPreview)}>
                          {key.key_preview}
                        </code>
                      </div>
                      <span className={cn(
                        commonStyles.status,
                        commonStyles[`status${key.status.charAt(0).toUpperCase() + key.status.slice(1)}`],
                        themeStyles[`status${key.status.charAt(0).toUpperCase() + key.status.slice(1)}`]
                      )}>
                        {key.status}
                      </span>
                    </div>

                    <div className={commonStyles.keyBody}>
                      <div className={commonStyles.permissions}>
                        <span className={cn(commonStyles.permissionsLabel, themeStyles.permissionsLabel)}>
                          Permissions:
                        </span>
                        <div className={commonStyles.permissionsList}>
                          {key.permissions.map((perm) => (
                            <span key={perm} className={cn(commonStyles.permission, themeStyles.permission)}>
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={cn(commonStyles.keyMeta, themeStyles.keyMeta)}>
                        <span>Created: {formatDate(key.created_at)}</span>
                        {key.last_used_at && <span>Last used: {formatTimeAgo(key.last_used_at)}</span>}
                        {key.expires_at && (
                          <span className={new Date(key.expires_at) < new Date() ? commonStyles.expired : ''}>
                            Expires: {formatDate(key.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={commonStyles.keyActions}>
                      {key.status === 'active' && (
                        <Button variant="danger" size="sm" onClick={() => setRevokeTargetId(key.id)}>
                          Revoke
                        </Button>
                      )}
                      <Button variant="secondary" size="sm">
                        View Logs
                      </Button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className={cn(commonStyles.modal, themeStyles.modal)}>
            <div className={cn(commonStyles.modalContent, themeStyles.modalContent)}>
              {newKeyData ? (
                // Show new key (only once)
                <>
                  <div className={commonStyles.modalHeader}>
                    <h2>API Key Created</h2>
                  </div>
                  <div className={commonStyles.modalBody}>
                    <div className={cn(commonStyles.successBanner, themeStyles.successBanner)}>
                      <span>✅</span>
                      <p><strong>Important:</strong> Copy your API key now. You won't be able to see it again!</p>
                    </div>

                    <div className={commonStyles.newKeyDisplay}>
                      <div className={commonStyles.formGroup}>
                        <label>API Key</label>
                        <div className={commonStyles.keyWithCopy}>
                          <code className={cn(commonStyles.fullKey, themeStyles.fullKey)}>
                            {newKeyData.key}
                          </code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newKeyData.key)} aria-label="Copy API key">
                            📋
                          </Button>
                        </div>
                      </div>

                      <div className={commonStyles.formGroup}>
                        <label>Secret</label>
                        <div className={commonStyles.keyWithCopy}>
                          <code className={cn(commonStyles.fullKey, themeStyles.fullKey)}>
                            {newKeyData.secret}
                          </code>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newKeyData.secret)} aria-label="Copy secret">
                            📋
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={commonStyles.modalFooter}>
                    <Button variant="primary" size="md" onClick={closeCreateModal}>
                      Done
                    </Button>
                  </div>
                </>
              ) : (
                // Create form
                <>
                  <div className={commonStyles.modalHeader}>
                    <h2>Create API Key</h2>
                    <button
                      className={cn(commonStyles.closeButton, themeStyles.closeButton)}
                      onClick={closeCreateModal}
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <div className={commonStyles.modalBody}>
                    <div className={commonStyles.formGroup}>
                      <label htmlFor="api-key-name">Key Name</label>
                      <Input
                        id="api-key-name"
                        value={newKey.name}
                        onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                        placeholder="e.g., Production API"
                      />
                    </div>

                    <div className={commonStyles.formGroup}>
                      <label>Expiration</label>
                      <Select
                        aria-label="Key expiration"
                        value={newKey.expires_in_days}
                        onChange={(e) => setNewKey({ ...newKey, expires_in_days: Number(e.target.value) })}
                        options={[
                          { value: 30, label: '30 days' },
                          { value: 60, label: '60 days' },
                          { value: 90, label: '90 days' },
                          { value: 180, label: '180 days' },
                          { value: 365, label: '1 year' },
                          { value: 0, label: 'Never expires' },
                        ]}
                      />
                    </div>

                    <div className={commonStyles.formGroup}>
                      <label>Permissions</label>
                      <div className={commonStyles.permissionsGrid}>
                        {availablePermissions.map((perm) => (
                          <label
                            key={perm.id}
                            className={cn(
                              commonStyles.permissionOption,
                              themeStyles.permissionOption,
                              newKey.permissions.includes(perm.id) && commonStyles.permissionSelected,
                              newKey.permissions.includes(perm.id) && themeStyles.permissionSelected
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={newKey.permissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                            />
                            <div>
                              <span className={commonStyles.permLabel}>{perm.label}</span>
                              <span className={cn(commonStyles.permDesc, themeStyles.permDesc)}>
                                {perm.description}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={commonStyles.modalFooter}>
                    <Button variant="secondary" size="md" onClick={closeCreateModal}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleCreateKey}
                      disabled={!newKey.name.trim() || newKey.permissions.length === 0}
                    >
                      Create Key
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      {revokeTargetId && (
        <Modal isOpen onClose={() => setRevokeTargetId(null)} title="Revoke API Key">
          <p className={commonStyles.confirmText}>Are you sure you want to revoke this API key? This action cannot be undone and any integrations using this key will stop working.</p>
          <div className={commonStyles.modalActions}>
            <Button variant="secondary" size="sm" onClick={() => setRevokeTargetId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => handleRevokeKey(revokeTargetId)}>Revoke Key</Button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(commonStyles.toast, toast.type === 'error' && commonStyles.toastError, themeStyles.toast)}>
          {toast.message}
        </div>
      )}
    </PageTransition>
  );
}
