// @AI-HINT: Client Payments history. Theme-aware, accessible filters, KPI summary, and animated payments table.
'use client';

import React, { useState, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useClientData } from '@/hooks/useClient';
import { DollarSign, Search, Download, TrendingUp, TrendingDown, AlertTriangle, SearchX } from 'lucide-react';

import PaymentCard, { PaymentCardProps } from '@/app/components/PaymentCard/PaymentCard';
import DashboardWidget from '@/app/components/DashboardWidget/DashboardWidget';
import Input from '@/app/components/Input/Input';
import Select from '@/app/components/Select/Select';
import Button from '@/app/components/Button/Button';
import Pagination from '@/app/components/Pagination/Pagination';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { walletAnimation, errorAlertAnimation } from '@/app/components/Animations/LottieAnimation';
import Trend from '@/app/components/Trend/Trend';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';

import common from './Payments.common.module.css';
import light from './Payments.light.module.css';
import dark from './Payments.dark.module.css';

// Data transformation
const transformPaymentData = (payments: any[]): PaymentCardProps[] => {
  if (!Array.isArray(payments)) return [];
  return payments.map(p => ({
    id: p.id,
    date: p.date || new Date().toISOString(),
    project: p.project || 'Untitled Project',
    projectId: p.projectId || `proj_${p.id}`,
    freelancerName: p.freelancer || 'Unknown Freelancer',
    freelancerAvatarUrl: p.freelancerAvatarUrl, // Assuming this might exist
    amount: Number(p.amount?.replace(/[$,]/g, '')) || 0,
    status: p.status || 'Pending',
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => statusFilter === 'All' || p.status === statusFilter)
      .filter(p => 
        p.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.freelancerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [payments, statusFilter, searchQuery]);

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
  
  const kpis = useMemo(() => {
      const completed = payments.filter(p => p.status === 'Paid' || p.status === 'Completed');
      const totalPaid = completed.reduce((sum, p) => sum + p.amount, 0);
      const totalPending = payments
        .filter(p => p.status === 'Pending')
        .reduce((sum, p) => sum + p.amount, 0);
      const avgPayment = completed.length > 0 ? totalPaid / completed.length : 0;
      return { totalPaid, totalPending, avgPayment, completedCount: completed.length };
  }, [payments]);

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
              <Button variant="secondary" iconBefore={<Download size={16} />} onClick={() => {
                const csv = ['Date,Project,Freelancer,Amount,Status'].concat(
                  payments.map(p => `"${p.date}","${p.project}","${p.freelancerName}",${p.amount},${p.status}`)
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
                <Select id="sort-key" options={SORT_OPTIONS} value={sortKey} onChange={(e) => setSortKey(e.target.value)} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className={common.grid}>
            {Array.from({ length: itemsPerPage }).map((_, i) => <div key={i} className={common.skeletonCard} />)}
          </div>
        ) : paginatedPayments.length > 0 ? (
          <StaggerContainer className={common.grid}>
            {paginatedPayments.map(payment => (
              <StaggerItem key={payment.id}>
                <PaymentCard {...payment} />
              </StaggerItem>
            ))}
          </StaggerContainer>
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
      </div>
    </PageTransition>
  );
};

export default Payments;
