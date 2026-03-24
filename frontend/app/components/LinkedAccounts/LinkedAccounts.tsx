// @AI-HINT: Displays linked social accounts (Google, GitHub) with link/unlink actions.
// Used in SecuritySettings. Fetches linked accounts from API, allows unlinking
// existing ones and linking new providers via OAuth flow.
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Link2, Unlink } from 'lucide-react';
import api from '@/lib/api';
import { LinkedAccount } from '@/lib/api/auth';
import Button from '@/app/components/Button/Button';

import common from './LinkedAccounts.common.module.css';
import light from './LinkedAccounts.light.module.css';
import dark from './LinkedAccounts.dark.module.css';

const PROVIDERS = [
  { id: 'google', name: 'Google', color: '#4285F4', letter: 'G' },
  { id: 'github', name: 'GitHub', color: '#24292e', letter: 'GH' },
];

const LinkedAccounts: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api.socialAuth.getLinkedAccounts();
      setAccounts(data.accounts || []);
    } catch {
      // Silently fail — section will show link buttons
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleUnlink = async (provider: string) => {
    setActionLoading(provider);
    setMessage(null);
    try {
      await api.socialAuth.unlinkAccount(provider);
      setAccounts((prev) => prev.filter((a) => a.provider !== provider));
      setMessage({ text: `${provider} account unlinked.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to unlink account.', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLink = async (provider: string) => {
    setActionLoading(provider);
    setMessage(null);
    try {
      const redirectUri = `${window.location.origin}/callback`;
      const response = await api.socialAuth.start(provider, redirectUri, undefined, 'link') as { authorization_url?: string };
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err: any) {
      setMessage({ text: err.message || `Failed to link ${provider}.`, type: 'error' });
      setActionLoading(null);
    }
  };

  return (
    <div className={cn(common.section, themed.section)}>
      <h2 className={cn(common.sectionTitle, themed.sectionTitle)}>
        <Link2 size={20} /> Linked Accounts
      </h2>

      {message && (
        <div className={cn(common.statusMessage, themed.statusMessage, message.type === 'error' && themed.statusMessageError)}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={common.loadingState}>
          <div className={cn(common.spinner, themed.spinner)} />
        </div>
      ) : (
        <div className={common.accountsList}>
          {PROVIDERS.map((provider) => {
            const linked = accounts.find((a) => a.provider === provider.id);
            const isActioning = actionLoading === provider.id;

            return (
              <div key={provider.id} className={cn(common.accountRow, themed.accountRow)}>
                <div
                  className={common.providerIcon}
                  style={{ backgroundColor: provider.color, color: '#fff' }}
                >
                  {provider.letter}
                </div>
                <div className={common.accountInfo}>
                  <div className={cn(common.providerName, themed.providerName)}>
                    {provider.name}
                  </div>
                  <div className={cn(common.accountEmail, themed.accountEmail)}>
                    {linked ? linked.email || linked.name || 'Connected' : 'Not connected'}
                  </div>
                </div>
                <div className={common.accountActions}>
                  {linked ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUnlink(provider.id)}
                      isLoading={isActioning}
                      disabled={isActioning}
                    >
                      <Unlink size={14} /> Unlink
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLink(provider.id)}
                      isLoading={isActioning}
                      disabled={isActioning}
                    >
                      <Link2 size={14} /> Link
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LinkedAccounts;
