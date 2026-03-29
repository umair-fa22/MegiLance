// @AI-HINT: Portal Wallet page. Theme-aware, accessible, animated balance and transactions. Fetches from payments API.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { PageTransition, ScrollReveal } from '@/app/components/Animations';
import common from './Wallet.common.module.css';
import light from './Wallet.light.module.css';
import dark from './Wallet.dark.module.css';

import api from '@/lib/api';

interface Txn {
  id: string;
  date: string;
  description: string;
  type: 'Payout' | 'Payment' | 'Refund' | 'Fee';
  amount: number;
}

const TYPES = ['All', 'Payment', 'Payout', 'Refund', 'Fee'] as const;
const RANGES = ['Any time', 'Past week', 'Past month', 'Past year'] as const;

const Wallet: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;

  const [allTxns, setAllTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<(typeof TYPES)[number]>('All');
  const [range, setRange] = useState<(typeof RANGES)[number]>('Past month');
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await api.payments.list(100); // Fetch up to 100 transactions
        
        // Transform API data to Txn format
        const transactions: Txn[] = (Array.isArray(data) ? data : []).map((p: any, idx: number) => {
          const amountStr = String(p.amount || '0');
          const isCredit = amountStr.startsWith('+') || p.direction === 'credit';
          const numericValue = parseFloat(amountStr.replace(/[$,+\-]/g, '') || '0');
          const amount = isCredit ? numericValue : -numericValue;
          
          let txnType: Txn['type'] = 'Payment';
          const desc = (p.description || '').toLowerCase();
          if (desc.includes('payout') || desc.includes('withdraw')) txnType = 'Payout';
          else if (desc.includes('refund')) txnType = 'Refund';
          else if (desc.includes('fee')) txnType = 'Fee';
          
          return {
            id: String(p.id || idx),
            date: p.date || new Date().toISOString().split('T')[0],
            description: p.description || 'Transaction',
            type: txnType,
            amount,
          };
        });

        setAllTxns(transactions);
        setError(null);
      } catch (err) {
        setError('Failed to load transactions');
        setAllTxns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const balance = useMemo(() => {
    return allTxns.reduce((sum, t) => sum + t.amount, 0);
  }, [allTxns]);

  const txns = useMemo(() => {
    const byType = type === 'All' ? allTxns : allTxns.filter(t => t.type === type);
    const dayMs = 24 * 60 * 60 * 1000;
    const within = (d: string) => {
      if (range === 'Any time') return true;
      const now = new Date();
      const dt = new Date(d);
      const diff = now.getTime() - dt.getTime();
      if (range === 'Past week') return diff <= 7 * dayMs;
      if (range === 'Past month') return diff <= 31 * dayMs;
      if (range === 'Past year') return diff <= 365 * dayMs;
      return true;
    };
    return byType.filter(t => within(t.date));
  }, [type, range, allTxns]);

  const exportCSV = () => {
    try {
      const header = ['id', 'date', 'description', 'type', 'amount'];
      const rows = txns.map(t => [t.id, t.date, t.description, t.type, t.amount.toString()]);
      const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ kind: 'success', msg: 'Transactions exported' });
    } catch (e) {
      setToast({ kind: 'error', msg: 'Export failed' });
    }
  };

  if (loading) {
    return (
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          <div className={common.loadingState}>
            <Loader2 className={common.spinner} size={32} />
            <span>Loading wallet...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className={cn(common.page, themed.themeWrapper)}>
        <div className={common.container}>
          {error && (
            <div className={cn(common.errorBanner, themed.errorBanner)}>
              {error}
            </div>
          )}
          <ScrollReveal>
            <div className={common.header}>
              <div>
                <h1 className={common.title}>Wallet</h1>
                <p className={cn(common.subtitle, themed.subtitle)}>Manage your balance, payouts, and transactions.</p>
              </div>
              <div className={common.controls} aria-label="Wallet filters">
                <label className={common.srOnly} htmlFor="type">Type</label>
                <select id="type" className={cn(common.select, themed.select)} value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>

                <label className={common.srOnly} htmlFor="range">Date range</label>
                <select id="range" className={cn(common.select, themed.select)} value={range} onChange={(e) => setRange(e.target.value as (typeof RANGES)[number])}>
                  {RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>

                <button type="button" className={cn(common.button, themed.button)} onClick={exportCSV}>Export CSV</button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className={common.grid}>
              <section className={cn(common.card, themed.card)} aria-label="Current balance">
                <div className={cn(common.cardTitle, themed.cardTitle)}>Balance</div>
                <div className={common.balance}>
                  <div className={common.amount}>${balance.toLocaleString()}</div>
                </div>
              </section>

              <section className={cn(common.card, themed.card)} aria-label="Transactions">
                <div className={cn(common.cardTitle, themed.cardTitle)}>Transactions</div>
                <table className={common.table}>
                  <thead>
                    <tr>
                      <th scope="col" className={themed.th + ' ' + common.th}>Date</th>
                      <th scope="col" className={themed.th + ' ' + common.th}>Description</th>
                      <th scope="col" className={themed.th + ' ' + common.th}>Type</th>
                      <th scope="col" className={themed.th + ' ' + common.th}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((t) => (
                      <tr key={t.id}>
                        <td className={themed.td + ' ' + common.td}>{t.date}</td>
                        <td className={themed.td + ' ' + common.td}>{t.description}</td>
                        <td className={themed.td + ' ' + common.td}>{t.type}</td>
                        <td className={themed.td + ' ' + common.td} aria-label={`Amount ${t.amount >= 0 ? '+' : ''}${t.amount.toLocaleString()}`}>
                          {(t.amount >= 0 ? '+' : '') + '$' + Math.abs(t.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </ScrollReveal>
        </div>

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={cn(common.toast, themed.toast, toast.kind === 'success' ? themed.toastSuccess : themed.toastError)}
          >
            {toast.msg}
          </div>
        )}
      </main>
    </PageTransition>
  );
};

export default Wallet;
