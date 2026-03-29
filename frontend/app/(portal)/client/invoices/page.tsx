// @AI-HINT: Client Invoices page - shows invoices the client has received from freelancers
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Button from '@/app/components/atoms/Button/Button';
import Loading from '@/app/components/atoms/Loading/Loading';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import { errorAlertAnimation, emptyBoxAnimation } from '@/app/components/Animations/LottieAnimation';
import { invoicesApi } from '@/lib/api';
import { 
  FileText, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';

import commonStyles from './Invoices.common.module.css';
import lightStyles from './Invoices.light.module.css';
import darkStyles from './Invoices.dark.module.css';

interface Invoice {
  id: string;
  invoice_number: string;
  freelancer_name: string;
  project_title: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

export default function ClientInvoicesPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await invoicesApi.list({ 
          status: statusFilter === 'all' ? undefined : statusFilter 
        });
        const invoicesList = Array.isArray(response) ? response : (response as any).invoices || [];
        
        const mappedInvoices = invoicesList.map((invoice: any) => ({
          id: invoice.id?.toString() || '',
          invoice_number: invoice.invoice_number || `INV-${invoice.id}`,
          freelancer_name: invoice.freelancer_name || 'Freelancer',
          project_title: invoice.project_title || 'Project',
          amount: invoice.amount || invoice.total || 0,
          status: invoice.status || 'pending',
          due_date: invoice.due_date || '',
          created_at: invoice.created_at || new Date().toISOString(),
        }));
        
        setInvoices(mappedInvoices);
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch invoices:', err);
        }
        setError(err.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchInvoices();
    }
  }, [mounted, statusFilter]);

  const themeStyles = mounted && resolvedTheme === 'dark' ? darkStyles : lightStyles;

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.freelancer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.project_title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, searchQuery]);

  const totals = useMemo(() => {
    return {
      all: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
      pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    };
  }, [invoices]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      paid: { color: 'success', icon: <CheckCircle size={14} /> },
      pending: { color: 'warning', icon: <Clock size={14} /> },
      overdue: { color: 'danger', icon: <AlertCircle size={14} /> },
      cancelled: { color: 'muted', icon: <AlertCircle size={14} /> },
    };
    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    return (
      <span className={cn(commonStyles.statusBadge, commonStyles[`status${config.color}`])}>
        {config.icon}
        {status}
      </span>
    );
  };

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div className={cn(commonStyles.container, themeStyles.container)}>
      <div className={commonStyles.header}>
        <div>
          <h1 className={cn(commonStyles.title, themeStyles.title)}>Invoices</h1>
          <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
            Manage invoices from your freelancers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={commonStyles.statsGrid}>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={commonStyles.statIcon}>
            <FileText size={24} />
          </div>
          <div>
            <span className={commonStyles.statLabel}>Total Invoiced</span>
            <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
              ${totals.all.toLocaleString()}
            </span>
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={cn(commonStyles.statIcon, commonStyles.statIconSuccess)}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span className={commonStyles.statLabel}>Paid</span>
            <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
              ${totals.paid.toLocaleString()}
            </span>
          </div>
        </div>
        <div className={cn(commonStyles.statCard, themeStyles.statCard)}>
          <div className={cn(commonStyles.statIcon, commonStyles.statIconWarning)}>
            <Clock size={24} />
          </div>
          <div>
            <span className={commonStyles.statLabel}>Pending</span>
            <span className={cn(commonStyles.statValue, themeStyles.statValue)}>
              ${totals.pending.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={cn(commonStyles.filters, themeStyles.filters)}>
        <div className={commonStyles.searchWrapper}>
          <Search size={18} className={commonStyles.searchIcon} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(commonStyles.searchInput, themeStyles.searchInput)}
          />
        </div>
        <div className={commonStyles.filterGroup}>
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(commonStyles.filterSelect, themeStyles.filterSelect)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <Loading />
      ) : error ? (
        <EmptyState
          title="Error loading invoices"
          description={error}
          animationData={errorAlertAnimation}
          animationWidth={110}
          animationHeight={110}
          action={<Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>}
        />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="You don't have any invoices yet."
          icon={<FileText size={48} />}
          animationData={emptyBoxAnimation}
          animationWidth={120}
          animationHeight={120}
        />
      ) : (
        <div className={cn(commonStyles.tableWrapper, themeStyles.tableWrapper)}>
          <table className={commonStyles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Freelancer</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className={themeStyles.tableRow}>
                  <td className={commonStyles.invoiceNumber}>{invoice.invoice_number}</td>
                  <td>{invoice.freelancer_name}</td>
                  <td className={commonStyles.projectCell}>{invoice.project_title}</td>
                  <td className={commonStyles.amountCell}>${invoice.amount.toLocaleString()}</td>
                  <td>
                    {invoice.due_date 
                      ? new Date(invoice.due_date).toLocaleDateString() 
                      : '-'}
                  </td>
                  <td>{getStatusBadge(invoice.status)}</td>
                  <td>
                    <div className={commonStyles.actionButtons}>
                      <Button variant="ghost" size="sm" title="View">
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" title="Download">
                        <Download size={16} />
                      </Button>
                      {invoice.status === 'pending' && (
                        <Button variant="primary" size="sm">Pay Now</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
