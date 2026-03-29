// @AI-HINT: Client Payments history. Theme-aware, accessible filters, KPI summary, and animated payments table.
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import { DollarSign, Search, Download, TrendingUp, TrendingDown, AlertTriangle, SearchX, FileText, RefreshCw, Lock, CheckCircle, AlertCircle, Calendar, X } from 'lucide-react';

import PaymentCard, { PaymentCardProps } from '@/app/components/organisms/PaymentCard/PaymentCard';
import DashboardWidget from '@/app/components/molecules/DashboardWidget/DashboardWidget';
import Input from '@/app/components/atoms/Input/Input';
import Select from '@/app/components/molecules/Select/Select';
import Button from '@/app/components/atoms/Button/Button';
import Pagination from '@/app/components/molecules/Pagination/Pagination';
import EmptyState from '@/app/components/molecules/EmptyState/EmptyState';
import Modal from '@/app/components/organisms/Modal/Modal';
import { walletAnimation, errorAlertAnimation } from '@/app/components/Animations/LottieAnimation';
import Trend from '@/app/components/molecules/Trend/Trend';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

import common from './Payments.common.module.css';
import light from './Payments.light.module.css';
import dark from './Payments.dark.module.css';

// Data transformation
const transformPaymentData = (payments: any[]): (PaymentCardProps & { escrowStatus?: string; verified?: boolean; refundable?: boolean; taxYear?: number })[] => {
  if (!Array.isArray(payments)) return [];
  return payments.map(p => ({
    id: p.id,
    date: p.date || new Date().toISOString(),
    project: p.project || 'Untitled Project',
    projectId: p.projectId || `proj_${p.id}`,
    freelancerName: p.freelancer || 'Unknown Freelancer',
    freelancerAvatarUrl: p.freelancerAvatarUrl,
    amount: Number(p.amount?.replace(/[$,]/g, '')) || 0,
    status: p.status || 'Pending',
    escrowStatus: p.escrowStatus || (p.status === 'Completed' ? 'Released' : 'Held'),
    verified: p.verified || p.status === 'Completed',
    refundable: p.status === 'Failed' || p.status === 'Pending',
    taxYear: p.taxYear || new Date(p.date).getFullYear(),
  }));
};

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Most Recent' },
  { value: 'amount_desc', label: 'Amount (High to Low)' },
  { value: 'amount_asc', label: 'Amount (Low to High)' },
  { value: 'project', label: 'Project Name' },
];

