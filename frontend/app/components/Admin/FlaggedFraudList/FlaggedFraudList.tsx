// @AI-HINT: This component displays a fully theme-aware list of items flagged for fraud. It fetches users from the admin API and runs fraud checks via /ai/fraud-check endpoints.
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Button from '@/app/components/Button/Button';
import Badge from '@/app/components/Badge/Badge';
import Card from '@/app/components/Card/Card';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import { User, CreditCard, ShieldCheck, ShieldOff, Search, ListFilter, Loader2 } from 'lucide-react';

import commonStyles from './FlaggedFraudList.common.module.css';
import lightStyles from './FlaggedFraudList.light.module.css';
import darkStyles from './FlaggedFraudList.dark.module.css';

interface FlaggedItem {
  id: string;
  type: 'User' | 'Transaction';
  identifier: string;
  reason: string;
  dateFlagged: string;
  status: 'Pending Review' | 'Resolved' | 'Dismissed';
  riskScore: number;
}

interface ApiUser {
  id: number;
  email: string;
  name: string;
  user_type: string;
  is_active: boolean;
  joined_at: string;
  location?: string;
  hourly_rate?: number;
}

interface FraudCheckResult {
  user_id: number;
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  recommendation: string;
}

export default function FlaggedFraudList() {
  const { resolvedTheme } = useTheme();
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending Review');
  const [typeFilter, setTypeFilter] = useState('All');

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    async function fetchFlaggedItems() {
      try {
        setLoading(true);
        
        // Fetch users from admin API
        const usersData = await api.admin.getUsers({ limit: 50 }) as any;
        const users: ApiUser[] = usersData.users ?? usersData ?? [];

        // Check fraud risk for each user (in parallel with rate limiting)
        const flaggedItems: FlaggedItem[] = [];
        
        // Process users in batches of 5 to avoid overwhelming the API
        for (let i = 0; i < Math.min(users.length, 20); i++) {
          const user = users[i];
          try {
            const fraudResult = await api.ai.checkFraud(user.id);
              
            // Only add users with elevated risk scores
            if (fraudResult.risk_score > 20) {
              flaggedItems.push({
                id: `fraud_user_${user.id}`,
                type: 'User',
                identifier: user.email,
                reason: fraudResult.risk_factors.length > 0 
                  ? fraudResult.risk_factors.join('. ') 
                  : 'Elevated risk detected by AI analysis',
                dateFlagged: user.joined_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                status: fraudResult.risk_score > 60 ? 'Pending Review' : 'Pending Review',
                riskScore: fraudResult.risk_score,
              });
            }
          } catch {
            // Continue with other users if one fails
          }
        }

        // Sort by risk score descending
        flaggedItems.sort((a, b) => b.riskScore - a.riskScore);
        setItems(flaggedItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flagged items');
      } finally {
        setLoading(false);
      }
    }

    fetchFlaggedItems();
  }, []);

  const handleAction = (id: string, newStatus: 'Resolved' | 'Dismissed') => {
    setItems(items.map(item => (item.id === id ? { ...item, status: newStatus } : item)));
  };

  const filteredItems = items
    .filter(item => statusFilter === 'All' || item.status === statusFilter)
    .filter(item => typeFilter === 'All' || item.type === typeFilter)
    .filter(item => item.identifier.toLowerCase().includes(searchTerm.toLowerCase()));

  const getRiskBadgeVariant = (score: number) => {
    if (score > 85) return 'danger';
    if (score > 60) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <header className={commonStyles.header}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>Flagged Fraud & Risk List</h2>
        </header>
        <div className={cn(commonStyles.loadingState, themeStyles.loadingState)}>
          <Loader2 className={commonStyles.spinner} size={32} />
          <span>Analyzing users for fraud risk...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <header className={commonStyles.header}>
          <h2 className={cn(commonStyles.title, themeStyles.title)}>Flagged Fraud & Risk List</h2>
        </header>
        <div className={cn(commonStyles.errorState, themeStyles.errorState)}>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <header className={commonStyles.header}>
        <h2 className={cn(commonStyles.title, themeStyles.title)}>Flagged Fraud & Risk List</h2>
        <p className={cn(commonStyles.description, themeStyles.description)}>
          Showing {filteredItems.length} of {items.length} flagged items.
        </p>
      </header>

      <div className={cn(commonStyles.filterToolbar, themeStyles.filterToolbar)}>
        <Input
          id="search-filter"
          placeholder="Search by identifier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          iconBefore={<Search size={16} />}
        />
        <div className={commonStyles.selectFilters}>
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Pending Review', label: 'Pending Review' },
              { value: 'Resolved', label: 'Resolved' },
              { value: 'Dismissed', label: 'Dismissed' },
            ]}
          />
          <Select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'All', label: 'All Types' },
              { value: 'User', label: 'Users' },
              { value: 'Transaction', label: 'Transactions' },
            ]}
          />
        </div>
      </div>

      <div className={commonStyles.itemList}>
        {filteredItems.map(item => (
          <Card key={item.id} className={cn(commonStyles.itemCard, themeStyles.itemCard)}>
            <div className={commonStyles.cardHeader}>
              <div className={commonStyles.identifier}>
                {item.type === 'User' ? <User size={18} /> : <CreditCard size={18} />}
                <span>{item.identifier}</span>
              </div>
              <Badge variant={getRiskBadgeVariant(item.riskScore)}>Risk: {item.riskScore}</Badge>
            </div>
            <p className={commonStyles.reason}>{item.reason}</p>
            <footer className={commonStyles.cardFooter}>
              <span className={commonStyles.date}>Flagged: {item.dateFlagged}</span>
              {item.status === 'Pending Review' ? (
                <div className={commonStyles.actions}>
                  <Button variant="success" size="sm" onClick={() => handleAction(item.id, 'Resolved')}>
                    <ShieldCheck size={14} /> Resolve
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAction(item.id, 'Dismissed')}>
                    <ShieldOff size={14} /> Dismiss
                  </Button>
                </div>
              ) : (
                <Badge variant={item.status === 'Resolved' ? 'success' : 'secondary'}>{item.status}</Badge>
              )}
            </footer>
          </Card>
        ))}
        {filteredItems.length === 0 && (
          <div className={cn(commonStyles.emptyState, themeStyles.emptyState)}>
            <ListFilter size={48} />
            <h3>No Matching Items</h3>
            <p>Adjust your filters or clear the search to see more items.</p>
          </div>
        )}
      </div>
    </div>
  );
}
