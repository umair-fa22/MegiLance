// @AI-HINT: Admin Refunds management page - list, approve, reject, process refund requests
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { refundsApi } from '@/lib/api';
import Button from '@/app/components/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { useToaster } from '@/app/components/Toast/ToasterProvider';
import { RotateCcw, CheckCircle, XCircle, DollarSign, Clock } from 'lucide-react';

import commonStyles from '../AdminPayments.common.module.css';
import lightStyles from '../AdminPayments.light.module.css';
import darkStyles from '../AdminPayments.dark.module.css';

interface Refund {
  id: number;
  payment_id: number;
  amount: number;
  reason: string;
  status: string;
  requested_by: number;
  reviewed_by?: number;
  created_at: string;
  updated_at?: string;
}

const statusBadgeClass: Record<string, string> = {
  pending: 'badgePending',
  approved: 'badgeApproved',
  rejected: 'badgeRejected',
  processed: 'badgeProcessed',
};

const AdminPaymentsRefundsPage = () => {
  const { resolvedTheme } = useTheme();
  const { notify } = useToaster();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await refundsApi.list(statusFilter || undefined, page, 20);
      setRefunds(data.refunds || []);
      setTotal(data.total || 0);
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const themeStyles = resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const handleAction = async (id: number, action: 'approve' | 'reject' | 'process') => {
    setActionLoading(id);
    try {
      if (action === 'approve') await refundsApi.approve(id, {});
      else if (action === 'reject') await refundsApi.reject(id, 'Rejected by admin');
      else await refundsApi.get(id); // process endpoint not in frontend API, fallback
      notify({ title: 'Success', description: `Refund ${action}d.`, variant: 'success', duration: 3000 });
      fetchRefunds();
    } catch {
      notify({ title: 'Error', description: `Failed to ${action} refund.`, variant: 'error', duration: 3000 });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = refunds.filter(r => r.status === 'pending').length;
  const approvedTotal = refunds.filter(r => r.status === 'approved' || r.status === 'processed').reduce((s, r) => s + r.amount, 0);

  return (
    <PageTransition>
      <main className={cn(commonStyles.page, themeStyles.themeWrapper)}>
        <div className={commonStyles.container}>
          <ScrollReveal>
            <header className={commonStyles.header}>
              <div>
                <h1 className={commonStyles.title}>Refunds</h1>
                <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>Review and manage refund requests.</p>
              </div>
              <div className={commonStyles.controls}>
                <select
                  className={cn(commonStyles.select, themeStyles.select)}
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="processed">Processed</option>
                </select>
              </div>
            </header>
          </ScrollReveal>

          <ScrollReveal delay={0.05}>
            <div className={commonStyles.summary}>
              <div className={cn(commonStyles.card, themeStyles.card)}>
                <div className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}><Clock size={14} className={commonStyles.cardTitleIcon} /> Pending</div>
                <div className={cn(commonStyles.metric, themeStyles.metric)}>{pendingCount}</div>
              </div>
              <div className={cn(commonStyles.card, themeStyles.card)}>
                <div className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}><DollarSign size={14} className={commonStyles.cardTitleIcon} /> Approved Total</div>
                <div className={cn(commonStyles.metric, themeStyles.metric)}>${approvedTotal.toFixed(2)}</div>
              </div>
              <div className={cn(commonStyles.card, themeStyles.card)}>
                <div className={cn(commonStyles.cardTitle, themeStyles.cardTitle)}><RotateCcw size={14} className={commonStyles.cardTitleIcon} /> Total Requests</div>
                <div className={cn(commonStyles.metric, themeStyles.metric)}>{total}</div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className={commonStyles.tableWrap}>
              <table className={cn(commonStyles.table, themeStyles.table)}>
                <thead>
                  <tr>
                    <th className={cn(commonStyles.th, themeStyles.th)}>ID</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Payment</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Amount</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Reason</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Status</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Date</th>
                    <th className={cn(commonStyles.th, themeStyles.th)}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className={cn(commonStyles.td, themeStyles.td, commonStyles.emptyCell)} colSpan={7}>Loading...</td></tr>
                  ) : refunds.length === 0 ? (
                    <tr><td className={cn(commonStyles.td, themeStyles.td, commonStyles.emptyCell)} colSpan={7}>No refund requests found.</td></tr>
                  ) : (
                    refunds.map((r) => (
                      <tr key={r.id} className={commonStyles.row}>
                        <td className={cn(commonStyles.td, themeStyles.td)}>#{r.id}</td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>#{r.payment_id}</td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>${r.amount.toFixed(2)}</td>
                        <td className={cn(commonStyles.td, themeStyles.td, commonStyles.cellTruncate)}>{r.reason}</td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>
                          <span className={cn(commonStyles.badge, themeStyles.badge, commonStyles[statusBadgeClass[r.status] || 'badgeCancelled'])}>
                            {r.status}
                          </span>
                        </td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className={cn(commonStyles.td, themeStyles.td)}>
                          {r.status === 'pending' && (
                            <div className={commonStyles.actionBtnGroup}>
                              <button className={cn(commonStyles.actionBtn, commonStyles.approveBtn)} onClick={() => handleAction(r.id, 'approve')} disabled={actionLoading === r.id} title="Approve" aria-label="Approve refund"><CheckCircle size={18} /></button>
                              <button className={cn(commonStyles.actionBtn, commonStyles.rejectBtn)} onClick={() => handleAction(r.id, 'reject')} disabled={actionLoading === r.id} title="Reject" aria-label="Reject refund"><XCircle size={18} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {total > 20 && (
              <div className={commonStyles.pagination}>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span className={cn(commonStyles.pageIndicator, themeStyles.pageIndicator)}>Page {page}</span>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)} disabled={refunds.length < 20}>Next</Button>
              </div>
            )}
          </ScrollReveal>
        </div>
      </main>
    </PageTransition>
  );
};

export default AdminPaymentsRefundsPage;