const Payments: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const { payments: rawPayments, loading, error } = useClientData();
  const payments = useMemo(() => transformPaymentData(rawPayments || []), [rawPayments]);

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [taxYear, setTaxYear] = useState('All');
  const [refundRequest, setRefundRequest] = useState<{ paymentId: string; reason: string } | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  // Compute year options dynamically
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: 'All', label: 'All Years' },
      { value: String(currentYear), label: String(currentYear) },
      { value: String(currentYear - 1), label: String(currentYear - 1) },
      { value: String(currentYear - 2), label: String(currentYear - 2) },
    ];
  }, []);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => statusFilter === 'All' || p.status === statusFilter)
      .filter(p => taxYear === 'All' || p.taxYear === parseInt(taxYear))
      .filter(p => {
        if (!startDate || !endDate) return true;
        const pDate = new Date(p.date);
        return pDate >= new Date(startDate) && pDate <= new Date(endDate);
      })
      .filter(p =>
        p.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.freelancerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [payments, statusFilter, searchQuery, startDate, endDate, taxYear]);

  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      switch (sortKey) {
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc': return a.amount - b.amount;
        case 'project': return a.project.localeCompare(b.project);
        case 'date':
        default: return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [filteredPayments, sortKey]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPayments.slice(start, start + itemsPerPage);
  }, [sortedPayments, currentPage, itemsPerPage]);

  // Enhanced KPIs with tax information
  const kpis = useMemo(() => {
    const completed = payments.filter(p => p.status === 'Paid' || p.status === 'Completed');
    const totalPaid = completed.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => sum + p.amount, 0);
    const avgPayment = completed.length > 0 ? totalPaid / completed.length : 0;

    // Tax calculations (assuming 15% effective tax rate for freelancer payments)
    const taxableAmount = totalPaid;
    const estimatedTax = taxableAmount * 0.15;

    return {
      totalPaid,
      totalPending,
      avgPayment,
      completedCount: completed.length,
      estimatedTax,
      taxableAmount,
    };
  }, [payments]);

  // Bulk selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Refund handler
  const handleRefundRequest = useCallback(() => {
    if (refundRequest && refundReason.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Refund request submitted:', { paymentId: refundRequest.paymentId, reason: refundReason });
      }
      setShowRefundModal(false);
      setRefundRequest(null);
      setRefundReason('');
    }
  }, [refundRequest, refundReason]);

  // Bulk selection handlers
  const togglePaymentSelect = useCallback((paymentId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(paymentId)) next.delete(paymentId);
      else next.add(paymentId);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    if (selected.size === paginatedPayments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedPayments.map(p => p.id)));
    }
  }, [paginatedPayments, selected.size]);

  // PDF export handler
  const exportToPDF = useCallback(() => {
    const doc = `Payment History Report\n\nGenerated: ${new Date().toLocaleDateString()}\n\nSummary:\n- Total Paid: $${kpis.totalPaid.toLocaleString()}\n- Pending: $${kpis.totalPending.toLocaleString()}\n- Estimated Tax: $${kpis.estimatedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\nTransactions (${filteredPayments.length}):\n` +
      filteredPayments.map(p => `${p.date} | ${p.project} | ${p.freelancerName} | $${p.amount} | ${p.status}`).join('\n');

    const blob = new Blob([doc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [kpis, filteredPayments]);

  if (error) {
    return <EmptyState title="Error Loading Payments" description="There was an issue retrieving your payment history. Please try again later." icon={<AlertTriangle size={48} />} animationData={errorAlertAnimation} animationWidth={120} animationHeight={120} />;
  }

  return (
    <PageTransition>
      <div className={cn(common.page, themed.theme)}>
        <ScrollReveal>
          <header className={common.header}>
            <div>
              <h1 className={common.title}>Payments</h1>
              <p className={common.subtitle}>Review your transaction history and manage payments.</p>
            </div>
            <div className={common.actions}>
              <Button variant="secondary" iconBefore={<FileText size={16} />} onClick={exportToPDF}>Export PDF</Button>
              <Button variant="secondary" iconBefore={<Download size={16} />} onClick={() => {
                const csv = ['Date,Project,Freelancer,Amount,Status,Escrow,Verified'].concat(
                  payments.map(p => `"${p.date}","${p.project}","${p.freelancerName}",${p.amount},${p.status},"${p.escrowStatus}",${p.verified}`)
                ).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'payments.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}>Export CSV</Button>
            </div>
          </header>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <section className={common.kpiGrid}>
            <DashboardWidget icon={DollarSign} title="Total Paid" value={`$${kpis.totalPaid.toLocaleString()}`} trend={<Trend direction="up" value={`${kpis.completedCount} txns`} />} />
            <DashboardWidget icon={TrendingUp} title="Avg. Payment" value={`$${kpis.avgPayment.toFixed(2)}`} />
            <DashboardWidget icon={TrendingDown} title="Pending" value={`$${kpis.totalPending.toLocaleString()}`} trend={kpis.totalPending > 0 ? <Trend direction="down" value="pending" /> : undefined} />
            <DashboardWidget icon={FileText} title="Est. Tax (15%)" value={`$${kpis.estimatedTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
          </section>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className={common.controls}>
            <Input
              id="payment-search"
              iconBefore={<Search size={18} />}
              placeholder="Search by project or freelancer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={common.searchInput}
            />
            <div className={common.filtersRow}>
              <span className={cn(common.resultsCount, themed.resultsCount)}>
                {filteredPayments.length} result{filteredPayments.length !== 1 ? 's' : ''}
              </span>
              <div className={common.filters}>
                <Select id="status-filter" options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
                <Select id="tax-year" options={yearOptions} value={taxYear} onChange={(e) => setTaxYear(e.target.value)} />
                <Select id="sort-key" options={SORT_OPTIONS} value={sortKey} onChange={(e) => setSortKey(e.target.value)} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Date Range Filter */}
        <ScrollReveal delay={0.25}>
          <div className={common.dateRangeFilter}>
            <div>
              <label htmlFor="start-date" className={common.dateLabel}>Start Date:</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(common.dateInput, themed.dateInput)}
              />
            </div>
            <div>
              <label htmlFor="end-date" className={common.dateLabel}>End Date:</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(common.dateInput, themed.dateInput)}
              />
            </div>
            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
                Clear Dates
              </Button>
            )}
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={common.grid}>
            {Array.from({ length: itemsPerPage }).map((_, i) => <div key={i} className={common.skeletonCard} />)}
          </div>
        ) : paginatedPayments.length > 0 ? (
          <>
            {/* Bulk Selection Bar */}
            {paginatedPayments.length > 1 && (
              <div className={cn(common.selectionBar, { [common.selectionBarVisible]: paginatedPayments.length > 1 })}>
                <label className={common.selectAllCheckbox}>
                  <input
                    type="checkbox"
                    checked={paginatedPayments.length > 0 && selected.size === paginatedPayments.length}
                    onChange={selectAllVisible}
                  />
                  Select all visible
                </label>
                {selected.size > 0 && (
                  <div className={common.bulkActions}>
                    <span className={common.selectionCount}>{selected.size} selected</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
                    <Button variant="outline" size="sm" iconBefore={<Download size={14} />}>
                      Export Selected
                    </Button>
                  </div>
                )}
              </div>
            )}
            <StaggerContainer className={common.grid}>
              {paginatedPayments.map(payment => (
                <StaggerItem key={payment.id}>
                  <div className={cn(common.paymentCardWrapper, themed.paymentCardWrapper, { [common.paymentCardSelected]: selected.has(payment.id) })}>
                    <label className={common.paymentCheckbox}>
                      <input
                        type="checkbox"
                        checked={selected.has(payment.id)}
                        onChange={() => togglePaymentSelect(payment.id)}
                      />
                    </label>
                    <PaymentCard {...payment} />
                    <div className={common.paymentMeta}>
                      <div className={common.metaRow}>
                        {payment.verified && <span className={common.badge__verified}><CheckCircle size={14} /> Verified</span>}
                        {payment.escrowStatus && <span className={common.badge__escrow}><Lock size={14} /> {payment.escrowStatus}</span>}
                      </div>
                      {payment.refundable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={common.refundBtn}
                          onClick={() => { setRefundRequest({ paymentId: payment.id, reason: '' }); setShowRefundModal(true); }}
                        >
                          <RefreshCw size={14} /> Request Refund
                        </Button>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </>
        ) : (
          <EmptyState
            title={payments.length === 0 ? "No Payments Yet" : "No Matching Payments"}
            description={payments.length === 0
              ? "Your payment history will appear here once you fund a project milestone."
              : "No payments match your current filters. Try adjusting the status or date range."}
            icon={<SearchX size={48} />}
            animationData={walletAnimation}
            animationWidth={120}
            animationHeight={120}
          />
        )}

        {paginatedPayments.length > 0 && (
          <div className={common.paginationContainer}>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedPayments.length / itemsPerPage)}
              onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
              onNext={() => setCurrentPage(p => Math.min(Math.ceil(sortedPayments.length / itemsPerPage), p + 1))}
            />
          </div>
        )}

        {/* Refund Request Modal */}
        {showRefundModal && (
          <Modal
            isOpen={showRefundModal}
            onClose={() => { setShowRefundModal(false); setRefundRequest(null); setRefundReason(''); }}
            title="Request Refund"
          >
            <div className={common.refundModal}>
              <p className={common.refundModalText}>
                Please provide a reason for your refund request:
              </p>
              <textarea
                className={cn(common.refundTextarea, themed.refundTextarea)}
                placeholder="Explain why you need a refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
              />
              <div className={common.refundModalActions}>
                <Button variant="secondary" onClick={() => { setShowRefundModal(false); setRefundRequest(null); setRefundReason(''); }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleRefundRequest} disabled={!refundReason.trim()}>
                  Submit Refund Request
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageTransition>
  );
};

export default Payments;
