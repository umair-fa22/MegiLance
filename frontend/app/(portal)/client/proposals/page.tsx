'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { proposalsApi } from '@/lib/api/projects';
import { portalApi } from '@/lib/api';
import { useToaster } from '@/app/components/molecules/Toast/ToasterProvider';
import Button from '@/app/components/atoms/Button/Button';
import Modal from '@/app/components/organisms/Modal/Modal';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import {
  Search, FileText, CheckCircle, XCircle, Clock, Briefcase,
  ChevronDown, ChevronUp, User, DollarSign, MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import common from './Proposals.common.module.css';
import light from './Proposals.light.module.css';
import dark from './Proposals.dark.module.css';

interface Proposal {
  id: number;
  project_id: number;
  project_title?: string;
  freelancer_id: number;
  freelancer_name?: string;
  freelancer_avatar?: string;
  cover_letter: string;
  bid_amount: number;
  estimated_hours?: number;
  hourly_rate?: number;
  availability?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface GroupedByProject {
  project_id: number;
  project_title: string;
  proposals: Proposal[];
}

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

function getStatusClass(status: string, themed: Record<string, string>) {
  const s = status?.toLowerCase();
  if (s === 'accepted' || s === 'approved') return cn(common.statusBadge, themed.statusAccepted);
  if (s === 'rejected' || s === 'declined') return cn(common.statusBadge, themed.statusRejected);
  if (s === 'pending' || s === 'submitted') return cn(common.statusBadge, themed.statusPending);
  return cn(common.statusBadge, themed.statusDefault);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ClientProposalsPage() {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  const router = useRouter();
  const toaster = useToaster();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());

  // Detail / action modal state
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await portalApi.client.getProposals();
      const raw: Proposal[] = Array.isArray(res)
        ? res
        : res?.proposals ?? res?.items ?? [];
      setProposals(raw);
    } catch {
      toaster.error('Failed to load proposals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const filtered = useMemo(() => {
    let result = proposals;
    if (activeTab !== 'all') {
      result = result.filter((p) => {
        const s = p.status?.toLowerCase();
        if (activeTab === 'pending') return s === 'pending' || s === 'submitted';
        if (activeTab === 'accepted') return s === 'accepted' || s === 'approved';
        if (activeTab === 'rejected') return s === 'rejected' || s === 'declined';
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.freelancer_name?.toLowerCase().includes(q) ||
          p.project_title?.toLowerCase().includes(q) ||
          p.cover_letter?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [proposals, activeTab, searchQuery]);

  const grouped: GroupedByProject[] = useMemo(() => {
    const map = new Map<number, GroupedByProject>();
    for (const p of filtered) {
      if (!map.has(p.project_id)) {
        map.set(p.project_id, {
          project_id: p.project_id,
          project_title: p.project_title || `Project #${p.project_id}`,
          proposals: [],
        });
      }
      map.get(p.project_id)!.proposals.push(p);
    }
    return Array.from(map.values());
  }, [filtered]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: proposals.length, pending: 0, accepted: 0, rejected: 0 };
    for (const p of proposals) {
      const s = p.status?.toLowerCase();
      if (s === 'pending' || s === 'submitted') counts.pending++;
      else if (s === 'accepted' || s === 'approved') counts.accepted++;
      else if (s === 'rejected' || s === 'declined') counts.rejected++;
    }
    return counts;
  }, [proposals]);

  const kpis = useMemo(() => ({
    total: proposals.length,
    pending: tabCounts.pending,
    accepted: tabCounts.accepted,
    avgBid: proposals.length
      ? Math.round(proposals.reduce((s, p) => s + p.bid_amount, 0) / proposals.length)
      : 0,
  }), [proposals, tabCounts]);

  const handleAccept = async (proposal: Proposal) => {
    setActionLoading(true);
    try {
      await proposalsApi.accept(proposal.id);
      toaster.success(`Proposal from ${proposal.freelancer_name || 'freelancer'} accepted! A contract has been created.`);
      setModalOpen(false);
      setSelectedProposal(null);
      fetchProposals();
      // Navigate to contracts after a short delay
      setTimeout(() => router.push('/client/contracts'), 1200);
    } catch (err: any) {
      const msg = err?.status === 409
        ? 'You have already accepted a proposal for this job.'
        : 'Failed to accept proposal. Please try again.';
      toaster.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;
    setActionLoading(true);
    try {
      await proposalsApi.reject(selectedProposal.id, rejectReason.trim() || 'Not a good fit at this time.');
      toaster.info(`Proposal from ${selectedProposal.freelancer_name || 'freelancer'} rejected.`);
      setRejectModalOpen(false);
      setModalOpen(false);
      setSelectedProposal(null);
      setRejectReason('');
      fetchProposals();
    } catch {
      toaster.error('Failed to reject proposal. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setModalOpen(true);
  };

  const toggleGroup = (projectId: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const isActionable = (status: string) => {
    const s = status?.toLowerCase();
    return s === 'pending' || s === 'submitted';
  };

  return (
    <PageTransition>
      <div className={cn(common.page, themed.page)}>
        {/* Header */}
        <ScrollReveal>
          <div className={common.header}>
            <div className={common.headerInfo}>
              <h1 className={cn(common.title, themed.title)}>Proposals</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                Review and respond to freelancer proposals for your projects.
              </p>
            </div>
            <Button variant="primary" onClick={() => router.push('/client/post-job')}>
              <Briefcase size={16} /> Post a Job
            </Button>
          </div>
        </ScrollReveal>

        {/* KPI Cards */}
        <ScrollReveal>
          <div className={common.kpiGrid}>
            {[
              { label: 'Total Proposals', value: kpis.total, icon: FileText },
              { label: 'Awaiting Review', value: kpis.pending, icon: Clock },
              { label: 'Accepted', value: kpis.accepted, icon: CheckCircle },
              { label: 'Avg. Bid', value: kpis.avgBid ? `$${kpis.avgBid.toLocaleString()}` : '—', icon: DollarSign },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className={cn(common.kpiCard, themed.kpiCard)}>
                <div className={cn(common.kpiIcon, themed.kpiIcon)}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className={cn(common.kpiLabel, themed.kpiLabel)}>{label}</p>
                  <p className={cn(common.kpiValue, themed.kpiValue)}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Toolbar */}
        <div className={common.toolbar}>
          <div className={common.searchWrapper}>
            <Search size={15} className={common.searchIcon} />
            <input
              type="text"
              placeholder="Search by freelancer, project, or keyword…"
              className={cn(common.searchInput, themed.searchInput)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={cn(common.tabBar, themed.tabBar)}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  common.tab,
                  themed.tab,
                  activeTab === tab.key && themed.tabActive,
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className={cn(
                  common.tabCount,
                  activeTab === tab.key ? themed.tabCountActive : themed.tabCount,
                )}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={common.emptyState}>
            <Clock size={40} className={common.emptyIcon} />
            <p className={cn(common.emptyTitle, themed.emptyTitle)}>Loading proposals…</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className={common.emptyState}>
            <FileText size={48} className={common.emptyIcon} />
            <h3 className={cn(common.emptyTitle, themed.emptyTitle)}>
              {activeTab === 'all' ? 'No proposals yet' : `No ${activeTab} proposals`}
            </h3>
            <p className={cn(common.emptyText, themed.emptyText)}>
              {activeTab === 'all'
                ? 'Once freelancers apply to your jobs, their proposals will appear here.'
                : `You have no ${activeTab} proposals matching your filters.`}
            </p>
            {activeTab === 'all' && (
              <Button variant="primary" onClick={() => router.push('/client/post-job')}>
                Post a Job
              </Button>
            )}
          </div>
        ) : (
          <StaggerContainer className="">
            {grouped.map((group) => {
              const isCollapsed = collapsedGroups.has(group.project_id);
              return (
                <StaggerItem key={group.project_id}>
                  <div className={cn(common.projectGroup, themed.projectGroup)}>
                    <div
                      className={cn(common.projectGroupHeader, themed.projectGroupHeader)}
                      onClick={() => toggleGroup(group.project_id)}
                      role="button"
                      aria-expanded={!isCollapsed}
                    >
                      <h3 className={cn(common.projectGroupTitle, themed.projectGroupTitle)}>
                        <Briefcase size={16} />
                        {group.project_title}
                      </h3>
                      <div className={common.projectGroupMeta}>
                        <span>{group.proposals.length} proposal{group.proposals.length !== 1 ? 's' : ''}</span>
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className={common.proposalList}>
                        {group.proposals.map((proposal) => (
                          <div
                            key={proposal.id}
                            className={cn(common.proposalRow, themed.proposalRow)}
                            onClick={() => openDetail(proposal)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && openDetail(proposal)}
                          >
                            <div className={common.proposalFreelancer}>
                              <div className={cn(common.proposalAvatar, themed.proposalAvatar)}>
                                {proposal.freelancer_avatar ? (
                                  <img
                                    src={proposal.freelancer_avatar}
                                    alt={proposal.freelancer_name}
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  getInitials(proposal.freelancer_name || 'FL')
                                )}
                              </div>
                              <div>
                                <p className={cn(common.proposalName, themed.proposalName)}>
                                  {proposal.freelancer_name || `Freelancer #${proposal.freelancer_id}`}
                                </p>
                                <p className={cn(common.proposalPreview, themed.proposalPreview)}>
                                  {proposal.cover_letter}
                                </p>
                              </div>
                            </div>

                            <p className={cn(common.proposalBid, themed.proposalBid)}>
                              ${proposal.bid_amount.toLocaleString()}
                            </p>

                            <p className={cn(common.proposalDate, themed.proposalDate)}>
                              {new Date(proposal.created_at).toLocaleDateString()}
                            </p>

                            <div className={common.proposalActions} onClick={(e) => e.stopPropagation()}>
                              <span className={getStatusClass(proposal.status, themed)}>
                                {proposal.status}
                              </span>
                              {isActionable(proposal.status) && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleAccept(proposal); }}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProposal(proposal);
                                      setRejectModalOpen(true);
                                    }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProposal && (
        <Modal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedProposal(null); }}
          title={`Proposal from ${selectedProposal.freelancer_name || 'Freelancer'}`}
          size="large"
        >
          <div className={common.modalContent}>
            <div className={common.modalGrid}>
              <div className={common.modalSection}>
                <p className={common.modalLabel}>Bid Amount</p>
                <p className={common.modalValue}>
                  <strong>${selectedProposal.bid_amount.toLocaleString()}</strong>
                </p>
              </div>
              {selectedProposal.estimated_hours && (
                <div className={common.modalSection}>
                  <p className={common.modalLabel}>Estimated Hours</p>
                  <p className={common.modalValue}>{selectedProposal.estimated_hours} hrs</p>
                </div>
              )}
              {selectedProposal.hourly_rate && (
                <div className={common.modalSection}>
                  <p className={common.modalLabel}>Hourly Rate</p>
                  <p className={common.modalValue}>${selectedProposal.hourly_rate}/hr</p>
                </div>
              )}
              <div className={common.modalSection}>
                <p className={common.modalLabel}>Availability</p>
                <p className={common.modalValue}>
                  {selectedProposal.availability?.replace(/_/g, ' ') || 'Immediate'}
                </p>
              </div>
              <div className={common.modalSection}>
                <p className={common.modalLabel}>Status</p>
                <span className={getStatusClass(selectedProposal.status, themed)}>
                  {selectedProposal.status}
                </span>
              </div>
              <div className={common.modalSection}>
                <p className={common.modalLabel}>Submitted</p>
                <p className={common.modalValue}>
                  {new Date(selectedProposal.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className={common.modalSection}>
              <p className={common.modalLabel}>Cover Letter</p>
              <p className={common.modalValue}>{selectedProposal.cover_letter}</p>
            </div>

            <div className={cn(common.modalActions, themed.modalActions)}>
              <Button
                variant="ghost"
                onClick={() => router.push(`/messages?userId=${selectedProposal.freelancer_id}`)}
              >
                <MessageSquare size={16} /> Message
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push(`/talent/${selectedProposal.freelancer_id}`)}
              >
                <User size={16} /> View Profile
              </Button>
              {isActionable(selectedProposal.status) && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => { setModalOpen(false); setRejectModalOpen(true); }}
                  >
                    <XCircle size={16} /> Reject
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={actionLoading}
                    onClick={() => handleAccept(selectedProposal)}
                  >
                    <CheckCircle size={16} /> Accept & Create Contract
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Reject reason Modal */}
      {selectedProposal && (
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => { setRejectModalOpen(false); setRejectReason(''); }}
          title="Reject Proposal"
          size="small"
        >
          <div className={common.rejectForm}>
            <AlertTriangle size={32} style={{ color: '#f87171', alignSelf: 'center' }} />
            <p className={common.rejectLabel}>
              Rejecting the proposal from <strong>{selectedProposal.freelancer_name || 'this freelancer'}</strong>.
              You can optionally provide a reason — it helps freelancers improve.
            </p>
            <textarea
              className={cn(common.rejectTextarea, themed.rejectTextarea)}
              placeholder="Optional: reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className={cn(common.modalActions, themed.modalActions)}>
              <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={actionLoading}
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageTransition>
  );
}
